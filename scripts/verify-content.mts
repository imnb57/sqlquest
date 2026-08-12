/**
 * Content integrity gate.
 *
 * Every query challenge is executed against a real Postgres (PGlite) instance:
 *   1. the dataset seeds cleanly,
 *   2. the reference solution runs without error,
 *   3. the solution satisfies its own `mustUse` / `mustNotUse` constraints,
 *   4. the solution returns at least one column (catching empty/typo'd SQL),
 *   5. DML challenges have a `verifyQuery`, and it runs,
 *   6. the starter code does NOT already pass (no accidental freebies).
 *
 * Also checks structural invariants: unique ids and slugs, valid `requires`
 * references, and that every referenced dataset exists.
 *
 * Run with: npm run verify:content
 */

import { PGlite } from "@electric-sql/pglite";
import { tracks, allLessons, curriculumStats } from "../src/content/curriculum.js";
import { tryGetDataset } from "../src/content/datasets.js";
import { isMutating, stripLiteralsAndComments } from "../src/lib/sql/statement.js";
import type { Challenge, QueryChallenge } from "../src/content/types.js";

const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";

const errors: string[] = [];
const warnings: string[] = [];

function fail(where: string, message: string) {
  errors.push(`${where}: ${message}`);
}
function warn(where: string, message: string) {
  warnings.push(`${where}: ${message}`);
}

/* ------------------------------------------------------ structural checks */

function checkStructure() {
  const lessonIds = new Set<string>();
  const lessonSlugs = new Set<string>();
  const challengeIds = new Set<string>();
  const allLessonIds = new Set(allLessons.map((r) => r.lesson.id));

  for (const track of tracks) {
    for (const unit of track.units) {
      for (const lesson of unit.lessons) {
        const where = `${track.slug}/${lesson.slug}`;

        if (lessonIds.has(lesson.id)) fail(where, `duplicate lesson id "${lesson.id}"`);
        lessonIds.add(lesson.id);

        if (lessonSlugs.has(lesson.slug)) fail(where, `duplicate lesson slug "${lesson.slug}"`);
        lessonSlugs.add(lesson.slug);

        if (!tryGetDataset(lesson.datasetId))
          fail(where, `unknown dataset "${lesson.datasetId}"`);

        for (const req of lesson.requires ?? []) {
          if (!allLessonIds.has(req)) fail(where, `requires unknown lesson "${req}"`);
        }

        if (lesson.challenges.length === 0) fail(where, "has no challenges");
        if (lesson.concepts.length === 0) warn(where, "has no concept blocks");

        for (const c of lesson.challenges) {
          if (challengeIds.has(c.id)) fail(where, `duplicate challenge id "${c.id}"`);
          challengeIds.add(c.id);
          checkChallengeShape(where, c);
        }
      }
    }
  }
}

function checkChallengeShape(where: string, c: Challenge) {
  const at = `${where}#${c.id}`;
  if (!c.prompt?.trim()) fail(at, "empty prompt");

  switch (c.type) {
    case "choice":
    case "predict": {
      const ids = new Set(c.options.map((o) => o.id));
      if (c.options.length < 2) fail(at, "needs at least 2 options");
      if (c.correct.length === 0) fail(at, "no correct answer");
      for (const id of c.correct) {
        if (!ids.has(id)) fail(at, `correct answer "${id}" is not an option`);
      }
      break;
    }
    case "fill-blank": {
      const blanks = (c.template.match(/___/g) ?? []).length;
      if (blanks !== c.answers.length)
        fail(at, `${blanks} blanks but ${c.answers.length} answers`);
      break;
    }
    case "order": {
      if (c.items.length < 2) fail(at, "needs at least 2 items");
      break;
    }
    case "debug": {
      const lines = c.brokenSql.split("\n").length;
      if (c.buggyLine < 0 || c.buggyLine >= lines)
        fail(at, `buggyLine ${c.buggyLine} out of range (0..${lines - 1})`);
      break;
    }
    case "query": {
      if (!c.solution?.trim()) fail(at, "missing solution");
      break;
    }
  }
}

/* --------------------------------------------------------- SQL execution */

function checkConstraints(at: string, c: QueryChallenge) {
  const cleaned = stripLiteralsAndComments(c.solution);
  for (const rule of c.grading?.mustUse ?? []) {
    if (!new RegExp(rule.pattern, "i").test(cleaned))
      fail(at, `solution violates its own mustUse rule (${rule.label})`);
  }
  for (const rule of c.grading?.mustNotUse ?? []) {
    if (new RegExp(rule.pattern, "i").test(cleaned))
      fail(at, `solution violates its own mustNotUse rule (${rule.label})`);
  }
}

/** Solutions that drive transactions themselves can't be wrapped in one. */
function managesOwnTransaction(sql: string): boolean {
  return /\b(begin|commit|rollback|savepoint)\b/i.test(stripLiteralsAndComments(sql));
}

async function checkQueries() {
  // Group lessons by dataset so each dataset is seeded once, not once per
  // challenge — seeding `warehouse` alone takes ~3.5s.
  type Ref = (typeof allLessons)[number];
  const byDataset = new Map<string, Ref[]>();
  for (const ref of allLessons) {
    const list = byDataset.get(ref.lesson.datasetId);
    if (list) list.push(ref);
    else byDataset.set(ref.lesson.datasetId, [ref]);
  }

  for (const [datasetId, refs] of byDataset) {
    const dataset = tryGetDataset(datasetId);
    if (!dataset) continue;

    const started = Date.now();
    let checked = 0;
    let db = await PGlite.create();
    await db.exec(dataset.sql);

    /** Isolates one challenge: DDL is transactional in Postgres, so this
     *  reliably undoes CREATE TABLE/INDEX/VIEW as well as INSERT/UPDATE. */
    const isolated = async (sql: string, run: () => Promise<void>) => {
      if (managesOwnTransaction(sql)) {
        await db.close().catch(() => undefined);
        db = await PGlite.create();
        await db.exec(dataset.sql);
        await run();
        await db.close().catch(() => undefined);
        db = await PGlite.create();
        await db.exec(dataset.sql);
        return;
      }
      await db.exec("BEGIN");
      try {
        await run();
      } finally {
        await db.exec("ROLLBACK").catch(() => undefined);
      }
    };

    for (const { lesson, track } of refs) {
      for (const c of lesson.challenges) {
        if (c.type !== "query") continue;
        const at = `${track.slug}/${lesson.slug}#${c.id}`;
        checkConstraints(at, c);

        if (isMutating(c.solution) && !c.verifyQuery) {
          fail(at, "mutating solution has no verifyQuery");
        }

        await isolated(c.solution, async () => {
          try {
            const res = await db.exec(c.solution, { rowMode: "array" });
            if (c.verifyQuery) {
              const v = await db.query(c.verifyQuery);
              if (v.fields.length === 0) fail(at, "verifyQuery returned no columns");
            } else {
              const last = res.at(-1);
              if (!last || last.fields.length === 0)
                fail(at, "solution returned no columns");
            }
            checked++;
          } catch (e) {
            fail(at, `solution failed: ${(e as Error).message.split("\n")[0]}`);
          }
        });

        // A starter that already solves the exercise is a content bug.
        const starterBody = c.starter?.replace(/--[^\n]*/g, "").trim() ?? "";
        if (starterBody.length > 12) {
          await isolated(starterBody, async () => {
            try {
              await db.exec(starterBody);
              warn(at, "starter runs without error — check it isn't the answer");
            } catch {
              /* expected: starters are deliberately incomplete */
            }
          });
        }
      }
    }

    await db.close().catch(() => undefined);
    console.log(
      `${GREEN}  ok${RESET} ${datasetId.padEnd(11)} ${String(checked).padStart(3)} query challenges  ${DIM}${Date.now() - started}ms${RESET}`,
    );
  }
}

/* ------------------------------------------------------------------ main */

console.log(`\n${DIM}Verifying curriculum…${RESET}\n`);
checkStructure();
await checkQueries();

console.log(
  `\n  ${curriculumStats.tracks} tracks · ${curriculumStats.units} units · ` +
    `${curriculumStats.lessons} lessons · ${curriculumStats.challenges} challenges · ` +
    `${curriculumStats.totalXp} XP`,
);

if (warnings.length) {
  console.log(`\n${YELLOW}  ${warnings.length} warning(s)${RESET}`);
  for (const w of warnings) console.log(`   ${YELLOW}!${RESET} ${w}`);
}

if (errors.length) {
  console.log(`\n${RED}  ${errors.length} error(s)${RESET}`);
  for (const e of errors) console.log(`   ${RED}✗${RESET} ${e}`);
  console.log();
  process.exit(1);
}

console.log(`\n${GREEN}  All content valid.${RESET}\n`);
