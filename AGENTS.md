<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- BEGIN:sqlquest -->

# SQLQuest — working notes

## Before you change lesson content
Run `npm run verify:content`. It boots a real PostgreSQL (PGlite/WASM) and executes
every reference solution. A lesson whose answer doesn't run, returns no columns, or
violates its own `mustUse`/`mustNotUse` rules will fail the check. This is also enforced
in CI, so a broken lesson can't be merged.

## Invariants worth preserving
- **The app must work with no database.** `DATABASE_URL` is optional; missing means guest
  mode, not an error. Never gate a learning route behind auth — server-side checks in the
  API route handlers are the real boundary.
- **Datasets must be deterministic.** No `random()`, no `now()` in stored values. Grading
  compares the learner's rows against the reference solution's rows, and both must be
  reproducible across resets.
- **No external network at runtime.** A strict CSP in `next.config.ts` blocks every
  outside host. Don't add a CDN font, script or image — generate assets locally instead
  (see `scripts/generate-lottie.mts`).
- **Don't fabricate data shown as real.** The homepage demo result in
  `components/marketing/hero-demo.tsx` is verified against the actual `guild` dataset;
  keep it that way. Same reason there's no `aggregateRating` in the JSON-LD.

## Where things live
- Curriculum: `src/content/tracks/*.ts` — plain typed objects, registered in `curriculum.ts`
- SQL engine: `src/lib/sql/` — `client.ts` (main thread), `engine.worker.ts`, `grade.ts`
- Game mechanics: `src/lib/gamification/` — pure functions, shared by client and server
- Progress: `src/stores/progress-store.ts` — local-first, synced opportunistically

## Checks
`npm run check` = typecheck + lint + content verification.

<!-- END:sqlquest -->
