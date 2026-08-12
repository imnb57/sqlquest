import { slugify } from "@/lib/utils";

/**
 * SQL glossary.
 *
 * Each entry is a standalone page — short definition, why it matters, an
 * example, and a link into the lesson that teaches it properly.
 */

export interface GlossaryTerm {
  term: string;
  /** Alternate spellings people search for. */
  aliases?: string[];
  category:
    | "Basics"
    | "Joins"
    | "Aggregation"
    | "Advanced"
    | "Modelling"
    | "Performance";
  /** One-sentence definition — used as the meta description. */
  short: string;
  /** Two or three paragraphs of explanation. */
  body: string[];
  example?: { sql: string; caption?: string };
  /** Lesson slug this concept is taught in. */
  lesson?: string;
  related?: string[];
}

export const glossary: GlossaryTerm[] = [
  {
    term: "SELECT",
    category: "Basics",
    short:
      "The clause that specifies which columns a query returns. Every read query starts with it.",
    body: [
      "`SELECT` names the columns you want back. It's the first clause you write, though the database evaluates it near the end — which is why an alias you define in SELECT isn't visible to WHERE.",
      "`SELECT *` returns every column. It's ideal for exploring an unfamiliar table and a poor habit in application code: it moves more data than you need, and your result shape changes silently when someone adds a column.",
    ],
    example: {
      sql: "SELECT name, class, level\nFROM heroes;",
      caption: "Three named columns beat SELECT * in production code.",
    },
    lesson: "select-basics",
    related: ["FROM", "DISTINCT", "Alias"],
  },
  {
    term: "WHERE",
    category: "Basics",
    short: "Filters individual rows before grouping or aggregation happens.",
    body: [
      "`WHERE` is a yes/no question asked of every row independently. Rows that answer *true* survive; *false* and *unknown* are discarded — which is why NULL comparisons quietly remove rows.",
      "It runs before `GROUP BY`, so it cannot reference aggregate results. Filtering on `count(*)` needs `HAVING` instead.",
    ],
    example: {
      sql: "SELECT name, level\nFROM heroes\nWHERE level > 40 AND is_active;",
    },
    lesson: "where-basics",
    related: ["HAVING", "NULL", "Predicate"],
  },
  {
    term: "NULL",
    category: "Basics",
    short:
      "A marker meaning 'unknown'. Not zero, not an empty string, and never equal to anything — including itself.",
    body: [
      "NULL represents the absence of information. Because two unknowns can't be shown to be equal, `NULL = NULL` evaluates to unknown rather than true, and `WHERE col = NULL` therefore matches nothing at all.",
      "SQL uses three-valued logic — true, false, unknown — and `WHERE` keeps only definitively true rows. This single rule explains a large share of SQL bugs, most notoriously that `NOT IN` returns no rows if its list contains a NULL.",
      "Use `IS NULL` / `IS NOT NULL` to test for it, `COALESCE` to supply a fallback, and `NULLIF` to create one deliberately.",
    ],
    example: {
      sql: "SELECT name, COALESCE(home_realm, 'Wanderer') AS realm\nFROM heroes\nWHERE home_realm IS NULL;",
    },
    lesson: "working-with-null",
    related: ["COALESCE", "NULLIF", "Three-valued logic"],
  },
  {
    term: "COALESCE",
    category: "Basics",
    short: "Returns the first non-NULL argument from a list.",
    body: [
      "`COALESCE(a, b, c)` evaluates left to right and returns the first value that isn't NULL. It's the standard way to substitute a display value for missing data without modifying the stored rows.",
      "It short-circuits, so later arguments aren't evaluated once a non-NULL is found.",
    ],
    example: { sql: "SELECT COALESCE(nickname, first_name, 'Anonymous') AS display_name\nFROM users;" },
    lesson: "working-with-null",
    related: ["NULL", "NULLIF"],
  },
  {
    term: "NULLIF",
    category: "Basics",
    short: "Returns NULL when two expressions are equal; otherwise returns the first.",
    body: [
      "`NULLIF(x, y)` is `CASE WHEN x = y THEN NULL ELSE x END`. Its most common use by far is guarding division: `NULLIF(denominator, 0)` turns a division-by-zero error into a harmless NULL.",
    ],
    example: { sql: "SELECT ROUND(gold / NULLIF(level, 0), 2) AS gold_per_level\nFROM heroes;" },
    lesson: "working-with-null",
    related: ["NULL", "COALESCE"],
  },
  {
    term: "DISTINCT",
    category: "Basics",
    short: "Removes duplicate rows from a result set.",
    body: [
      "`DISTINCT` de-duplicates the **entire selected row**, not just the first column. `SELECT DISTINCT class, name` returns every unique (class, name) pair — which, when names are unique, removes nothing at all. This is the single most common misunderstanding about it.",
      "`COUNT(DISTINCT col)` counts unique non-NULL values of one column, which is usually what people actually wanted.",
    ],
    example: { sql: "SELECT DISTINCT class FROM heroes;\nSELECT count(DISTINCT class) AS class_count FROM heroes;" },
    lesson: "aliases-and-distinct",
    related: ["GROUP BY", "SELECT"],
  },
  {
    term: "Alias",
    aliases: ["AS"],
    category: "Basics",
    short: "A temporary name given to a column or table with the AS keyword.",
    body: [
      "Column aliases rename output: `SELECT count(*) AS total`. Table aliases shorten references: `FROM heroes h`. Both make multi-table queries dramatically more readable, and a computed column without an alias comes back named `?column?`.",
      "Identifiers use double quotes when they need spaces or preserved capitals. Single quotes are for string *values* — mixing them up is the most common beginner error in SQL.",
    ],
    example: { sql: 'SELECT h.name AS hero, g.name AS "Guild Name"\nFROM heroes h\nJOIN guilds g ON h.guild_id = g.id;' },
    lesson: "aliases-and-distinct",
    related: ["SELECT", "JOIN"],
  },
  {
    term: "ORDER BY",
    category: "Basics",
    short: "Sorts the result set. Without it, row order is undefined.",
    body: [
      "A table is a *set* of rows — any order you happen to observe is an accident of how the database read them, and it can change between runs as plans change or parallel workers get involved.",
      "Each sort key can have its own direction: `ORDER BY class ASC, level DESC`. Postgres places NULLs last ascending and first descending; override with `NULLS FIRST` / `NULLS LAST`.",
    ],
    example: { sql: "SELECT name, level\nFROM heroes\nORDER BY level DESC, name;" },
    lesson: "order-by",
    related: ["LIMIT", "Window function"],
  },
  {
    term: "LIMIT",
    aliases: ["OFFSET", "FETCH FIRST"],
    category: "Basics",
    short: "Caps the number of rows returned; OFFSET skips rows first.",
    body: [
      "`LIMIT 5` returns at most five rows. Paired with `ORDER BY` it answers every 'top N' question. Without `ORDER BY` it returns an arbitrary five, which is a legitimate request but a different one.",
      "`OFFSET` enables pagination but is O(n): the database still produces and discards every skipped row. Keyset pagination — `WHERE id > :last_seen ORDER BY id LIMIT 20` — is constant time and should be preferred for deep pages.",
    ],
    example: { sql: "SELECT name, gold\nFROM heroes\nORDER BY gold DESC\nLIMIT 3;" },
    lesson: "limit-and-offset",
    related: ["ORDER BY", "Keyset pagination"],
  },
  {
    term: "JOIN",
    aliases: ["INNER JOIN"],
    category: "Joins",
    short:
      "Combines rows from two tables based on a condition, keeping only matching pairs.",
    body: [
      "Think of a join in three steps: pair every row of A with every row of B, keep the pairs where the `ON` condition is true, then (for outer joins) add back unmatched rows padded with NULLs. An inner join skips that third step.",
      "The Venn-diagram model is misleading, because it can't explain how a join returns *more* rows than either input — which happens whenever the join key isn't unique.",
    ],
    example: {
      sql: "SELECT h.name, g.name AS guild\nFROM heroes h\nJOIN guilds g ON h.guild_id = g.id;",
    },
    lesson: "inner-join",
    related: ["LEFT JOIN", "Foreign key", "Cartesian product"],
  },
  {
    term: "LEFT JOIN",
    aliases: ["LEFT OUTER JOIN"],
    category: "Joins",
    short:
      "Keeps every row from the left table, filling the right side with NULLs when nothing matches.",
    body: [
      "Use it whenever the relationship is optional — customers who may have no orders, heroes who may have no guild. Combined with `WHERE right.id IS NULL` it becomes an **anti-join**, returning exactly the rows with no match.",
      "The classic mistake: putting a condition on the right-hand table in `WHERE` instead of `ON`. NULL rows fail the `WHERE` test and vanish, silently converting the query back into an inner join.",
    ],
    example: {
      sql: "-- Every hero, guild or not\nSELECT h.name, g.name AS guild\nFROM heroes h\nLEFT JOIN guilds g ON h.guild_id = g.id;\n\n-- Anti-join: quests nobody attempted\nSELECT q.title\nFROM quests q\nLEFT JOIN quest_log ql ON ql.quest_id = q.id\nWHERE ql.id IS NULL;",
    },
    lesson: "left-join",
    related: ["JOIN", "NOT EXISTS", "NULL"],
  },
  {
    term: "Cartesian product",
    aliases: ["CROSS JOIN"],
    category: "Joins",
    short: "Every row of one table paired with every row of another.",
    body: [
      "A `CROSS JOIN` of 18 heroes and 5 guilds returns 90 rows. Occasionally that's exactly what you want — generating a date × category grid to join against, for instance.",
      "Far more often, an unexpected Cartesian product means a missing or wrong `ON` clause. If a query you expected to return hundreds of rows returns millions, this is the first thing to check.",
    ],
    example: { sql: "SELECT * FROM heroes CROSS JOIN guilds;  -- 18 × 5 = 90" },
    lesson: "right-and-full-joins",
    related: ["JOIN", "Fan-out"],
  },
  {
    term: "Fan-out",
    category: "Joins",
    short:
      "When joining a one-to-many relationship multiplies parent rows, inflating any aggregate over them.",
    body: [
      "Join `customers` to `orders` and a customer with five orders appears five times. `count(customers.id)` now counts that customer five times, and `sum(customers.credit)` quintuples their credit.",
      "Fix it with `count(DISTINCT c.id)`, or by aggregating the child table first and joining the summary. The habit that prevents it: before writing an aggregate, say out loud what one row of your result represents.",
    ],
    example: {
      sql: "-- Wrong: customers counted once per order\nSELECT c.country, count(c.id) FROM customers c JOIN orders o ON o.customer_id = c.id GROUP BY c.country;\n\n-- Right\nSELECT c.country, count(DISTINCT c.id) FROM customers c JOIN orders o ON o.customer_id = c.id GROUP BY c.country;",
    },
    lesson: "aggregating-across-joins",
    related: ["JOIN", "GROUP BY", "DISTINCT"],
  },
  {
    term: "Self-join",
    category: "Joins",
    short: "Joining a table to itself, using two aliases, to relate rows within it.",
    body: [
      "The classic case is a hierarchy: `employees.manager_id` points at `employees.id`. Aliasing the table twice makes it behave like two tables, one playing the employee and one the manager.",
      "Use `LEFT JOIN` so the root of the hierarchy (whose manager is NULL) survives. Self-joins also generate unordered pairs — join on a shared attribute with `a.id < b.id` to get each pair exactly once.",
    ],
    example: {
      sql: "SELECT e.name AS employee, m.name AS manager\nFROM employees e\nLEFT JOIN employees m ON e.manager_id = m.id;",
    },
    lesson: "self-joins",
    related: ["JOIN", "Recursive CTE"],
  },
  {
    term: "GROUP BY",
    category: "Aggregation",
    short:
      "Buckets rows by one or more columns so aggregates are computed per bucket.",
    body: [
      "Every column in `SELECT` must either appear in `GROUP BY` or sit inside an aggregate. Anything else is ambiguous — if a group contains five different names, there's no defensible answer to which one to print.",
      "Unlike `WHERE`, `GROUP BY` treats all NULLs as equal and gathers them into a single group. It's the one place SQL decides two unknowns are the same thing.",
    ],
    example: {
      sql: "SELECT class, count(*) AS members, round(avg(level), 1) AS avg_level\nFROM heroes\nGROUP BY class\nORDER BY members DESC;",
    },
    lesson: "group-by",
    related: ["HAVING", "Aggregate function", "Window function"],
  },
  {
    term: "HAVING",
    category: "Aggregation",
    short: "Filters groups after aggregation, the way WHERE filters rows before it.",
    body: [
      "`WHERE count(*) > 2` is invalid because at the point `WHERE` runs, no counting has happened. `HAVING` operates on the aggregated result instead.",
      "Prefer `WHERE` whenever the condition doesn't involve an aggregate — filtering earlier means fewer rows to group, which is usually faster.",
    ],
    example: {
      sql: "SELECT class, count(*) AS members\nFROM heroes\nWHERE level > 30      -- rows first\nGROUP BY class\nHAVING count(*) > 2;  -- then groups",
    },
    lesson: "having",
    related: ["GROUP BY", "WHERE"],
  },
  {
    term: "Aggregate function",
    aliases: ["COUNT", "SUM", "AVG"],
    category: "Aggregation",
    short: "A function that collapses many rows into one value.",
    body: [
      "`count`, `sum`, `avg`, `min`, `max` are the core five. All of them ignore NULLs — which is why `count(*)` and `count(column)` disagree, and why `avg(x)` differs from `sum(x) / count(*)` whenever NULLs are present.",
      "Postgres adds a `FILTER` clause so each aggregate can have its own condition, which is how you build a crosstab in one pass.",
    ],
    example: {
      sql: "SELECT count(*) AS orders,\n       count(*) FILTER (WHERE status = 'delivered') AS delivered,\n       round(avg(total), 2) AS avg_total\nFROM orders;",
    },
    lesson: "aggregate-functions",
    related: ["GROUP BY", "NULL", "FILTER"],
  },
  {
    term: "Subquery",
    category: "Advanced",
    short: "A query nested inside another query.",
    body: [
      "Subqueries live in three places: `SELECT` (must return a single value — a *scalar*), `WHERE` (usually with `IN` or `EXISTS`), and `FROM` (a *derived table*, which must be aliased).",
      "A **correlated** subquery references a column from the outer query, so conceptually it re-runs per outer row. Modern planners usually rewrite them into joins, but the mental model matters for reasoning about cost.",
    ],
    example: {
      sql: "SELECT name, price\nFROM products\nWHERE price > (SELECT avg(price) FROM products);",
    },
    lesson: "subqueries",
    related: ["CTE", "EXISTS", "Derived table"],
  },
  {
    term: "EXISTS",
    aliases: ["NOT EXISTS"],
    category: "Advanced",
    short:
      "Tests whether a subquery returns any rows at all. NULL-safe, unlike IN.",
    body: [
      "`EXISTS` stops at the first matching row and doesn't care what you select — `SELECT 1` is conventional. It expresses a semi-join: 'rows in A that have at least one match in B'.",
      "`NOT EXISTS` is the safe anti-join. Where `NOT IN` collapses to unknown (returning zero rows) if its list contains a single NULL, `NOT EXISTS` behaves exactly as you'd expect. Make it your default.",
    ],
    example: {
      sql: "SELECT name FROM products p\nWHERE NOT EXISTS (\n  SELECT 1 FROM order_items oi WHERE oi.product_id = p.id\n);",
    },
    lesson: "correlated-subqueries",
    related: ["Subquery", "NULL", "LEFT JOIN"],
  },
  {
    term: "CTE",
    aliases: ["WITH clause", "Common table expression"],
    category: "Advanced",
    short:
      "A named temporary result set defined with WITH, readable top-to-bottom.",
    body: [
      "`WITH totals AS (...) SELECT ... FROM totals` gives an intermediate step a name. Same power as a derived table, but a four-step transformation reads like a pipeline instead of inside-out through nested parentheses — and a CTE can be referenced more than once.",
      "In Postgres 12+, CTEs are inlined and optimised like subqueries by default. Add `MATERIALIZED` to force single evaluation when the CTE is expensive and reused.",
    ],
    example: {
      sql: "WITH order_totals AS (\n  SELECT order_id, sum(quantity * unit_price) AS total\n  FROM order_items\n  GROUP BY order_id\n)\nSELECT round(avg(total), 2) AS avg_order\nFROM order_totals;",
    },
    lesson: "cte-basics",
    related: ["Subquery", "Recursive CTE"],
  },
  {
    term: "Recursive CTE",
    aliases: ["WITH RECURSIVE"],
    category: "Advanced",
    short:
      "A CTE that references itself, used to walk hierarchies and graphs of unknown depth.",
    body: [
      "Two halves joined by `UNION ALL`: the **anchor** produces the starting rows, and the **recursive term** references the CTE itself. Postgres repeats the recursive term against the newest rows until it produces none.",
      "Always have a stopping condition. Cyclic data (A manages B manages A) will loop forever without a depth cap or a path check.",
    ],
    example: {
      sql: "WITH RECURSIVE chain AS (\n  SELECT id, name, 1 AS depth\n  FROM employees WHERE manager_id IS NULL\n  UNION ALL\n  SELECT e.id, e.name, c.depth + 1\n  FROM employees e\n  JOIN chain c ON e.manager_id = c.id\n)\nSELECT * FROM chain ORDER BY depth, name;",
    },
    lesson: "recursive-ctes",
    related: ["CTE", "Self-join"],
  },
  {
    term: "Window function",
    aliases: ["OVER", "PARTITION BY", "Analytic function"],
    category: "Advanced",
    short:
      "Computes a value across a set of related rows without collapsing them, using OVER.",
    body: [
      "`GROUP BY` collapses many rows into one. `OVER` computes the same summary but attaches it to every row, so you keep the detail *and* get the context. `PARTITION BY` is `GROUP BY` for windows.",
      "Adding `ORDER BY` inside `OVER` implicitly frames the window as 'everything up to this row', which turns `sum()` into a running total. Explicit frames (`ROWS BETWEEN 2 PRECEDING AND CURRENT ROW`) give moving averages.",
      "Window functions are evaluated *after* `WHERE`, `GROUP BY` and `HAVING`, so you can't filter on one directly — wrap the query in a CTE and filter outside.",
    ],
    example: {
      sql: "SELECT name, category_id, price,\n       round(avg(price) OVER (PARTITION BY category_id), 2) AS category_avg,\n       row_number() OVER (PARTITION BY category_id ORDER BY price DESC) AS rn\nFROM products;",
    },
    lesson: "window-functions-basics",
    related: ["ROW_NUMBER", "GROUP BY", "LAG"],
  },
  {
    term: "ROW_NUMBER",
    aliases: ["RANK", "DENSE_RANK"],
    category: "Advanced",
    short:
      "Ranking window functions. They differ only in how they handle ties.",
    body: [
      "`ROW_NUMBER()` gives 1, 2, 3, 4 — ties broken arbitrarily. `RANK()` gives 1, 2, 2, 4 — ties share a rank and leave a gap. `DENSE_RANK()` gives 1, 2, 2, 3 — ties share, no gap.",
      "The top-N-per-group pattern (partition, order, number, filter `rn <= N`) answers an enormous share of real analytics questions. Always end the `ORDER BY` with a unique column, or `ROW_NUMBER()` is non-deterministic.",
    ],
    example: {
      sql: "WITH ranked AS (\n  SELECT name, category_id, price,\n         row_number() OVER (PARTITION BY category_id ORDER BY price DESC, name) AS rn\n  FROM products\n)\nSELECT * FROM ranked WHERE rn <= 2;",
    },
    lesson: "ranking-functions",
    related: ["Window function", "LAG"],
  },
  {
    term: "LAG",
    aliases: ["LEAD"],
    category: "Advanced",
    short:
      "Window functions that read a value from a preceding or following row.",
    body: [
      "`lag(x) OVER (ORDER BY t)` puts the previous row's value on the current row — perfect for deltas, gaps and change detection. `lead` does the same forwards.",
      "The first row (or last, for `lead`) gets NULL unless you pass a default as the third argument. This replaces the self-join people used to write for month-over-month comparisons.",
    ],
    example: {
      sql: "SELECT month, revenue,\n       revenue - lag(revenue) OVER (ORDER BY month) AS mom_change\nFROM monthly_revenue;",
    },
    lesson: "lag-lead-running-totals",
    related: ["Window function", "ROW_NUMBER"],
  },
  {
    term: "UNION",
    aliases: ["UNION ALL", "INTERSECT", "EXCEPT"],
    category: "Advanced",
    short:
      "Set operators that stack result sets vertically, rather than joining them sideways.",
    body: [
      "Both queries must return the same number of columns with compatible types; the output column names come from the first query.",
      "`UNION` removes duplicates, which requires a sort and costs real time on large sets. `UNION ALL` doesn't and is strictly faster when duplicates are impossible or acceptable. `INTERSECT` keeps rows in both; `EXCEPT` keeps rows in the first but not the second.",
    ],
    example: {
      sql: "SELECT name FROM heroes WHERE class = 'Mage'\nUNION\nSELECT name FROM heroes WHERE level > 55\nORDER BY name;",
    },
    lesson: "set-operations",
    related: ["JOIN", "DISTINCT"],
  },
  {
    term: "Primary key",
    category: "Modelling",
    short:
      "A column (or set of columns) that uniquely identifies each row. Never NULL, never duplicated.",
    body: [
      "Every table should have one. It's what a foreign key points at, what an index is automatically built on, and what lets you address a specific row unambiguously.",
      "Surrogate keys (an auto-generated id) are usually preferable to natural keys (an email address), because natural keys have an inconvenient habit of changing.",
    ],
    example: { sql: "CREATE TABLE guilds (\n  id   integer PRIMARY KEY,\n  name text NOT NULL UNIQUE\n);" },
    lesson: "keys-and-relationships",
    related: ["Foreign key", "Index", "Constraint"],
  },
  {
    term: "Foreign key",
    category: "Modelling",
    short:
      "A column holding another table's primary key, enforcing that the referenced row exists.",
    body: [
      "`heroes.guild_id` referencing `guilds.id` is what makes a join meaningful. The database enforces referential integrity: you can't insert a hero pointing at a guild that doesn't exist, and you can't delete a guild that heroes still reference.",
      "A foreign key can be nullable, which models an optional relationship — and is precisely why `LEFT JOIN` exists.",
    ],
    example: {
      sql: "CREATE TABLE heroes (\n  id       integer PRIMARY KEY,\n  guild_id integer REFERENCES guilds(id) ON DELETE SET NULL\n);",
    },
    lesson: "keys-and-relationships",
    related: ["Primary key", "JOIN", "Constraint"],
  },
  {
    term: "Constraint",
    aliases: ["CHECK", "UNIQUE", "NOT NULL"],
    category: "Modelling",
    short:
      "A rule the database enforces on every write, making invalid data impossible.",
    body: [
      "`NOT NULL`, `UNIQUE`, `CHECK` and `FOREIGN KEY` turn whole classes of bug into an error at write time. Application code can be bypassed; a constraint cannot.",
      "A `UNIQUE` column can hold any number of NULLs in Postgres, because uniqueness is tested with `=` and `NULL = NULL` is never true. Add `NOT NULL` if you need genuine uniqueness.",
    ],
    example: {
      sql: "CREATE TABLE coupons (\n  code    text PRIMARY KEY,\n  percent integer NOT NULL CHECK (percent BETWEEN 1 AND 100),\n  expires date NOT NULL\n);",
    },
    lesson: "constraints-and-keys",
    related: ["Primary key", "Foreign key", "NULL"],
  },
  {
    term: "Transaction",
    aliases: ["BEGIN", "COMMIT", "ROLLBACK", "ACID"],
    category: "Modelling",
    short:
      "A group of statements that either all succeed or all fail, leaving no partial state.",
    body: [
      "`BEGIN ... COMMIT` makes the enclosed work atomic. A transfer that debits one account and credits another must be atomic, or money can vanish between the two statements.",
      "`ROLLBACK` discards everything since `BEGIN`. It's the safety net that makes a `WHERE`-less `UPDATE` survivable — provided you started with `BEGIN`.",
      "ACID: **Atomic** (all or nothing), **Consistent** (constraints hold at commit), **Isolated** (concurrent transactions don't see half-done work), **Durable** (a commit survives a crash).",
    ],
    example: {
      sql: "BEGIN;\nUPDATE accounts SET balance = balance - 100 WHERE id = 1;\nUPDATE accounts SET balance = balance + 100 WHERE id = 2;\nCOMMIT;",
    },
    lesson: "transactions",
    related: ["Constraint", "UPDATE"],
  },
  {
    term: "View",
    aliases: ["Materialized view"],
    category: "Modelling",
    short: "A saved query you can select from as though it were a table.",
    body: [
      "A regular view stores only the query definition and re-runs it each time. Its value is centralising a business definition — when 'active customer' changes meaning, you change one view rather than forty dashboards.",
      "A **materialized** view stores the results physically. Reads are fast; the data is stale until you `REFRESH MATERIALIZED VIEW`.",
    ],
    example: {
      sql: "CREATE VIEW order_totals AS\nSELECT order_id, sum(quantity * unit_price) AS total\nFROM order_items\nGROUP BY order_id;",
    },
    lesson: "views",
    related: ["CTE", "Subquery"],
  },
  {
    term: "Index",
    category: "Performance",
    short:
      "A sorted data structure that lets the database find rows without scanning the whole table.",
    body: [
      "B-tree is the default and handles equality, ranges, sorting and prefix `LIKE 'abc%'`. GIN suits arrays, JSONB and full-text search; BRIN suits huge tables that are naturally ordered by the indexed column.",
      "In a composite index the column order matters enormously: `(a, b)` serves `WHERE a = ?` and `WHERE a = ? AND b = ?`, but generally not `WHERE b = ?` alone. Put equality columns first, the range column last.",
      "Indexes aren't free — every write must maintain them, and they consume disk and cache. Check `pg_stat_user_indexes` and drop the ones nothing reads.",
    ],
    example: {
      sql: "CREATE INDEX idx_shipments_status_date\nON shipments (status, shipped_on);\n\n-- Partial: index only the rows you actually query\nCREATE INDEX idx_active ON shipments (shipped_on)\nWHERE status = 'in_transit';",
    },
    lesson: "indexes",
    related: ["EXPLAIN", "Sargable", "Primary key"],
  },
  {
    term: "EXPLAIN",
    aliases: ["EXPLAIN ANALYZE", "Query plan", "Execution plan"],
    category: "Performance",
    short:
      "Shows the strategy the database chose to execute a query, and with ANALYZE, what it actually cost.",
    body: [
      "`EXPLAIN` shows the plan with estimated costs. `EXPLAIN ANALYZE` really runs the query and reports actual timings and row counts alongside those estimates.",
      "Read plans inside-out: the most indented nodes execute first and feed their parents. The most valuable signal is the gap between estimated and actual rows — a three-order-of-magnitude miss usually means a bad downstream strategy.",
      "Because `EXPLAIN ANALYZE` genuinely executes, wrap experiments on `UPDATE` or `DELETE` in `BEGIN; ... ROLLBACK;`.",
    ],
    example: { sql: "EXPLAIN ANALYZE\nSELECT * FROM shipments WHERE carrier = 'Dawnline';" },
    lesson: "explain-basics",
    related: ["Index", "Sargable", "Sequential scan"],
  },
  {
    term: "Sargable",
    category: "Performance",
    short:
      "A predicate the database can satisfy with an index, rather than by scanning and testing every row.",
    body: [
      "Short for 'Search ARGument ABLE'. Wrapping an indexed column in a function destroys it: an index on `shipped_on` stores raw dates, not `extract(year FROM shipped_on)`, so the planner has no choice but to scan.",
      "The fix is almost always to rewrite as a range. `WHERE shipped_on >= '2024-01-01' AND shipped_on < '2025-01-01'` uses the index and stays useful for every other date query too.",
      "`LIKE 'abc%'` is sargable on a B-tree; `LIKE '%abc%'` is not and needs a trigram or full-text index.",
    ],
    example: {
      sql: "-- Not sargable\nWHERE extract(year FROM shipped_on) = 2024\n\n-- Sargable\nWHERE shipped_on >= '2024-01-01'\n  AND shipped_on <  '2025-01-01'",
    },
    lesson: "anti-patterns",
    related: ["Index", "EXPLAIN"],
  },
  {
    term: "Sequential scan",
    aliases: ["Seq Scan", "Full table scan"],
    category: "Performance",
    short: "Reading every row of a table, rather than seeking through an index.",
    body: [
      "Not automatically a problem. Reading a small table sequentially is faster than bouncing through an index, and Postgres deliberately switches to a sequential scan when it expects to touch a large fraction of the rows.",
      "It *is* a problem when you filtered down to a handful of rows from millions and still see one — meaning either no index exists, or your predicate isn't sargable.",
    ],
    lesson: "explain-basics",
    related: ["EXPLAIN", "Index", "Sargable"],
  },
  {
    term: "N+1 query problem",
    category: "Performance",
    short:
      "Fetching a list, then issuing one extra query per item — 1 + N round trips where 1 or 2 would do.",
    body: [
      "An application loads 100 orders, then loops issuing 'get the customer for this order' 100 times. Each query is fast; the aggregate is catastrophic, because latency dominates.",
      "Fix it with a single join, or by batching the ids into one query with `WHERE id = ANY($1)`. Most ORMs have an eager-loading option that does exactly this.",
    ],
    lesson: "anti-patterns",
    related: ["JOIN", "EXPLAIN"],
  },
  {
    term: "Three-valued logic",
    category: "Basics",
    short:
      "SQL conditions evaluate to true, false, or unknown — and WHERE keeps only the true ones.",
    body: [
      "Any comparison involving NULL yields unknown. `WHERE` discards unknown exactly as it discards false, which is why filters silently drop rows containing NULLs and why `NOT IN` with a NULL in the list returns nothing at all.",
      "`GROUP BY` and `UNIQUE` each break the pattern in opposite directions: grouping treats all NULLs as equal, while a unique constraint treats them as all distinct.",
    ],
    lesson: "working-with-null",
    related: ["NULL", "WHERE", "EXISTS"],
  },
  {
    term: "Keyset pagination",
    aliases: ["Cursor pagination", "Seek method"],
    category: "Performance",
    short:
      "Paginating with a WHERE clause on the last seen key instead of OFFSET.",
    body: [
      "`OFFSET 100000 LIMIT 20` makes the database produce and discard 100,000 rows — linear in the page number, so page 5,000 is 5,000 times slower than page 1.",
      "`WHERE id > :last_seen ORDER BY id LIMIT 20` seeks directly into the index and reads 20 entries, in constant time regardless of depth. The trade-off is that you can't jump to an arbitrary page number.",
    ],
    example: { sql: "SELECT id, carrier\nFROM shipments\nWHERE id > 40000\nORDER BY id\nLIMIT 10;" },
    lesson: "anti-patterns",
    related: ["LIMIT", "Index"],
  },
  {
    term: "UPSERT",
    aliases: ["ON CONFLICT", "MERGE"],
    category: "Modelling",
    short: "Insert a row, or update it if it already exists — atomically.",
    body: [
      "`INSERT ... ON CONFLICT (key) DO UPDATE SET ...` handles create-or-overwrite in one statement, without the race condition of checking-then-inserting. `EXCLUDED` refers to the row you attempted to insert.",
      "`ON CONFLICT DO NOTHING` is the idempotent-insert variant, useful for seed data and retryable jobs.",
    ],
    example: {
      sql: "INSERT INTO categories (id, name)\nVALUES (1, 'Lamps')\nON CONFLICT (id) DO UPDATE\n  SET name = EXCLUDED.name;",
    },
    lesson: "delete-and-upsert",
    related: ["Transaction", "Constraint"],
  },
  {
    term: "CASE",
    category: "Advanced",
    short: "SQL's conditional expression — if/then/else inside a query.",
    body: [
      "`CASE WHEN condition THEN value ... ELSE fallback END` works anywhere an expression is allowed: in `SELECT` to bucket values, in `ORDER BY` for custom sort orders, and inside aggregates for conditional counting.",
      "`sum(CASE WHEN status = 'x' THEN 1 ELSE 0 END)` is the portable form of Postgres's `count(*) FILTER (WHERE status = 'x')`.",
    ],
    example: {
      sql: "SELECT name,\n       CASE\n         WHEN level >= 50 THEN 'veteran'\n         WHEN level >= 25 THEN 'seasoned'\n         ELSE 'novice'\n       END AS tier\nFROM heroes;",
    },
    lesson: "conditional-aggregation",
    related: ["Aggregate function", "COALESCE"],
  },
];

export const glossaryBySlug = new Map(
  glossary.map((entry) => [slugify(entry.term), entry]),
);

export function getTerm(slug: string): GlossaryTerm | undefined {
  return glossaryBySlug.get(slug);
}

export function termSlug(term: string): string {
  return slugify(term);
}

export const glossaryCategories = Array.from(
  new Set(glossary.map((g) => g.category)),
);
