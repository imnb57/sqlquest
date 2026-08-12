import type { Track } from "../types";

/**
 * Track 6 — Performance & Query Tuning.
 *
 * Runs against `warehouse` (50,000 generated rows) so plan choices are real:
 * a sequential scan genuinely costs more than an index scan here.
 *
 * EXPLAIN output isn't stable enough to grade by comparison, so plan-reading
 * is taught through choice/predict challenges, while the query challenges
 * cover things with deterministic results — creating indexes, and rewriting
 * a slow query into a fast one that returns identical rows.
 */
export const performance: Track = {
  id: "performance",
  slug: "performance",
  title: "Performance & Tuning",
  subtitle: "Make it fast, and know why it's fast",
  description:
    "The difference between a query that takes 8 milliseconds and one that takes 8 seconds is rarely the hardware. Learn to read an execution plan, choose the right index, and recognise the anti-patterns that quietly destroy performance at scale.",
  level: "Expert",
  glyph: "⚡",
  accent: "from-yellow-400 to-amber-500",
  outcomes: [
    "Read an EXPLAIN ANALYZE plan and find the expensive node",
    "Choose index types and column order deliberately",
    "Recognise when an index will be ignored — and why",
    "Rewrite common anti-patterns into fast equivalents",
  ],
  units: [
    {
      id: "p-u1",
      slug: "reading-plans",
      title: "Reading Plans",
      description: "What the database actually does with your query.",
      accent: "amber",
      lessons: [
        {
          id: "p-explain",
          slug: "explain-basics",
          title: "EXPLAIN & EXPLAIN ANALYZE",
          subtitle: "See the plan before you guess",
          objective: "Interpret an execution plan and identify the bottleneck",
          difficulty: "hard",
          estimatedMinutes: 12,
          datasetId: "warehouse",
          keywords: ["EXPLAIN ANALYZE", "postgres query plan", "sequential scan", "query optimization"],
          concepts: [
            {
              title: "EXPLAIN predicts, ANALYZE measures",
              body: "`EXPLAIN` shows the plan the optimiser *chose* along with estimated costs. `EXPLAIN ANALYZE` actually runs the query and reports real timings and row counts. Both are worth reading — the gap between estimate and reality is where problems hide.",
              example: {
                sql: "EXPLAIN ANALYZE\nSELECT * FROM shipments WHERE carrier = 'Dawnline';",
              },
            },
            {
              title: "Read plans inside-out",
              body: "The most indented nodes run first, feeding their parents. The top line is the last thing to happen. Each node reports `cost=startup..total rows=N width=B`; for `ANALYZE` you also get `actual time` and `loops`.",
            },
            {
              title: "The estimate/actual gap is the tell",
              body: "`rows=12 ... actual rows=48000` means the planner was badly wrong, and it probably picked a bad strategy as a result. Stale statistics (`ANALYZE`) or correlated columns are the usual causes.",
              tone: "tip",
            },
            {
              title: "Seq Scan isn't automatically bad",
              body: "Reading a whole small table sequentially beats bouncing through an index. Postgres switches to a sequential scan when it expects to touch a large fraction of the rows — that's usually the right call.",
              tone: "warning",
            },
          ],
          challenges: [
            {
              id: "p-ex-1",
              type: "choice",
              prompt: "What does `EXPLAIN ANALYZE` do that `EXPLAIN` alone does not?",
              options: [
                { id: "a", label: "Shows the estimated cost" },
                { id: "b", label: "Actually executes the query and reports real timings and row counts" },
                { id: "c", label: "Rewrites the query to be faster" },
                { id: "d", label: "Creates the indexes it recommends" },
              ],
              correct: ["b"],
              explanation:
                "Because it really runs, `EXPLAIN ANALYZE` on an `UPDATE` or `DELETE` will change your data. Wrap it in `BEGIN; ... ROLLBACK;` when experimenting.",
              difficulty: "easy",
            },
            {
              id: "p-ex-2",
              type: "query",
              prompt:
                "Run `EXPLAIN` on a query selecting all shipments for carrier `Dawnline`. (Any valid EXPLAIN of that query counts.)",
              solution: "EXPLAIN SELECT * FROM shipments WHERE carrier = 'Dawnline';",
              grading: { mustUse: [{ pattern: "\\bexplain\\b", label: "`EXPLAIN`" }] },
              explanation:
                "With no index on `carrier`, expect a `Seq Scan` — Postgres reads all 50,000 rows and discards most of them.",
              difficulty: "easy",
            },
            {
              id: "p-ex-3",
              type: "choice",
              prompt:
                "A plan node reads `Seq Scan on shipments (cost=0.00..1234.00 rows=12 width=48) (actual time=0.03..41.2 rows=9891 loops=1)`. What's the problem?",
              options: [
                { id: "a", label: "The width is too large" },
                { id: "b", label: "The planner expected 12 rows but got 9,891 — its estimate is badly wrong" },
                { id: "c", label: "loops=1 means the query ran only once" },
                { id: "d", label: "Nothing — the timings are fine" },
              ],
              correct: ["b"],
              explanation:
                "A three-order-of-magnitude misestimate usually means a downstream join strategy was chosen for the wrong data size. Run `ANALYZE` first; if it persists, look at correlated predicates or extended statistics.",
              difficulty: "expert",
            },
            {
              id: "p-ex-4",
              type: "order",
              prompt:
                "This plan is nested. Order the nodes from **first executed** to **last**.",
              items: [
                "Seq Scan on warehouses",
                "Hash",
                "Seq Scan on shipments",
                "Hash Join",
                "Aggregate",
              ],
              explanation:
                "The hash side is built first, then the outer relation is scanned and probed against it, then the join output is aggregated.",
              difficulty: "hard",
            },
            {
              id: "p-ex-5",
              type: "choice",
              prompt: "When is a sequential scan the *right* choice?",
              options: [
                { id: "a", label: "Never — always add an index" },
                { id: "b", label: "When the query touches a large fraction of the table, or the table is small" },
                { id: "c", label: "Only on tables without a primary key" },
                { id: "d", label: "When the table has more than a million rows" },
              ],
              correct: ["b"],
              difficulty: "medium",
            },
          ],
        },
        {
          id: "p-indexes",
          slug: "indexes",
          title: "Indexes",
          subtitle: "The single biggest lever you have",
          objective: "Create the right index for a given query",
          difficulty: "expert",
          estimatedMinutes: 14,
          datasetId: "warehouse",
          requires: ["p-explain"],
          keywords: ["postgres index", "B-tree index", "composite index", "partial index", "covering index"],
          concepts: [
            {
              title: "B-tree is the default and usually right",
              body: "It serves equality, ranges, sorting and prefix `LIKE 'abc%'`. Reach for GIN when indexing arrays, JSONB or full-text; BRIN when a huge table is naturally ordered by the column (timestamps in an append-only log).",
              example: {
                sql: "CREATE INDEX idx_shipments_carrier ON shipments (carrier);",
              },
            },
            {
              title: "Composite index column order matters",
              body: "An index on `(a, b)` can serve `WHERE a = ?`, `WHERE a = ? AND b = ?`, and `ORDER BY a, b`. It generally *cannot* serve `WHERE b = ?` alone. Put the equality columns first, the range column last.",
              tone: "warning",
            },
            {
              title: "Partial indexes are small and fast",
              body: "`CREATE INDEX ... WHERE status = 'in_transit'` indexes only the rows you actually query. When the hot subset is 2% of the table, the index is 2% of the size.",
              tone: "tip",
              example: {
                sql: "CREATE INDEX idx_active_shipments\nON shipments (shipped_on)\nWHERE status = 'in_transit';",
              },
            },
            {
              title: "Indexes aren't free",
              body: "Every index must be updated on every INSERT, UPDATE and DELETE, and it consumes disk and cache. Unused indexes are pure cost — check `pg_stat_user_indexes` and drop the ones nothing reads.",
            },
          ],
          challenges: [
            {
              id: "p-ix-1",
              type: "query",
              prompt:
                "Create a B-tree index named `idx_shipments_carrier` on `shipments(carrier)`.",
              solution: "CREATE INDEX idx_shipments_carrier ON shipments (carrier);",
              verifyQuery:
                "SELECT indexname FROM pg_indexes WHERE tablename = 'shipments' ORDER BY indexname;",
              difficulty: "easy",
            },
            {
              id: "p-ix-2",
              type: "query",
              prompt:
                "Create a composite index `idx_shipments_status_date` on `shipments(status, shipped_on)`.",
              solution:
                "CREATE INDEX idx_shipments_status_date ON shipments (status, shipped_on);",
              verifyQuery:
                "SELECT indexname FROM pg_indexes WHERE tablename = 'shipments' ORDER BY indexname;",
              difficulty: "medium",
            },
            {
              id: "p-ix-3",
              type: "query",
              prompt:
                "Create a **partial** index `idx_shipments_lost` on `shipments(shipped_on)` limited to rows where `status = 'lost'`.",
              solution:
                "CREATE INDEX idx_shipments_lost ON shipments (shipped_on) WHERE status = 'lost';",
              verifyQuery:
                "SELECT indexname FROM pg_indexes WHERE tablename = 'shipments' ORDER BY indexname;",
              grading: { mustUse: [{ pattern: "\\bwhere\\b", label: "a `WHERE` clause on the index" }] },
              difficulty: "hard",
            },
            {
              id: "p-ix-4",
              type: "choice",
              prompt:
                "You have an index on `(warehouse_id, shipped_on)`. Which query can it **not** help?",
              options: [
                { id: "a", label: "WHERE warehouse_id = 3", code: true },
                { id: "b", label: "WHERE warehouse_id = 3 AND shipped_on > '2024-01-01'", code: true },
                { id: "c", label: "WHERE shipped_on > '2024-01-01'", code: true },
                { id: "d", label: "ORDER BY warehouse_id, shipped_on", code: true },
              ],
              correct: ["c"],
              explanation:
                "A composite index is sorted by its first column. Without a predicate on `warehouse_id`, the entries you want are scattered throughout the index — the planner will usually just scan the table instead.",
              difficulty: "expert",
            },
            {
              id: "p-ix-5",
              type: "choice",
              prompt: "Which index type suits a `jsonb` column queried with containment (`@>`)?",
              options: [
                { id: "a", label: "B-tree" },
                { id: "b", label: "GIN" },
                { id: "c", label: "BRIN" },
                { id: "d", label: "Hash" },
              ],
              correct: ["b"],
              explanation:
                "GIN indexes the elements *inside* a composite value — ideal for JSONB keys, array membership and full-text search.",
              difficulty: "hard",
            },
            {
              id: "p-ix-6",
              type: "choice",
              prompt: "What is the main cost of adding an index?",
              options: [
                { id: "a", label: "Reads get slower" },
                { id: "b", label: "Every write must maintain it, plus disk and cache footprint" },
                { id: "c", label: "It locks the table permanently" },
                { id: "d", label: "It disables sequential scans" },
              ],
              correct: ["b"],
              difficulty: "medium",
            },
          ],
        },
      ],
    },
    {
      id: "p-u2",
      slug: "writing-fast-sql",
      title: "Writing Fast SQL",
      description: "Anti-patterns, and the rewrites that fix them.",
      accent: "yellow",
      lessons: [
        {
          id: "p-antipatterns",
          slug: "anti-patterns",
          title: "Anti-patterns",
          subtitle: "The habits that quietly kill throughput",
          objective: "Recognise and rewrite queries that defeat the optimiser",
          difficulty: "expert",
          estimatedMinutes: 13,
          datasetId: "warehouse",
          requires: ["p-indexes"],
          keywords: ["SQL anti-patterns", "sargable query", "SELECT star", "N+1 query", "OFFSET pagination"],
          concepts: [
            {
              title: "Wrapping a column in a function kills the index",
              body: "`WHERE date_trunc('day', shipped_on) = '2024-01-05'` can't use an index on `shipped_on`, because the index stores raw values. Rewrite as a range: `shipped_on >= '2024-01-05' AND shipped_on < '2024-01-06'`. A predicate the index can use is called *sargable*.",
              tone: "warning",
              example: {
                sql: "-- Not sargable\nWHERE extract(year FROM shipped_on) = 2024\n\n-- Sargable\nWHERE shipped_on >= '2024-01-01'\n  AND shipped_on <  '2025-01-01'",
              },
            },
            {
              title: "Leading wildcards can't be indexed",
              body: "`LIKE 'abc%'` uses a B-tree; `LIKE '%abc%'` cannot. For substring search you need a trigram index (`pg_trgm`) or a full-text index.",
            },
            {
              title: "`SELECT *` costs more than you think",
              body: "It moves columns you don't need across the wire, and it prevents index-only scans — the planner can't satisfy the query from the index alone if you asked for every column.",
              tone: "tip",
            },
            {
              title: "Deep OFFSET is O(n)",
              body: "`OFFSET 100000 LIMIT 20` makes the database produce and discard 100,000 rows. Keyset pagination — `WHERE id > :last_seen ORDER BY id LIMIT 20` — is constant time.",
            },
          ],
          challenges: [
            {
              id: "p-ap-1",
              type: "choice",
              prompt: "Why can't `WHERE extract(year FROM shipped_on) = 2024` use an index on `shipped_on`?",
              options: [
                { id: "a", label: "extract() is deprecated" },
                { id: "b", label: "The index stores raw dates, not the function's output" },
                { id: "c", label: "Integer comparison isn't indexable" },
                { id: "d", label: "It can — the planner rewrites it automatically" },
              ],
              correct: ["b"],
              explanation:
                "You can index the expression itself (`CREATE INDEX ... ON t (extract(year FROM shipped_on))`), but rewriting to a range is usually better — it stays useful for every other date query too.",
              difficulty: "hard",
            },
            {
              id: "p-ap-2",
              type: "query",
              prompt:
                "Rewrite this as a **sargable** range query returning `count(*)` as `shipments_2024`: shipments shipped during 2024.",
              starter:
                "-- Slow version:\n-- SELECT count(*) FROM shipments WHERE extract(year FROM shipped_on) = 2024;\n\n",
              solution:
                "SELECT count(*) AS shipments_2024 FROM shipments WHERE shipped_on >= '2024-01-01' AND shipped_on < '2025-01-01';",
              grading: {
                checkColumnNames: true,
                mustNotUse: [{ pattern: "extract\\s*\\(|date_trunc\\s*\\(", label: "a function on the indexed column" }],
              },
              difficulty: "hard",
            },
            {
              id: "p-ap-3",
              type: "query",
              prompt:
                "Return `id`, `carrier` and `weight_kg` for the 20 heaviest shipments — naming only the columns you need. Heaviest first, ties broken by id.",
              solution:
                "SELECT id, carrier, weight_kg FROM shipments ORDER BY weight_kg DESC, id LIMIT 20;",
              grading: { mustNotUse: [{ pattern: "select\\s+\\*", label: "`SELECT *`" }] },
              difficulty: "medium",
            },
            {
              id: "p-ap-4",
              type: "choice",
              prompt:
                "Your API fetches a list of orders, then loops issuing one query per order to get its customer. What's this called?",
              options: [
                { id: "a", label: "Fan-out" },
                { id: "b", label: "The N+1 query problem" },
                { id: "c", label: "A Cartesian product" },
                { id: "d", label: "Index bloat" },
              ],
              correct: ["b"],
              explanation:
                "One query for the list plus N for the details. Fix it with a single JOIN, or by batching the ids into one `WHERE id = ANY($1)`.",
              difficulty: "medium",
            },
            {
              id: "p-ap-5",
              type: "query",
              prompt:
                "Using **keyset pagination**, return `id` and `carrier` for the 10 shipments after id 40000, ordered by id.",
              solution:
                "SELECT id, carrier FROM shipments WHERE id > 40000 ORDER BY id LIMIT 10;",
              grading: { mustNotUse: [{ pattern: "\\boffset\\b", label: "`OFFSET`" }] },
              explanation:
                "The index seeks straight to id 40001 and reads 10 entries. `OFFSET 40000` would materialise and throw away 40,000 rows first.",
              difficulty: "hard",
            },
            {
              id: "p-ap-6",
              type: "choice",
              prompt: "Which `LIKE` pattern can use a plain B-tree index?",
              options: [
                { id: "a", label: "LIKE '%line'", code: true },
                { id: "b", label: "LIKE '%aur%'", code: true },
                { id: "c", label: "LIKE 'Dawn%'", code: true },
                { id: "d", label: "None of them", code: false },
              ],
              correct: ["c"],
              difficulty: "medium",
            },
          ],
        },
        {
          id: "p-boss",
          slug: "performance-checkpoint",
          title: "Checkpoint: The Optimiser",
          subtitle: "Diagnose, index, rewrite",
          objective: "Apply tuning judgement to realistic scenarios",
          difficulty: "expert",
          estimatedMinutes: 16,
          datasetId: "warehouse",
          kind: "boss",
          requires: ["p-antipatterns"],
          keywords: ["SQL performance interview", "query tuning practice"],
          concepts: [
            {
              title: "Measure, change one thing, measure again",
              body: "Tuning is empirical. Run `EXPLAIN ANALYZE`, form one hypothesis, change one thing, and re-measure. Changing three things at once tells you nothing about which mattered.",
            },
          ],
          challenges: [
            {
              id: "p-bs-1",
              type: "query",
              prompt:
                "Create the index that best supports `WHERE warehouse_id = ? AND shipped_on >= ?`. Name it `idx_wh_date`.",
              solution:
                "CREATE INDEX idx_wh_date ON shipments (warehouse_id, shipped_on);",
              verifyQuery:
                "SELECT indexname FROM pg_indexes WHERE tablename = 'shipments' ORDER BY indexname;",
              hints: ["Equality column first, range column second."],
              difficulty: "hard",
            },
            {
              id: "p-bs-2",
              type: "query",
              prompt:
                "Return `region` and `shipments` — how many shipments each warehouse region handled. Most first, then region.",
              solution:
                "SELECT w.region, count(*) AS shipments FROM shipments s JOIN warehouses w ON w.id = s.warehouse_id GROUP BY w.region ORDER BY shipments DESC, w.region;",
              grading: { checkColumnNames: true },
              difficulty: "medium",
            },
            {
              id: "p-bs-3",
              type: "query",
              prompt:
                "Return `carrier` and `avg_days` — average whole days from `shipped_on` to `delivered_on`, for delivered shipments only, rounded to 2 decimals. Fastest carrier first.",
              solution:
                "SELECT carrier, ROUND(avg(delivered_on - shipped_on), 2) AS avg_days FROM shipments WHERE delivered_on IS NOT NULL GROUP BY carrier ORDER BY avg_days, carrier;",
              grading: { checkColumnNames: true },
              difficulty: "hard",
            },
            {
              id: "p-bs-4",
              type: "query",
              prompt:
                "Return `month` (truncated) and `lost_count` for shipments with status `lost` in 2024, using a **sargable** date filter. Sort by month.",
              solution:
                "SELECT date_trunc('month', shipped_on) AS month, count(*) AS lost_count FROM shipments WHERE status = 'lost' AND shipped_on >= '2024-01-01' AND shipped_on < '2025-01-01' GROUP BY 1 ORDER BY 1;",
              grading: { checkColumnNames: true },
              hints: [
                "`date_trunc` in SELECT/GROUP BY is fine — it's in WHERE that it blocks the index.",
              ],
              difficulty: "expert",
            },
            {
              id: "p-bs-5",
              type: "choice",
              prompt:
                "A report query took 40ms yesterday and 12s today. Nothing in the code changed. What do you check **first**?",
              options: [
                { id: "a", label: "Add more indexes" },
                { id: "b", label: "EXPLAIN ANALYZE it and compare the plan and row estimates" },
                { id: "c", label: "Increase the connection pool" },
                { id: "d", label: "Rewrite it as a stored procedure" },
              ],
              correct: ["b"],
              explanation:
                "Sudden regressions are almost always a plan flip caused by data growth or stale statistics. Look at the plan before you change anything.",
              difficulty: "hard",
            },
          ],
        },
      ],
    },
  ],
};
