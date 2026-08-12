# Roadmap

Where SQLQuest goes from "a SQL course" to a platform for people who work with
data — analysts, analytics engineers, data engineers, and the ML-adjacent.

This document is a plan, not a promise. It exists so that content written today
doesn't have to be migrated tomorrow.

---

## The thesis

The hard part of this product was never the SQL curriculum. It was building a
**real execution engine in the browser** and a grader that runs code instead of
comparing strings. That machinery is domain-agnostic — and it's the reason a
second vertical is weeks of work rather than a rewrite.

Everything already generalises:

| Already generic | Currently SQL-specific |
|---|---|
| Track → Unit → Lesson → Challenge model | `SqlEngine` / PGlite worker |
| XP, levels, streaks, hearts, achievements | `Dataset.sql` seeding |
| Progress store, local-first sync | Result-set comparison in `lib/sql/grade.ts` |
| Design system, lesson player, capstone workspace | |
| SEO, sitemap, JSON-LD, OG generation | |
| `verify:content` — executes every solution in CI | |

The three SQL-specific seams are pinned behind one interface in
[`src/lib/runtime/types.ts`](src/lib/runtime/types.ts): `ExerciseRuntime`.

```ts
interface ExerciseRuntime {
  boot(); loadFixture(f); reset();
  run(source); grade(submission, solution, constraints?, observe?);
  introspect(); dispose();
}
```

Every candidate runtime is *also* a WASM module in a Web Worker, so the parts
that were genuinely hard — boot orchestration, request correlation, the
kill-and-respawn timeout — transfer without change.

> **Status:** the interface is written and the SQL runtime matches its shape.
> No second runtime is implemented yet. That's the next piece of work, not a
> completed one.

---

## Verticals

### 1. SQL — shipped

6 tracks, 44 lessons, 237 challenges, 3 capstone projects. Runtime: PGlite
(PostgreSQL 17 compiled to WASM).

**Known gap:** there is no *reference* layer. We teach ~35 keywords and
functions; Postgres has ~700 functions and ~120 keywords. A learner who
finishes Foundations and opens the playground has a blank editor and nowhere to
look things up. The glossary (39 entries) is conceptual, not a manual.

→ **Next: a ~140-entry reference library** — clauses, operators, aggregate /
window / string / date / math / JSON functions, DDL, DML, transactions,
performance — surfaced as a searchable panel *inside* the playground, with
every example executed by the existing CI gate.

### 2. Python & pandas — next

Runtime: **Pyodide**. Ships numpy, pandas and scikit-learn as WASM wheels; same
worker pattern as PGlite.

- Fixtures become a CSV/parquet asset plus a setup script
- Grading compares a resulting DataFrame — the same multiset comparison, with
  dtype-aware normalisation
- Natural bridge content: "the same question in SQL and in pandas", which is a
  genuinely useful mental model and something no competitor teaches side by side

Open question: Pyodide's payload is ~10 MB before packages. Load it lazily per
lesson, and never on the marketing site.

### 3. Big data — after Python

Runtime: **DuckDB-WASM**. Columnar, reads parquet directly, and fast enough
in-browser to make partitioning, projection pushdown and join strategy
*observable* rather than theoretical.

Covers the ideas that matter without pretending to run a cluster: file formats
(parquet vs CSV), predicate/projection pushdown, partitioning, shuffles and
skew, and reading a distributed query plan. Spark and dbt are taught as
*concepts and syntax* against DuckDB semantics — honest about what's simulated.

### 4. Data modelling & diagrams — started

The ER diagram editor ships today at `/tools/diagram`.

Already working:
- Canvas with tables, columns, keys, and column-level foreign keys
- **Diagram → DDL**, with foreign keys emitted as separate `ALTER TABLE`
  statements so the script runs in any order
- **SQL → diagram**, with *no parser*: the DDL is executed in a throwaway
  PGlite database and `information_schema` is read back, so anything Postgres
  accepts imports exactly
- Import any course dataset, undo/redo, JSON + SQL export, local persistence

Next:
- **UML class diagrams** — same graph, different node renderer and semantics
- **Graded modelling exercises** — "normalise this to 3NF", "model this
  business", scored by structural comparison rather than pixel position. This
  is where the diagram editor stops being a tool and becomes curriculum
- **Auto-layout** so imported schemas don't need manual arrangement
- **PNG/SVG export** for putting in a doc
- **Schema diff** — two diagrams in, the `ALTER` migration out

### 5. AI / ML — furthest out

Runtime: Pyodide + scikit-learn. Graded on *metrics*, not output text: train a
model, hit an F1 threshold on a held-out split. Feature engineering in SQL
feeding a model in Python is the through-line that makes this one product
rather than two.

Deliberately not: deep learning. Training anything meaningful in a browser tab
is a promise the runtime can't keep, and pretending otherwise would break the
"real tools, real behaviour" contract the rest of the product is built on.

---

## Tools for data engineers

Standalone utilities, each useful without an account. They're also the cheapest
acquisition channel we have — people search for these by name.

| Tool | Status | Notes |
|---|---|---|
| ER diagram editor | **shipped** | `/tools/diagram` |
| SQL playground | **shipped** | `/playground` |
| Query plan visualiser | planned | `EXPLAIN (FORMAT JSON)` → flame/tree view. PGlite already produces the plans; this is presentation |
| DDL ⇄ diagram | **shipped** | Both directions |
| Schema diff / migration generator | planned | Two schemas in, `ALTER` script out |
| Mock data generator | planned | Schema in, deterministic seed SQL out |
| SQL formatter | partial | `lib/sql/statement.ts` — needs a real grammar |
| DAG / pipeline designer | planned | Same canvas engine as the ERD; exports Airflow or dbt scaffolding |
| Regex & JSONPath tester | planned | Small, high-traffic, trivially runnable in-browser |

---

## Sequencing

1. **Reference library** — closes the readiness gap the capstones exposed
2. **Query plan visualiser** — high value, low cost, reuses the engine
3. **Pyodide runtime spike** → validates `ExerciseRuntime` with a real second engine
4. **Python & pandas track** — the first true second vertical
5. **Graded modelling exercises** — turns the diagram editor into curriculum
6. **DuckDB / big data**
7. **AI/ML**

Content is written against the generic model from here on. New verticals should
require *zero* changes to the player, the progress store, or the gamification
layer — if a vertical needs one, that's a signal the abstraction is wrong.

---

## Principles that shouldn't be traded away

- **Real engines, real errors.** No simulated behaviour presented as real. If
  something is a simplification, the lesson says so.
- **Grade by executing.** Never by matching text. Any correct approach passes.
- **Local-first.** The product works signed out and offline. The server is a
  backup and a leaderboard, never the hot path.
- **Nothing leaves the device.** No CDN, no external host, strict CSP. Fonts,
  animations and the WASM engine are all served from our own origin.
- **Content correctness is enforced by CI**, not review. Every reference
  solution is executed against a real database before it can merge.
- **Free.** No paywalled lessons. If monetisation happens it's teams/SSO/private
  content — never taking away something that was free.
