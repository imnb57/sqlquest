/**
 * Blog content.
 *
 * Stored as structured data rather than MDX so posts are type-checked, fully
 * static, and searchable without adding a markdown toolchain to the bundle.
 * Blocks render through a tiny renderer in `components/marketing/post-body`.
 */

export type Block =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "code"; sql: string; caption?: string }
  | { type: "list"; items: string[]; ordered?: boolean }
  | { type: "callout"; tone: "info" | "tip" | "warning"; title: string; text: string }
  | { type: "quote"; text: string };

export interface Post {
  slug: string;
  title: string;
  description: string;
  /** ISO date. */
  published: string;
  updated?: string;
  author: string;
  readingMinutes: number;
  tags: string[];
  /** Used for the card accent and OG image. */
  glyph: string;
  body: Block[];
}

export const posts: Post[] = [
  {
    slug: "how-to-actually-learn-sql",
    title: "How to actually learn SQL (and why tutorials fail you)",
    description:
      "Reading SQL and writing SQL are different skills. Here's the practice structure that turns one into the other — and why ten minutes a day beats a weekend bootcamp.",
    published: "2026-01-14",
    author: "The SQLQuest Team",
    readingMinutes: 7,
    tags: ["learning", "beginner", "method"],
    glyph: "🧠",
    body: [
      {
        type: "p",
        text: "You've read the tutorial. You followed along. Everything made sense. Then someone asked you to find the second-highest salary per department and your mind went completely blank.",
      },
      {
        type: "p",
        text: "This is not a you problem. It's a structural problem with how SQL is usually taught, and it has a fix.",
      },
      { type: "h2", text: "Recognition is not recall" },
      {
        type: "p",
        text: "When you read `SELECT ... GROUP BY ... HAVING` and think \"yes, that makes sense\", you are exercising **recognition** — the ability to confirm that something is correct when you see it. Writing that query from a blank editor requires **recall**, which is a different and much harder cognitive operation.",
      },
      {
        type: "p",
        text: "Tutorials are almost entirely recognition. They feel productive because comprehension is pleasant. But comprehension without retrieval decays within days.",
      },
      {
        type: "callout",
        tone: "tip",
        title: "The test",
        text: "Close the tab. Open a blank editor. Can you write the query? If not, you learned about SQL rather than learning SQL.",
      },
      { type: "h2", text: "The loop that works" },
      {
        type: "list",
        ordered: true,
        items: [
          "**Read a small idea** — one concept, two minutes, with a runnable example.",
          "**Immediately write it yourself**, from scratch, against real data.",
          "**Get specific feedback** — not 'wrong', but 'your query returned 24 rows and the answer has 16, so a join is probably fanning out'.",
          "**Come back tomorrow** and retrieve it again before you've quite forgotten.",
        ],
      },
      {
        type: "p",
        text: "That last step is the one people skip, and it's the one that does most of the work. Spaced retrieval is among the most robust findings in the learning-science literature, and it applies to query syntax exactly as it applies to vocabulary.",
      },
      { type: "h2", text: "Why ten minutes beats three hours" },
      {
        type: "p",
        text: "A three-hour Saturday session and eighteen ten-minute sessions cost the same time. The eighteen sessions produce dramatically more durable knowledge, because each one is a separate retrieval event and each one happens after some forgetting has taken place.",
      },
      {
        type: "p",
        text: "Forgetting a little and then retrieving is the mechanism. A single long session gives you almost no forgetting to work against.",
      },
      { type: "h2", text: "Practise against real data" },
      {
        type: "p",
        text: "Toy examples with three rows hide every problem that makes SQL hard. NULLs behave strangely. Joins multiply rows. `count(*)` and `count(column)` disagree. You will not meet any of that in a table of three rows.",
      },
      {
        type: "code",
        sql: `-- Looks fine. Silently wrong the moment guild_id is nullable.
SELECT h.name, g.name AS guild
FROM heroes h
JOIN guilds g ON h.guild_id = g.id;`,
        caption: "An inner join here quietly drops every guildless hero.",
      },
      {
        type: "p",
        text: "The only reliable way to internalise that is to be surprised by it, on data big enough for the surprise to show up.",
      },
      { type: "h2", text: "Get the error messages" },
      {
        type: "p",
        text: "`column \"name\" is ambiguous`. `column must appear in the GROUP BY clause`. These messages are the vocabulary of the language. Every hour spent decoding them is an hour you never have to spend again — and a simulator that hands you a generic \"incorrect\" teaches you none of it.",
      },
      {
        type: "callout",
        tone: "info",
        title: "How SQLQuest does this",
        text: "Every challenge runs against a real PostgreSQL engine compiled to WebAssembly in your browser. Real errors, real plans, real NULL semantics — with the feedback loop measured in milliseconds because there's no server round trip.",
      },
      { type: "h2", text: "A concrete plan" },
      {
        type: "list",
        items: [
          "Ten minutes, same time each day. Attach it to something you already do.",
          "Finish one lesson rather than half-starting three.",
          "When you get something wrong, retry it rather than reading the answer.",
          "Once a week, revisit your weakest topic instead of pushing forward.",
          "After a month, stop and write five queries from memory against a schema you've never seen.",
        ],
      },
      {
        type: "p",
        text: "That last exercise is the only honest measure of progress. Everything else is recognition wearing a disguise.",
      },
    ],
  },

  {
    slug: "sql-joins-explained",
    title: "SQL joins, explained without the Venn diagrams",
    description:
      "Venn diagrams are the wrong mental model for joins. Here's a better one — think in rows, not sets — plus the row-count explosions that catch out experienced engineers.",
    published: "2026-02-03",
    author: "The SQLQuest Team",
    readingMinutes: 9,
    tags: ["joins", "intermediate", "postgres"],
    glyph: "🔗",
    body: [
      {
        type: "p",
        text: "Every join tutorial opens with overlapping circles. They're memorable, they look explanatory, and they will actively mislead you the first time a join returns more rows than either table contains.",
      },
      { type: "h2", text: "Why the Venn model breaks" },
      {
        type: "p",
        text: "A Venn diagram represents **set intersection**: each element appears once, and the result can never be larger than the union. Joins do neither of those things. A join is a **row-pair filter**, and its output can be far larger than either input.",
      },
      {
        type: "code",
        sql: `-- 18 heroes, 5 guilds. This returns 90 rows.
SELECT * FROM heroes CROSS JOIN guilds;`,
      },
      {
        type: "p",
        text: "No circle diagram predicts 90. The row-pair model does immediately.",
      },
      { type: "h2", text: "The model that actually works" },
      {
        type: "p",
        text: "Think of every join as three steps the database conceptually performs:",
      },
      {
        type: "list",
        ordered: true,
        items: [
          "**Pair up** every row of A with every row of B.",
          "**Keep** the pairs where the `ON` condition is true.",
          "**Add back** unmatched rows, padded with NULLs — for `LEFT` from A, for `RIGHT` from B, for `FULL` from both. An `INNER` join adds nothing back.",
        ],
      },
      {
        type: "p",
        text: "That's it. Every join type is step 3 with a different setting. Nothing about it requires a diagram, and it correctly predicts row counts in every case.",
      },
      { type: "h3", text: "Working through an example" },
      {
        type: "code",
        sql: `SELECT h.name, g.name AS guild
FROM heroes h
LEFT JOIN guilds g ON h.guild_id = g.id;`,
      },
      {
        type: "p",
        text: "Pair all 18 heroes with all 5 guilds (90 pairs). Keep the ones where the ids match (16 pairs — two heroes have `guild_id IS NULL`, and NULL never equals anything). Then add back the 2 unmatched heroes with NULL guild columns. Total: 18 rows.",
      },
      { type: "h2", text: "The mistake that costs the most" },
      {
        type: "p",
        text: "A condition on the right-hand table belongs in `ON`, not in `WHERE`. Put it in `WHERE` and you silently convert your LEFT JOIN back into an INNER JOIN.",
      },
      {
        type: "code",
        sql: `-- Wrong: NULL rows fail the WHERE test and disappear
SELECT h.name, g.name
FROM heroes h
LEFT JOIN guilds g ON h.guild_id = g.id
WHERE g.city = 'Duskvale';

-- Right: the filter is part of the match
SELECT h.name, g.name
FROM heroes h
LEFT JOIN guilds g
  ON h.guild_id = g.id AND g.city = 'Duskvale';`,
      },
      {
        type: "callout",
        tone: "warning",
        title: "The rule",
        text: "Filters on the *preserved* table go in WHERE. Filters on the *optional* table go in ON. Getting this backwards produces no error — just quietly missing rows.",
      },
      { type: "h2", text: "Fan-out: when joins multiply your numbers" },
      {
        type: "p",
        text: "Join a table to a one-to-many child and each parent row repeats once per child. Every aggregate over the parent is now counting the same value several times.",
      },
      {
        type: "code",
        sql: `-- Wrong: each customer is counted once per order
SELECT c.country, count(c.id) AS customers
FROM customers c
JOIN orders o ON o.customer_id = c.id
GROUP BY c.country;

-- Right
SELECT c.country, count(DISTINCT c.id) AS customers
FROM customers c
JOIN orders o ON o.customer_id = c.id
GROUP BY c.country;`,
      },
      {
        type: "p",
        text: "The habit that prevents this: before writing the aggregate, say out loud what a single row of your result set represents. If you can't, the query isn't ready.",
      },
      { type: "h2", text: "The anti-join" },
      {
        type: "p",
        text: "\"Rows in A with no match in B\" is one of the most useful shapes in daily SQL, and it has three spellings:",
      },
      {
        type: "code",
        sql: `-- LEFT JOIN + IS NULL
SELECT q.title FROM quests q
LEFT JOIN quest_log ql ON ql.quest_id = q.id
WHERE ql.id IS NULL;

-- NOT EXISTS  (safest — immune to NULLs)
SELECT q.title FROM quests q
WHERE NOT EXISTS (SELECT 1 FROM quest_log ql WHERE ql.quest_id = q.id);

-- NOT IN  (breaks if the subquery can return NULL)
SELECT q.title FROM quests q
WHERE q.id NOT IN (SELECT quest_id FROM quest_log);`,
      },
      {
        type: "callout",
        tone: "warning",
        title: "NOT IN is a trap",
        text: "If the subquery returns even one NULL, `NOT IN` evaluates to unknown for every row and the query returns nothing at all. No error, no warning. Default to NOT EXISTS.",
      },
      { type: "h2", text: "Practise the model" },
      {
        type: "p",
        text: "Predicting row counts before running a query is the fastest way to make this stick. The Joins track is built entirely around that exercise — and because it runs a real Postgres in your browser, you find out immediately whether your prediction held.",
      },
    ],
  },

  {
    slug: "window-functions-guide",
    title: "Window functions: the feature that replaces half your subqueries",
    description:
      "Running totals, rankings, per-group comparisons and month-over-month change — in one pass, without collapsing your rows. A practical guide with runnable examples.",
    published: "2026-03-11",
    author: "The SQLQuest Team",
    readingMinutes: 11,
    tags: ["advanced", "window-functions", "analytics"],
    glyph: "🪟",
    body: [
      {
        type: "p",
        text: "If you've ever written a correlated subquery to compare each row to its group's average, or self-joined a table to itself to find the previous row, window functions will delete a large amount of your SQL.",
      },
      { type: "h2", text: "GROUP BY collapses. OVER doesn't." },
      {
        type: "p",
        text: "That single sentence is the whole idea. `GROUP BY` replaces many rows with one summary row. A window function computes the same summary but **attaches it to every row**, leaving the detail intact.",
      },
      {
        type: "code",
        sql: `SELECT name,
       price,
       avg(price) OVER () AS catalogue_avg
FROM products;`,
        caption: "Every product keeps its row and also learns the overall average.",
      },
      { type: "h2", text: "PARTITION BY is GROUP BY for windows" },
      {
        type: "code",
        sql: `SELECT name,
       category_id,
       price,
       round(avg(price) OVER (PARTITION BY category_id), 2) AS category_avg
FROM products;`,
      },
      {
        type: "p",
        text: "Each row now sees its own category's average. Compare that with the correlated-subquery version, which re-scans the table conceptually once per row and is considerably harder to read.",
      },
      { type: "h2", text: "Ranking: the top-N-per-group pattern" },
      {
        type: "p",
        text: "This is the single most valuable window pattern, and it answers an enormous share of real analytics questions.",
      },
      {
        type: "code",
        sql: `WITH ranked AS (
  SELECT category_id,
         name,
         price,
         row_number() OVER (
           PARTITION BY category_id
           ORDER BY price DESC, name
         ) AS rn
  FROM products
)
SELECT category_id, name, price
FROM ranked
WHERE rn <= 2;`,
        caption: "The two most expensive products in each category.",
      },
      { type: "h3", text: "ROW_NUMBER vs RANK vs DENSE_RANK" },
      {
        type: "list",
        items: [
          "`ROW_NUMBER()` — 1, 2, 3, 4. Ties broken arbitrarily.",
          "`RANK()` — 1, 2, 2, 4. Ties share a rank, then a gap.",
          "`DENSE_RANK()` — 1, 2, 2, 3. Ties share, no gap.",
        ],
      },
      {
        type: "callout",
        tone: "warning",
        title: "Always add a tiebreaker",
        text: "`ROW_NUMBER()` with a non-unique ORDER BY is non-deterministic — the same query can return different rows on different runs. End your ORDER BY with a unique column.",
      },
      { type: "h2", text: "Running totals come free" },
      {
        type: "p",
        text: "Add an `ORDER BY` inside `OVER` and the window implicitly becomes \"everything up to and including this row\". That turns `sum()` into a cumulative total with no extra syntax.",
      },
      {
        type: "code",
        sql: `SELECT user_id,
       started_at,
       duration_s,
       sum(duration_s) OVER (
         PARTITION BY user_id ORDER BY started_at
       ) AS running_total
FROM sessions;`,
      },
      { type: "h2", text: "LAG and LEAD: comparing neighbours" },
      {
        type: "code",
        sql: `SELECT month,
       revenue,
       revenue - lag(revenue) OVER (ORDER BY month) AS mom_change
FROM monthly_revenue;`,
        caption: "Month-over-month change, without a self-join.",
      },
      {
        type: "p",
        text: "`LAG` reaches backwards, `LEAD` forwards. The first (or last) row gets NULL unless you supply a default as the third argument.",
      },
      { type: "h2", text: "Frames: moving averages" },
      {
        type: "code",
        sql: `SELECT started_at,
       duration_s,
       round(avg(duration_s) OVER (
         ORDER BY started_at
         ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
       ), 1) AS moving_avg_3
FROM sessions;`,
      },
      {
        type: "callout",
        tone: "tip",
        title: "ROWS vs RANGE",
        text: "`ROWS` counts physical rows. `RANGE` counts *values* of the ORDER BY expression — so with duplicate timestamps, RANGE pulls in every tied row. When in doubt, use ROWS.",
      },
      { type: "h2", text: "The one rule that trips everyone up" },
      {
        type: "p",
        text: "You cannot filter on a window function in `WHERE` or `HAVING`. Windows are evaluated *after* both. Wrap the query in a CTE and filter outside.",
      },
      {
        type: "code",
        sql: `-- Error: window functions are not allowed in WHERE
SELECT * FROM products
WHERE row_number() OVER (ORDER BY price DESC) <= 3;

-- Works
WITH ranked AS (
  SELECT *, row_number() OVER (ORDER BY price DESC) AS rn
  FROM products
)
SELECT * FROM ranked WHERE rn <= 3;`,
      },
      {
        type: "p",
        text: "Evaluation order, once more: FROM → WHERE → GROUP BY → HAVING → **window functions** → SELECT → ORDER BY → LIMIT. Most SQL surprises dissolve once that sequence is memorised.",
      },
    ],
  },

  {
    slug: "why-your-query-is-slow",
    title: "Why your query is slow: reading a Postgres execution plan",
    description:
      "EXPLAIN ANALYZE tells you exactly what the database did and how long each step took. Here's how to read one, and the five patterns that account for most slow queries.",
    published: "2026-04-08",
    author: "The SQLQuest Team",
    readingMinutes: 10,
    tags: ["performance", "postgres", "expert"],
    glyph: "⚡",
    body: [
      {
        type: "p",
        text: "A query that returns in 8ms on your laptop and 8 seconds in production almost never has a hardware problem. It has a plan problem, and the database will tell you exactly what it is if you ask.",
      },
      { type: "h2", text: "EXPLAIN vs EXPLAIN ANALYZE" },
      {
        type: "list",
        items: [
          "`EXPLAIN` shows the plan the optimiser chose, with **estimated** costs. It doesn't run the query.",
          "`EXPLAIN ANALYZE` actually executes it and reports **real** timings and row counts alongside the estimates.",
        ],
      },
      {
        type: "callout",
        tone: "warning",
        title: "ANALYZE really runs it",
        text: "`EXPLAIN ANALYZE DELETE FROM ...` will delete the rows. Wrap experiments in `BEGIN; ... ROLLBACK;`.",
      },
      { type: "h2", text: "Read it inside-out" },
      {
        type: "p",
        text: "The most indented nodes execute first and feed their parents. The top line is the last thing that happens. Each node reports its cost, its estimated rows, and — with ANALYZE — its actual time, actual rows, and how many times it looped.",
      },
      { type: "h2", text: "The five things worth looking for" },
      { type: "h3", text: "1. A big gap between estimated and actual rows" },
      {
        type: "p",
        text: "`rows=12 ... actual rows=9891` means the planner was working from bad information and probably chose a bad strategy downstream. Run `ANALYZE tablename` first; if it persists, you likely have correlated columns and need extended statistics.",
      },
      { type: "h3", text: "2. A sequential scan where you expected an index" },
      {
        type: "p",
        text: "Sometimes that's correct — reading the whole table beats bouncing through an index when you're touching most of it. But if you filtered down to 50 rows out of 5 million and still see `Seq Scan`, either the index doesn't exist or your predicate can't use it.",
      },
      { type: "h3", text: "3. A function wrapped around an indexed column" },
      {
        type: "code",
        sql: `-- Can't use an index on shipped_on
WHERE extract(year FROM shipped_on) = 2024

-- Can
WHERE shipped_on >= '2024-01-01'
  AND shipped_on <  '2025-01-01'`,
      },
      {
        type: "p",
        text: "The index stores raw values, not the function's output. A predicate the index can use is called *sargable*, and rewriting to a range is almost always better than indexing the expression — it stays useful for every other date query too.",
      },
      { type: "h3", text: "4. A nested loop over a large outer relation" },
      {
        type: "p",
        text: "A nested loop with `loops=48000` means the inner side ran 48,000 times. That's excellent when the inner side is a single indexed lookup and catastrophic when it's a scan. Check the `loops` count on the inner node.",
      },
      { type: "h3", text: "5. Sorts spilling to disk" },
      {
        type: "p",
        text: "`Sort Method: external merge Disk: 84MB` means the sort didn't fit in `work_mem`. Either raise it for that session, or — better — avoid the sort by adding an index that already provides the order.",
      },
      { type: "h2", text: "Index design in three rules" },
      {
        type: "list",
        ordered: true,
        items: [
          "**Equality columns first, range column last.** An index on `(status, created_at)` serves `WHERE status = ? AND created_at > ?`; the reverse order does not.",
          "**A composite index can't skip its leading column.** `(a, b)` won't help `WHERE b = ?` alone.",
          "**Partial indexes are cheap.** If you only ever query one status, `CREATE INDEX ... WHERE status = 'active'` is a fraction of the size and just as fast.",
        ],
      },
      {
        type: "code",
        sql: `CREATE INDEX idx_shipments_active
ON shipments (shipped_on)
WHERE status = 'in_transit';`,
      },
      { type: "h2", text: "Indexes are not free" },
      {
        type: "p",
        text: "Every index must be maintained on every INSERT, UPDATE and DELETE, and it competes for cache. Check `pg_stat_user_indexes` for indexes nothing has ever scanned, and drop them.",
      },
      { type: "h2", text: "The method" },
      {
        type: "quote",
        text: "Measure. Form one hypothesis. Change one thing. Measure again.",
      },
      {
        type: "p",
        text: "Changing three things at once and seeing an improvement teaches you nothing about which of them mattered — and leaves two changes you'll never dare remove. The Performance track walks through this on a table of 50,000 rows, which is big enough that the plan choices are real.",
      },
    ],
  },

  {
    slug: "null-in-sql",
    title: "NULL is not a value, and that explains almost every SQL bug",
    description:
      "Three-valued logic, the NOT IN trap, why COUNT disagrees with itself, and how NULLs behave differently in WHERE, GROUP BY and UNIQUE constraints.",
    published: "2026-05-06",
    author: "The SQLQuest Team",
    readingMinutes: 8,
    tags: ["fundamentals", "null", "gotchas"],
    glyph: "␀",
    body: [
      {
        type: "p",
        text: "More production SQL bugs trace back to NULL than to any other single cause. Not because it's complicated, but because it's *almost* consistent — and the exceptions are exactly where people get hurt.",
      },
      { type: "h2", text: "NULL means unknown" },
      {
        type: "p",
        text: "It is not zero. It is not the empty string. It is not false. It's the absence of information, and the entire behaviour follows from that.",
      },
      {
        type: "p",
        text: "If I don't know Alice's age and I don't know Bob's age, are their ages equal? The honest answer is *I don't know*. That's why `NULL = NULL` is not true — it's unknown.",
      },
      { type: "h2", text: "Three-valued logic" },
      {
        type: "p",
        text: "SQL conditions evaluate to true, false, or **unknown**. `WHERE` keeps only the rows that are definitively true. Unknown is discarded exactly like false — which is why a filter can silently drop rows you expected.",
      },
      {
        type: "code",
        sql: `-- Heroes with no home_realm do NOT appear here
SELECT name FROM heroes WHERE home_realm <> 'Northwind';

-- Say so explicitly if you want them
SELECT name FROM heroes
WHERE home_realm <> 'Northwind' OR home_realm IS NULL;`,
      },
      { type: "h2", text: "The NOT IN trap" },
      {
        type: "p",
        text: "This is the nastiest one, because it fails silently and completely.",
      },
      {
        type: "code",
        sql: `SELECT 5 WHERE 5 NOT IN (1, 2, NULL);
-- Returns NO ROWS.`,
      },
      {
        type: "p",
        text: "`NOT IN (1, 2, NULL)` expands to `5 <> 1 AND 5 <> 2 AND 5 <> NULL`. The last term is unknown, so the whole conjunction is unknown rather than true. One NULL anywhere in the list and the query returns nothing at all.",
      },
      {
        type: "callout",
        tone: "warning",
        title: "Use NOT EXISTS",
        text: "`NOT EXISTS` is immune to this and usually plans just as well. Make it your default for 'rows with no matching child'.",
      },
      { type: "h2", text: "Where NULLs behave inconsistently" },
      { type: "h3", text: "GROUP BY treats them as equal" },
      {
        type: "p",
        text: "Unlike `=`, `GROUP BY` gathers all the NULLs into a single group. It's the one place SQL decides two unknowns are the same thing.",
      },
      { type: "h3", text: "UNIQUE treats them as distinct" },
      {
        type: "p",
        text: "A `UNIQUE` column can hold any number of NULLs in Postgres, because uniqueness is checked with `=` and `NULL = NULL` is never true. If you need genuine uniqueness, add `NOT NULL`.",
      },
      { type: "h3", text: "Aggregates skip them" },
      {
        type: "code",
        sql: `SELECT count(*)          AS all_rows,   -- 34
       count(gold_earned) AS with_value  -- 31
FROM quest_log;`,
      },
      {
        type: "p",
        text: "`avg()` divides by the non-NULL count, not the row count — so `avg(x)` and `sum(x) / count(*)` give different answers whenever NULLs are present. Both are defensible; know which one you meant.",
      },
      { type: "h3", text: "ORDER BY has an opinion" },
      {
        type: "p",
        text: "Postgres sorts NULLs last ascending and first descending. Override with `NULLS FIRST` / `NULLS LAST` — and be aware other databases default differently, which is a lovely source of migration bugs.",
      },
      { type: "h2", text: "The tools" },
      {
        type: "list",
        items: [
          "`IS NULL` / `IS NOT NULL` — the only operators that can see a NULL.",
          "`COALESCE(a, b, c)` — first non-NULL argument. Your display-time fallback.",
          "`NULLIF(x, y)` — NULL when `x = y`. `NULLIF(divisor, 0)` turns a division-by-zero error into a harmless NULL.",
          "`a IS DISTINCT FROM b` — like `<>` but treats NULLs as comparable values. Exactly what you want when diffing rows.",
        ],
      },
      {
        type: "code",
        sql: `SELECT name,
       round(gold / NULLIF(level, 0), 2) AS gold_per_level
FROM heroes;`,
        caption: "Defensive division — one zero can't kill the whole query.",
      },
      { type: "h2", text: "The habit" },
      {
        type: "p",
        text: "Every time you write a comparison, ask: can this column be NULL? Check the schema rather than guessing. It takes three seconds and prevents the class of bug that produces a report which is quietly, confidently wrong.",
      },
    ],
  },
];

const bySlug = new Map(posts.map((p) => [p.slug, p]));

export function getPost(slug: string): Post | undefined {
  return bySlug.get(slug);
}

/** Newest first. */
export const sortedPosts: Post[] = [...posts].sort(
  (a, b) => Date.parse(b.published) - Date.parse(a.published),
);

export const allTags: string[] = Array.from(
  new Set(posts.flatMap((p) => p.tags)),
).sort();

export function relatedPosts(slug: string, limit = 2): Post[] {
  const post = bySlug.get(slug);
  if (!post) return sortedPosts.slice(0, limit);

  return sortedPosts
    .filter((p) => p.slug !== slug)
    .map((p) => ({
      post: p,
      overlap: p.tags.filter((t) => post.tags.includes(t)).length,
    }))
    .sort((a, b) => b.overlap - a.overlap)
    .slice(0, limit)
    .map((x) => x.post);
}
