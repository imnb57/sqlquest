import type { Track } from "../types";

/**
 * Track 4 — Advanced SQL.
 * Subqueries → CTEs → window functions → set operations.
 * This is the track that separates "can write SQL" from "reaches for SQL first".
 */
export const advanced: Track = {
  id: "advanced",
  slug: "advanced",
  title: "Advanced SQL",
  subtitle: "Subqueries, CTEs and window functions",
  description:
    "The techniques that make SQL a genuinely expressive language: nesting queries, naming intermediate steps with CTEs, walking hierarchies recursively, and computing rankings and running totals with window functions.",
  level: "Advanced",
  glyph: "🪄",
  accent: "from-violet-400 to-fuchsia-500",
  outcomes: [
    "Nest queries as scalars, lists, and correlated lookups",
    "Structure complex logic with readable CTEs",
    "Walk hierarchies and graphs with recursive CTEs",
    "Rank, compare neighbouring rows, and build running totals",
  ],
  units: [
    {
      id: "x-u1",
      slug: "subqueries",
      title: "Subqueries",
      description: "A query inside a query.",
      accent: "violet",
      lessons: [
        {
          id: "x-subquery",
          slug: "subqueries",
          title: "Subqueries",
          subtitle: "Scalars, lists, and derived tables",
          objective: "Nest a query wherever a value or table is expected",
          difficulty: "medium",
          estimatedMinutes: 11,
          datasetId: "market",
          keywords: ["SQL subquery", "nested query", "derived table", "subquery in WHERE"],
          concepts: [
            {
              title: "Three places a subquery can live",
              body: "In `SELECT` (must return one row, one column — a *scalar*), in `WHERE` (usually with `IN`, returning a list), and in `FROM` (a *derived table*, which must be aliased).",
              example: {
                sql: "-- Scalar: compare each price to the overall average\nSELECT name, price,\n       (SELECT round(avg(price), 2) FROM products) AS avg_price\nFROM products;",
              },
            },
            {
              title: "`IN` with a subquery",
              body: "`WHERE id IN (SELECT customer_id FROM orders)` filters against a list computed on the fly. Beware: if the subquery can return NULL, `NOT IN` returns nothing at all.",
              tone: "warning",
              example: {
                sql: "SELECT name\nFROM customers\nWHERE id IN (SELECT customer_id FROM orders WHERE status = 'delivered');",
              },
            },
            {
              title: "Derived tables need a name",
              body: "`FROM (SELECT ...) AS t` — Postgres requires the alias. Think of it as a temporary table that exists only for this query.",
            },
          ],
          challenges: [
            {
              id: "x-sq-1",
              type: "query",
              prompt:
                "Return `name` and `price` for products priced **above the average product price**. Most expensive first.",
              solution:
                "SELECT name, price FROM products WHERE price > (SELECT avg(price) FROM products) ORDER BY price DESC;",
              hints: ["The average is a single value — a scalar subquery in `WHERE`."],
              difficulty: "medium",
            },
            {
              id: "x-sq-2",
              type: "query",
              prompt:
                "Return the `name` of every customer who has placed **at least one order**, sorted alphabetically. Use a subquery, not a join.",
              solution:
                "SELECT name FROM customers WHERE id IN (SELECT customer_id FROM orders) ORDER BY name;",
              grading: {
                mustUse: [{ pattern: "\\bin\\s*\\(\\s*select", label: "an `IN (SELECT ...)` subquery" }],
              },
              difficulty: "medium",
            },
            {
              id: "x-sq-3",
              type: "query",
              prompt:
                "Return `name` and `price` for products, plus `avg_price` (the overall average, rounded to 2) on every row. Sort by name.",
              solution:
                "SELECT name, price, (SELECT ROUND(avg(price), 2) FROM products) AS avg_price FROM products ORDER BY name;",
              grading: { checkColumnNames: true },
              difficulty: "medium",
            },
            {
              id: "x-sq-4",
              type: "query",
              prompt:
                "Using a derived table, return `avg_order_total` — the average of each order's total value, rounded to 2 decimals.",
              solution:
                "SELECT ROUND(avg(order_total), 2) AS avg_order_total FROM (SELECT order_id, sum(quantity * unit_price) AS order_total FROM order_items GROUP BY order_id) t;",
              grading: { checkColumnNames: true },
              hints: ["Compute per-order totals in the inner query, average them outside."],
              difficulty: "hard",
            },
            {
              id: "x-sq-5",
              type: "query",
              prompt:
                "Return the `name` of customers who have **never** placed an order, alphabetically.",
              solution:
                "SELECT name FROM customers WHERE id NOT IN (SELECT customer_id FROM orders) ORDER BY name;",
              explanation:
                "This works only because `orders.customer_id` is `NOT NULL`. If it were nullable, a single NULL in the list would make `NOT IN` return zero rows — use `NOT EXISTS` when in doubt.",
              difficulty: "hard",
            },
            {
              id: "x-sq-6",
              type: "predict",
              prompt: "`t` contains the values 1, 2 and NULL. What does this return?",
              query: "SELECT 5 WHERE 5 NOT IN (1, 2, NULL);",
              options: [
                { id: "a", label: "5" },
                { id: "b", label: "No rows" },
                { id: "c", label: "NULL" },
                { id: "d", label: "An error" },
              ],
              correct: ["b"],
              explanation:
                "`5 <> NULL` is unknown, so the whole `NOT IN` is unknown rather than true, and `WHERE` rejects it. This is the single nastiest NULL trap in SQL.",
              difficulty: "expert",
            },
          ],
        },
        {
          id: "x-correlated",
          slug: "correlated-subqueries",
          title: "Correlated subqueries & EXISTS",
          subtitle: "A subquery that runs once per outer row",
          objective: "Reference the outer query from inside a subquery",
          difficulty: "hard",
          estimatedMinutes: 12,
          datasetId: "market",
          requires: ["x-subquery"],
          keywords: ["correlated subquery", "SQL EXISTS", "NOT EXISTS", "semi join"],
          concepts: [
            {
              title: "Correlation means dependency",
              body: "A correlated subquery mentions a column from the outer query, so it can't be evaluated once up front — conceptually it re-runs for every outer row. Modern planners usually rewrite them into joins, but the mental model is per-row.",
              example: {
                sql: "SELECT c.name\nFROM customers c\nWHERE EXISTS (\n  SELECT 1 FROM orders o WHERE o.customer_id = c.id\n);",
              },
            },
            {
              title: "`EXISTS` asks a yes/no question",
              body: "It stops at the first matching row, and doesn't care what you select — `SELECT 1` is conventional. Unlike `IN`, it's completely NULL-safe.",
              tone: "tip",
            },
            {
              title: "`NOT EXISTS` is the safe anti-join",
              body: "Where `NOT IN` breaks on NULLs, `NOT EXISTS` behaves exactly as you'd expect. Make it your default for \"records with no matching child\".",
            },
          ],
          challenges: [
            {
              id: "x-co-1",
              type: "query",
              prompt:
                "Using `EXISTS`, return the `name` of customers who have placed at least one order. Alphabetical.",
              solution:
                "SELECT name FROM customers c WHERE EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id) ORDER BY name;",
              grading: { mustUse: [{ pattern: "\\bexists\\b", label: "`EXISTS`" }] },
              difficulty: "medium",
            },
            {
              id: "x-co-2",
              type: "query",
              prompt:
                "Using `NOT EXISTS`, return the `name` of products that have **never been ordered**. Alphabetical.",
              solution:
                "SELECT name FROM products p WHERE NOT EXISTS (SELECT 1 FROM order_items oi WHERE oi.product_id = p.id) ORDER BY name;",
              grading: { mustUse: [{ pattern: "not\\s+exists", label: "`NOT EXISTS`" }] },
              difficulty: "hard",
            },
            {
              id: "x-co-3",
              type: "query",
              prompt:
                "For each product return `name`, `price`, and `times_ordered` — how many order-item rows reference it. Sort by times_ordered descending, then name.",
              solution:
                "SELECT p.name, p.price, (SELECT count(*) FROM order_items oi WHERE oi.product_id = p.id) AS times_ordered FROM products p ORDER BY times_ordered DESC, p.name;",
              grading: { checkColumnNames: true },
              difficulty: "hard",
            },
            {
              id: "x-co-4",
              type: "query",
              prompt:
                "Return `name` and `price` of every product whose price is **above the average for its own category**. Sort by name.",
              solution:
                "SELECT p.name, p.price FROM products p WHERE p.price > (SELECT avg(p2.price) FROM products p2 WHERE p2.category_id = p.category_id) ORDER BY p.name;",
              hints: [
                "The inner average must be limited to the same category as the outer row.",
                "That's the correlation: `p2.category_id = p.category_id`.",
              ],
              explanation:
                "\"Compare each row to its own group's average\" is the canonical correlated subquery — and a window function can do it in one pass, as you'll see shortly.",
              difficulty: "expert",
            },
            {
              id: "x-co-5",
              type: "choice",
              prompt:
                "`orders.customer_id` is nullable. Which query safely finds customers with no orders?",
              options: [
                { id: "a", label: "WHERE id NOT IN (SELECT customer_id FROM orders)", code: true },
                { id: "b", label: "WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id)", code: true },
                { id: "c", label: "WHERE id <> ALL (SELECT customer_id FROM orders)", code: true },
                { id: "d", label: "They're all equivalent", code: false },
              ],
              correct: ["b"],
              explanation:
                "Both `NOT IN` and `<> ALL` collapse to unknown when the list contains a NULL. `NOT EXISTS` is unaffected.",
              difficulty: "expert",
            },
          ],
        },
      ],
    },

    {
      id: "x-u2",
      slug: "ctes",
      title: "Common Table Expressions",
      description: "Name your intermediate steps.",
      accent: "fuchsia",
      lessons: [
        {
          id: "x-cte",
          slug: "cte-basics",
          title: "WITH: common table expressions",
          subtitle: "Readable SQL for complex logic",
          objective: "Break a query into named, composable steps",
          difficulty: "medium",
          estimatedMinutes: 10,
          datasetId: "market",
          requires: ["x-correlated"],
          keywords: ["SQL CTE", "WITH clause", "common table expression", "readable SQL"],
          concepts: [
            {
              title: "A CTE is a named subquery",
              body: "`WITH order_totals AS (...) SELECT ... FROM order_totals` gives your intermediate result a name. Same power as a derived table, dramatically better readability — and you can reference it more than once.",
              example: {
                sql: "WITH order_totals AS (\n  SELECT order_id, sum(quantity * unit_price) AS total\n  FROM order_items\n  GROUP BY order_id\n)\nSELECT round(avg(total), 2) AS avg_order\nFROM order_totals;",
              },
            },
            {
              title: "Chain as many as you like",
              body: "Separate them with commas; each can reference the ones before it. A four-step transformation reads top to bottom like a pipeline instead of inside-out like nested parentheses.",
              example: {
                sql: "WITH a AS (...),\n     b AS (SELECT * FROM a WHERE ...),\n     c AS (SELECT * FROM b GROUP BY ...)\nSELECT * FROM c;",
              },
            },
            {
              title: "CTEs and performance",
              body: "In Postgres 12+, CTEs are inlined and optimised like subqueries by default. Add `MATERIALIZED` to force a single evaluation when the CTE is expensive and used repeatedly.",
              tone: "tip",
            },
          ],
          challenges: [
            {
              id: "x-ct-1",
              type: "query",
              prompt:
                "Using a CTE, return `order_id` and `total` for orders worth **more than 300**. Highest total first.",
              solution:
                "WITH totals AS (SELECT order_id, sum(quantity * unit_price) AS total FROM order_items GROUP BY order_id) SELECT order_id, total FROM totals WHERE total > 300 ORDER BY total DESC;",
              grading: { mustUse: [{ pattern: "\\bwith\\b", label: "a `WITH` clause" }] },
              difficulty: "medium",
            },
            {
              id: "x-ct-2",
              type: "query",
              prompt:
                "Using two chained CTEs, return customer `name` and `spend` for the **top 5 spenders** on delivered orders. Highest first.",
              solution:
                "WITH line_totals AS (SELECT o.customer_id, oi.quantity * oi.unit_price AS amount FROM orders o JOIN order_items oi ON oi.order_id = o.id WHERE o.status = 'delivered'), spend AS (SELECT customer_id, sum(amount) AS spend FROM line_totals GROUP BY customer_id) SELECT c.name, s.spend FROM spend s JOIN customers c ON c.id = s.customer_id ORDER BY s.spend DESC LIMIT 5;",
              grading: { mustUse: [{ pattern: "\\bwith\\b", label: "a `WITH` clause" }] },
              difficulty: "hard",
            },
            {
              id: "x-ct-3",
              type: "query",
              prompt:
                "Using a CTE for category revenue, return `category` and `revenue` for categories earning **above the average category revenue**. Highest first.",
              solution:
                "WITH cat_rev AS (SELECT cat.name AS category, sum(oi.quantity * oi.unit_price) AS revenue FROM categories cat JOIN products p ON p.category_id = cat.id JOIN order_items oi ON oi.product_id = p.id GROUP BY cat.name) SELECT category, revenue FROM cat_rev WHERE revenue > (SELECT avg(revenue) FROM cat_rev) ORDER BY revenue DESC;",
              hints: ["Reference the CTE twice — once in FROM, once in the scalar subquery."],
              explanation:
                "Referencing a CTE more than once is exactly what a derived table can't do without repeating yourself.",
              difficulty: "expert",
            },
            {
              id: "x-ct-4",
              type: "order",
              prompt: "Arrange this CTE query into valid order.",
              items: [
                "WITH totals AS (",
                "  SELECT order_id, sum(quantity * unit_price) AS total",
                "  FROM order_items",
                "  GROUP BY order_id",
                ")",
                "SELECT * FROM totals WHERE total > 500",
              ],
              difficulty: "easy",
            },
            {
              id: "x-ct-5",
              type: "choice",
              prompt: "What's the main practical advantage of a CTE over a nested subquery?",
              options: [
                { id: "a", label: "It's always faster" },
                { id: "b", label: "It reads top-to-bottom and can be referenced multiple times" },
                { id: "c", label: "It caches results between queries" },
                { id: "d", label: "It bypasses the query planner" },
              ],
              correct: ["b"],
              difficulty: "easy",
            },
          ],
        },
        {
          id: "x-recursive",
          slug: "recursive-ctes",
          title: "Recursive CTEs",
          subtitle: "Walk a hierarchy of unknown depth",
          objective: "Traverse trees and graphs in pure SQL",
          difficulty: "expert",
          estimatedMinutes: 14,
          datasetId: "org",
          requires: ["x-cte"],
          keywords: ["recursive CTE", "WITH RECURSIVE", "hierarchy query", "org chart SQL"],
          concepts: [
            {
              title: "Anchor, then repeat",
              body: "A recursive CTE has two halves joined by `UNION ALL`: the **anchor** (the starting rows) and the **recursive term** (which references the CTE itself). Postgres runs the recursive term over the newest rows until it produces none.",
              example: {
                sql: "WITH RECURSIVE chain AS (\n  SELECT id, name, manager_id, 1 AS depth\n  FROM employees WHERE manager_id IS NULL   -- anchor\n  UNION ALL\n  SELECT e.id, e.name, e.manager_id, c.depth + 1\n  FROM employees e\n  JOIN chain c ON e.manager_id = c.id       -- recursive term\n)\nSELECT * FROM chain ORDER BY depth, name;",
              },
            },
            {
              title: "Track depth and path",
              body: "Carrying a `depth` counter lets you indent an org chart; carrying an array `path` lets you show the full lineage — and guards against infinite loops in cyclic data.",
              tone: "tip",
            },
            {
              title: "Always have a stopping condition",
              body: "If the data contains a cycle (A manages B manages A), the recursion never terminates. Guard with a depth limit or by checking `NOT (e.id = ANY(c.path))`.",
              tone: "warning",
            },
          ],
          challenges: [
            {
              id: "x-rc-1",
              type: "query",
              prompt:
                "Return `id`, `name` and `depth` for the whole company, starting at the CEO (depth 1). Sort by depth then name.",
              solution:
                "WITH RECURSIVE chain AS (SELECT id, name, 1 AS depth FROM employees WHERE manager_id IS NULL UNION ALL SELECT e.id, e.name, c.depth + 1 FROM employees e JOIN chain c ON e.manager_id = c.id) SELECT id, name, depth FROM chain ORDER BY depth, name;",
              grading: { mustUse: [{ pattern: "with\\s+recursive", label: "`WITH RECURSIVE`" }] },
              difficulty: "hard",
            },
            {
              id: "x-rc-2",
              type: "query",
              prompt:
                "Return `name` and `depth` for everyone **beneath Rafael Ortiz** (not including Rafael). Sort by depth then name.",
              solution:
                "WITH RECURSIVE sub AS (SELECT id, name, 1 AS depth FROM employees WHERE manager_id = (SELECT id FROM employees WHERE name = 'Rafael Ortiz') UNION ALL SELECT e.id, e.name, s.depth + 1 FROM employees e JOIN sub s ON e.manager_id = s.id) SELECT name, depth FROM sub ORDER BY depth, name;",
              hints: [
                "The anchor is Rafael's direct reports.",
                "Find his id with a scalar subquery.",
              ],
              difficulty: "expert",
            },
            {
              id: "x-rc-3",
              type: "query",
              prompt:
                "Return `name` and `chain` — a text path from the CEO down, joined with ` > `, e.g. `Imogen Vale > Rafael Ortiz > Tobias Kern`. Sort by chain.",
              solution:
                "WITH RECURSIVE tree AS (SELECT id, name, name::text AS chain FROM employees WHERE manager_id IS NULL UNION ALL SELECT e.id, e.name, t.chain || ' > ' || e.name FROM employees e JOIN tree t ON e.manager_id = t.id) SELECT name, chain FROM tree ORDER BY chain;",
              hints: ["Carry the accumulated string in the CTE and append at each level."],
              difficulty: "expert",
            },
            {
              id: "x-rc-4",
              type: "query",
              prompt:
                "Return `depth` and `headcount` — how many employees sit at each level of the hierarchy. Sort by depth.",
              solution:
                "WITH RECURSIVE chain AS (SELECT id, 1 AS depth FROM employees WHERE manager_id IS NULL UNION ALL SELECT e.id, c.depth + 1 FROM employees e JOIN chain c ON e.manager_id = c.id) SELECT depth, count(*) AS headcount FROM chain GROUP BY depth ORDER BY depth;",
              grading: { checkColumnNames: true },
              difficulty: "expert",
            },
            {
              id: "x-rc-5",
              type: "query",
              prompt:
                "Generate a simple series: return `n` for the numbers 1 through 10 using a recursive CTE (no `generate_series`).",
              solution:
                "WITH RECURSIVE nums AS (SELECT 1 AS n UNION ALL SELECT n + 1 FROM nums WHERE n < 10) SELECT n FROM nums ORDER BY n;",
              grading: {
                mustUse: [{ pattern: "with\\s+recursive", label: "`WITH RECURSIVE`" }],
                mustNotUse: [{ pattern: "generate_series", label: "`generate_series`" }],
              },
              explanation:
                "`WHERE n < 10` is the stopping condition. Remove it and the recursion runs forever — a useful thing to have felt once, safely.",
              difficulty: "hard",
            },
          ],
        },
      ],
    },

    {
      id: "x-u3",
      slug: "window-functions",
      title: "Window Functions",
      description: "Aggregate without collapsing your rows.",
      accent: "purple",
      lessons: [
        {
          id: "x-window",
          slug: "window-functions-basics",
          title: "OVER and PARTITION BY",
          subtitle: "Keep every row *and* see the group total",
          objective: "Compute aggregates alongside detail rows",
          difficulty: "hard",
          estimatedMinutes: 12,
          datasetId: "market",
          requires: ["x-recursive"],
          keywords: ["window functions", "SQL OVER clause", "PARTITION BY", "analytic functions"],
          concepts: [
            {
              title: "GROUP BY collapses; OVER doesn't",
              body: "`sum(price) OVER ()` computes the same total as `GROUP BY` would, but attaches it to every row instead of replacing them. You keep the detail *and* get the context.",
              example: {
                sql: "SELECT name, price,\n       sum(price) OVER () AS catalogue_total\nFROM products;",
              },
            },
            {
              title: "`PARTITION BY` = GROUP BY for windows",
              body: "`avg(price) OVER (PARTITION BY category_id)` gives each row its own category's average. This replaces the correlated subquery you wrote earlier — in a single pass.",
              example: {
                sql: "SELECT name, price, category_id,\n       round(avg(price) OVER (PARTITION BY category_id), 2) AS cat_avg\nFROM products;",
              },
            },
            {
              title: "Windows run after WHERE and GROUP BY",
              body: "You can't filter on a window function in `WHERE` or `HAVING` — it hasn't been computed yet. Wrap the query in a CTE or subquery and filter outside.",
              tone: "warning",
            },
          ],
          challenges: [
            {
              id: "x-wn-1",
              type: "query",
              prompt:
                "Return `name`, `price` and `catalogue_avg` — the average price of all products, rounded to 2, on every row. Sort by name.",
              solution:
                "SELECT name, price, ROUND(avg(price) OVER (), 2) AS catalogue_avg FROM products ORDER BY name;",
              grading: { checkColumnNames: true, mustUse: [{ pattern: "\\bover\\b", label: "an `OVER ()` clause" }] },
              difficulty: "medium",
            },
            {
              id: "x-wn-2",
              type: "query",
              prompt:
                "Return `name`, `category_id`, `price` and `cat_avg` — the average price **within each category**, rounded to 2. Sort by category_id then name.",
              solution:
                "SELECT name, category_id, price, ROUND(avg(price) OVER (PARTITION BY category_id), 2) AS cat_avg FROM products ORDER BY category_id, name;",
              grading: { checkColumnNames: true },
              difficulty: "hard",
            },
            {
              id: "x-wn-3",
              type: "query",
              prompt:
                "Return `name`, `price`, and `pct_of_category` — this product's price as a percentage of its category's total price, rounded to 1 decimal. Sort by category_id then name.",
              solution:
                "SELECT name, price, ROUND(100 * price / sum(price) OVER (PARTITION BY category_id), 1) AS pct_of_category FROM products ORDER BY category_id, name;",
              grading: { checkColumnNames: true },
              difficulty: "expert",
            },
            {
              id: "x-wn-4",
              type: "query",
              prompt:
                "Using a CTE, return `name` and `price` for products priced **above their own category's average**. Sort by name.",
              solution:
                "WITH p AS (SELECT name, price, avg(price) OVER (PARTITION BY category_id) AS cat_avg FROM products) SELECT name, price FROM p WHERE price > cat_avg ORDER BY name;",
              hints: ["Compute the window in a CTE, then filter in the outer query."],
              explanation:
                "This is the standard workaround for \"can't filter on a window function\" — and it's usually faster than the correlated-subquery version.",
              difficulty: "expert",
            },
            {
              id: "x-wn-5",
              type: "choice",
              prompt: "Why does `WHERE row_number() OVER (...) = 1` fail?",
              options: [
                { id: "a", label: "row_number() isn't a real function" },
                { id: "b", label: "Window functions are evaluated after WHERE" },
                { id: "c", label: "You must alias window functions" },
                { id: "d", label: "It only works on indexed columns" },
              ],
              correct: ["b"],
              explanation:
                "Order of evaluation again: FROM → WHERE → GROUP BY → HAVING → **window functions** → SELECT → ORDER BY. Wrap and filter outside.",
              difficulty: "hard",
            },
          ],
        },
        {
          id: "x-ranking",
          slug: "ranking-functions",
          title: "ROW_NUMBER, RANK & DENSE_RANK",
          subtitle: "Top-N per group, done right",
          objective: "Rank rows within partitions and handle ties",
          difficulty: "hard",
          estimatedMinutes: 12,
          datasetId: "market",
          requires: ["x-window"],
          keywords: ["ROW_NUMBER", "RANK vs DENSE_RANK", "top n per group", "SQL ranking"],
          concepts: [
            {
              title: "Three ways to number rows",
              body: "`ROW_NUMBER()` always gives 1,2,3,4 — ties broken arbitrarily. `RANK()` gives 1,2,2,4 — ties share a rank and leave a gap. `DENSE_RANK()` gives 1,2,2,3 — ties share, no gap.",
              example: {
                sql: "SELECT name, price,\n       row_number() OVER (ORDER BY price DESC) AS rn,\n       rank()       OVER (ORDER BY price DESC) AS rnk,\n       dense_rank() OVER (ORDER BY price DESC) AS dense\nFROM products;",
              },
            },
            {
              title: "Top-N per group",
              body: "Partition by the group, order by the metric, number the rows, then keep `rn <= N` in an outer query. This one pattern answers an enormous share of real analytics questions.",
              example: {
                sql: "WITH ranked AS (\n  SELECT name, category_id, price,\n         row_number() OVER (PARTITION BY category_id ORDER BY price DESC) AS rn\n  FROM products\n)\nSELECT * FROM ranked WHERE rn <= 2;",
              },
            },
            {
              title: "Add a tiebreaker",
              body: "`ROW_NUMBER()` with a non-unique ORDER BY produces non-deterministic results — the same query can return different rows across runs. Always add a unique column as the final sort key.",
              tone: "warning",
            },
          ],
          challenges: [
            {
              id: "x-rk-1",
              type: "query",
              prompt:
                "Return `name`, `price` and `rn` — products numbered from most to least expensive. Break ties by name. Sort by rn.",
              solution:
                "SELECT name, price, row_number() OVER (ORDER BY price DESC, name) AS rn FROM products ORDER BY rn;",
              grading: { checkColumnNames: true },
              difficulty: "medium",
            },
            {
              id: "x-rk-2",
              type: "query",
              prompt:
                "Return the **2 most expensive products per category**: `category_id`, `name`, `price`. Sort by category_id then price descending.",
              solution:
                "WITH ranked AS (SELECT category_id, name, price, row_number() OVER (PARTITION BY category_id ORDER BY price DESC, name) AS rn FROM products) SELECT category_id, name, price FROM ranked WHERE rn <= 2 ORDER BY category_id, price DESC;",
              hints: [
                "Partition by category, order by price descending.",
                "Filter `rn <= 2` in an outer query or CTE.",
              ],
              difficulty: "expert",
            },
            {
              id: "x-rk-3",
              type: "query",
              prompt:
                "Return customer `name`, their `spend` on delivered orders, and `spend_rank` using `RANK()`. Highest spend first.",
              solution:
                "WITH spend AS (SELECT c.name, sum(oi.quantity * oi.unit_price) AS spend FROM customers c JOIN orders o ON o.customer_id = c.id JOIN order_items oi ON oi.order_id = o.id WHERE o.status = 'delivered' GROUP BY c.name) SELECT name, spend, rank() OVER (ORDER BY spend DESC) AS spend_rank FROM spend ORDER BY spend DESC;",
              grading: { checkColumnNames: true },
              difficulty: "expert",
            },
            {
              id: "x-rk-4",
              type: "predict",
              prompt: "Prices are 100, 90, 90, 80. What does `DENSE_RANK()` produce?",
              query: "SELECT price, dense_rank() OVER (ORDER BY price DESC) FROM t;",
              options: [
                { id: "a", label: "1, 2, 2, 4" },
                { id: "b", label: "1, 2, 3, 4" },
                { id: "c", label: "1, 2, 2, 3" },
                { id: "d", label: "1, 1, 2, 3" },
              ],
              correct: ["c"],
              explanation:
                "`DENSE_RANK` shares the tie but doesn't skip the next number. `RANK` would give 1, 2, 2, 4.",
              difficulty: "medium",
            },
            {
              id: "x-rk-5",
              type: "query",
              prompt:
                "Return `country`, `name` and `signed_up` for the **earliest-joining customer in each country**. Sort by country.",
              solution:
                "WITH ranked AS (SELECT country, name, signed_up, row_number() OVER (PARTITION BY country ORDER BY signed_up, name) AS rn FROM customers) SELECT country, name, signed_up FROM ranked WHERE rn = 1 ORDER BY country;",
              difficulty: "expert",
            },
          ],
        },
        {
          id: "x-frames",
          slug: "lag-lead-running-totals",
          title: "LAG, LEAD & running totals",
          subtitle: "Compare rows to their neighbours",
          objective: "Use offsets and window frames for time-series analysis",
          difficulty: "expert",
          estimatedMinutes: 13,
          datasetId: "telemetry",
          requires: ["x-ranking"],
          keywords: ["SQL LAG LEAD", "running total SQL", "window frame", "moving average SQL"],
          concepts: [
            {
              title: "`LAG` looks back, `LEAD` looks forward",
              body: "`lag(value) OVER (ORDER BY t)` gives the previous row's value on the current row — perfect for deltas, gaps and change detection. The first row gets NULL unless you pass a default.",
              example: {
                sql: "SELECT started_at, duration_s,\n       lag(duration_s) OVER (ORDER BY started_at) AS prev,\n       duration_s - lag(duration_s) OVER (ORDER BY started_at) AS delta\nFROM sessions;",
              },
            },
            {
              title: "Adding ORDER BY creates a frame",
              body: "An `ORDER BY` inside `OVER` implicitly frames the window as \"everything up to and including this row\" — which turns `sum()` into a **running total** automatically.",
              example: {
                sql: "SELECT started_at, duration_s,\n       sum(duration_s) OVER (ORDER BY started_at) AS running_total\nFROM sessions;",
              },
            },
            {
              title: "Explicit frames for moving averages",
              body: "`ROWS BETWEEN 2 PRECEDING AND CURRENT ROW` gives a 3-row moving window. Note `ROWS` counts rows while `RANGE` counts *values* — with duplicate sort keys they behave very differently.",
              tone: "tip",
            },
          ],
          challenges: [
            {
              id: "x-fr-1",
              type: "query",
              prompt:
                "For user 1's sessions, return `started_at`, `duration_s`, and `prev_duration` (the previous session's duration). Sort by started_at.",
              solution:
                "SELECT started_at, duration_s, lag(duration_s) OVER (ORDER BY started_at) AS prev_duration FROM sessions WHERE user_id = 1 ORDER BY started_at;",
              grading: { checkColumnNames: true },
              difficulty: "medium",
            },
            {
              id: "x-fr-2",
              type: "query",
              prompt:
                "Return `user_id`, `started_at`, `duration_s` and `running_total` — a per-user running sum of duration ordered by start time. Sort by user_id then started_at.",
              solution:
                "SELECT user_id, started_at, duration_s, sum(duration_s) OVER (PARTITION BY user_id ORDER BY started_at) AS running_total FROM sessions ORDER BY user_id, started_at;",
              grading: { checkColumnNames: true },
              difficulty: "hard",
            },
            {
              id: "x-fr-3",
              type: "query",
              prompt:
                "Return `user_id`, `started_at` and `days_since_last` — whole days between each session and that user's previous one (NULL for the first). Sort by user_id then started_at.",
              solution:
                "SELECT user_id, started_at, (started_at::date - lag(started_at) OVER (PARTITION BY user_id ORDER BY started_at)::date) AS days_since_last FROM sessions ORDER BY user_id, started_at;",
              grading: { checkColumnNames: true },
              hints: ["Subtracting two `date` values in Postgres gives an integer number of days."],
              difficulty: "expert",
            },
            {
              id: "x-fr-4",
              type: "query",
              prompt:
                "Return `started_at`, `duration_s` and `moving_avg_3` — the average duration over the current row and the 2 before it (all users, ordered by start time), rounded to 1 decimal. Sort by started_at.",
              solution:
                "SELECT started_at, duration_s, ROUND(avg(duration_s) OVER (ORDER BY started_at ROWS BETWEEN 2 PRECEDING AND CURRENT ROW), 1) AS moving_avg_3 FROM sessions ORDER BY started_at;",
              grading: { checkColumnNames: true },
              difficulty: "expert",
            },
            {
              id: "x-fr-5",
              type: "query",
              prompt:
                "Return `user_id`, `started_at` and `next_started_at` — the timestamp of that user's following session, NULL if none. Sort by user_id then started_at.",
              solution:
                "SELECT user_id, started_at, lead(started_at) OVER (PARTITION BY user_id ORDER BY started_at) AS next_started_at FROM sessions ORDER BY user_id, started_at;",
              grading: { checkColumnNames: true },
              difficulty: "hard",
            },
            {
              id: "x-fr-6",
              type: "query",
              prompt:
                "Return `user_id` and `first_event` — the name of the very first event in that user's earliest session. Sort by user_id.",
              solution:
                "WITH ordered AS (SELECT s.user_id, e.name, row_number() OVER (PARTITION BY s.user_id ORDER BY e.occurred_at, e.id) AS rn FROM sessions s JOIN events e ON e.session_id = s.id) SELECT user_id, name AS first_event FROM ordered WHERE rn = 1 ORDER BY user_id;",
              grading: { checkColumnNames: true },
              difficulty: "expert",
            },
          ],
        },
        {
          id: "x-setops",
          slug: "set-operations",
          title: "UNION, INTERSECT & EXCEPT",
          subtitle: "Combine result sets vertically",
          objective: "Stack and compare whole result sets",
          difficulty: "medium",
          estimatedMinutes: 9,
          datasetId: "guild",
          requires: ["x-frames"],
          keywords: ["SQL UNION", "UNION ALL", "INTERSECT", "EXCEPT", "set operations"],
          concepts: [
            {
              title: "Joins go sideways, set ops go down",
              body: "A join adds columns; `UNION` adds rows. Both queries must return the same number of columns with compatible types — the column *names* come from the first query.",
              example: {
                sql: "SELECT name FROM heroes WHERE class = 'Mage'\nUNION\nSELECT name FROM heroes WHERE level > 55;",
              },
            },
            {
              title: "`UNION` de-duplicates, `UNION ALL` doesn't",
              body: "`UNION` sorts and removes duplicates, which costs real time on large sets. If you know the inputs are disjoint — or duplicates are fine — `UNION ALL` is strictly faster.",
              tone: "tip",
            },
            {
              title: "`INTERSECT` and `EXCEPT`",
              body: "`INTERSECT` keeps rows present in both; `EXCEPT` keeps rows in the first but not the second. They're the cleanest way to express \"in A and B\" or \"in A but not B\" over whole rows.",
            },
          ],
          challenges: [
            {
              id: "x-st-1",
              type: "query",
              prompt:
                "Return a single `name` column listing heroes who are **Mages** plus heroes **above level 55**, with no duplicates, sorted.",
              solution:
                "SELECT name FROM heroes WHERE class = 'Mage' UNION SELECT name FROM heroes WHERE level > 55 ORDER BY name;",
              grading: { mustUse: [{ pattern: "\\bunion\\b", label: "`UNION`" }] },
              difficulty: "medium",
            },
            {
              id: "x-st-2",
              type: "query",
              prompt:
                "Using `INTERSECT`, return the `region` values that appear in `quests` **and** match a guild `city`. Sorted.",
              solution:
                "SELECT region FROM quests INTERSECT SELECT city FROM guilds ORDER BY region;",
              grading: { mustUse: [{ pattern: "\\bintersect\\b", label: "`INTERSECT`" }] },
              difficulty: "medium",
            },
            {
              id: "x-st-3",
              type: "query",
              prompt:
                "Using `EXCEPT`, return `id` values from `quests` that have **no** entry in `quest_log`. Sorted.",
              solution:
                "SELECT id FROM quests EXCEPT SELECT quest_id FROM quest_log ORDER BY id;",
              grading: { mustUse: [{ pattern: "\\bexcept\\b", label: "`EXCEPT`" }] },
              difficulty: "medium",
            },
            {
              id: "x-st-4",
              type: "choice",
              prompt: "When is `UNION ALL` preferable to `UNION`?",
              options: [
                { id: "a", label: "Never — UNION is always safer" },
                { id: "b", label: "When duplicates are impossible or acceptable, since it skips the de-duplication sort" },
                { id: "c", label: "Only with more than three queries" },
                { id: "d", label: "When the column types differ" },
              ],
              correct: ["b"],
              difficulty: "easy",
            },
            {
              id: "x-st-5",
              type: "query",
              prompt:
                "Return `label` and `name`: guild names tagged `'guild'` and quest regions tagged `'region'`, stacked together with `UNION ALL`. Sort by label then name.",
              solution:
                "SELECT 'guild' AS label, name FROM guilds UNION ALL SELECT DISTINCT 'region' AS label, region FROM quests ORDER BY label, name;",
              grading: { mustUse: [{ pattern: "union\\s+all", label: "`UNION ALL`" }] },
              difficulty: "hard",
            },
          ],
        },
        {
          id: "x-boss",
          slug: "advanced-checkpoint",
          title: "Checkpoint: The Archmage",
          subtitle: "Everything, at once",
          objective: "Solve multi-step analytical problems end to end",
          difficulty: "expert",
          estimatedMinutes: 18,
          datasetId: "market",
          kind: "boss",
          requires: ["x-setops"],
          keywords: ["advanced SQL practice", "SQL interview questions"],
          concepts: [
            {
              title: "These are interview questions",
              body: "Each of these is close to something you'd be asked in a data engineering or analytics interview. Take them slowly and build them up in stages with CTEs.",
            },
          ],
          challenges: [
            {
              id: "x-bs-1",
              type: "query",
              prompt:
                "Return `customer_name`, `order_id` and `order_total` for each customer's **single largest delivered order**. Sort by order_total descending.",
              solution:
                "WITH totals AS (SELECT o.id AS order_id, o.customer_id, sum(oi.quantity * oi.unit_price) AS order_total FROM orders o JOIN order_items oi ON oi.order_id = o.id WHERE o.status = 'delivered' GROUP BY o.id, o.customer_id), ranked AS (SELECT t.*, row_number() OVER (PARTITION BY customer_id ORDER BY order_total DESC, order_id) AS rn FROM totals t) SELECT c.name AS customer_name, r.order_id, r.order_total FROM ranked r JOIN customers c ON c.id = r.customer_id WHERE r.rn = 1 ORDER BY r.order_total DESC;",
              grading: { checkColumnNames: true },
              difficulty: "expert",
            },
            {
              id: "x-bs-2",
              type: "query",
              prompt:
                "Return `month` (as `YYYY-MM` text) and `revenue` — total delivered-order revenue per month. Sort by month.",
              solution:
                "SELECT to_char(o.placed_at, 'YYYY-MM') AS month, sum(oi.quantity * oi.unit_price) AS revenue FROM orders o JOIN order_items oi ON oi.order_id = o.id WHERE o.status = 'delivered' GROUP BY to_char(o.placed_at, 'YYYY-MM') ORDER BY month;",
              grading: { checkColumnNames: true },
              difficulty: "hard",
            },
            {
              id: "x-bs-3",
              type: "query",
              prompt:
                "Return `month`, `revenue` and `running_revenue` — a cumulative total of monthly delivered revenue. Sort by month.",
              solution:
                "WITH monthly AS (SELECT to_char(o.placed_at, 'YYYY-MM') AS month, sum(oi.quantity * oi.unit_price) AS revenue FROM orders o JOIN order_items oi ON oi.order_id = o.id WHERE o.status = 'delivered' GROUP BY to_char(o.placed_at, 'YYYY-MM')) SELECT month, revenue, sum(revenue) OVER (ORDER BY month) AS running_revenue FROM monthly ORDER BY month;",
              grading: { checkColumnNames: true },
              difficulty: "expert",
            },
            {
              id: "x-bs-4",
              type: "query",
              prompt:
                "Return `month`, `revenue` and `mom_change` — the change versus the previous month (NULL for the first). Sort by month.",
              solution:
                "WITH monthly AS (SELECT to_char(o.placed_at, 'YYYY-MM') AS month, sum(oi.quantity * oi.unit_price) AS revenue FROM orders o JOIN order_items oi ON oi.order_id = o.id WHERE o.status = 'delivered' GROUP BY to_char(o.placed_at, 'YYYY-MM')) SELECT month, revenue, revenue - lag(revenue) OVER (ORDER BY month) AS mom_change FROM monthly ORDER BY month;",
              grading: { checkColumnNames: true },
              difficulty: "expert",
            },
            {
              id: "x-bs-5",
              type: "query",
              prompt:
                "Return `name` and `revenue` for the single highest-revenue product **in each category**, plus its `category`. Sort by category.",
              solution:
                "WITH rev AS (SELECT p.id, p.name, cat.name AS category, sum(oi.quantity * oi.unit_price) AS revenue FROM products p JOIN categories cat ON cat.id = p.category_id JOIN order_items oi ON oi.product_id = p.id GROUP BY p.id, p.name, cat.name), ranked AS (SELECT r.*, row_number() OVER (PARTITION BY category ORDER BY revenue DESC, name) AS rn FROM rev r) SELECT name, revenue, category FROM ranked WHERE rn = 1 ORDER BY category;",
              grading: { checkColumnNames: true },
              difficulty: "expert",
            },
            {
              id: "x-bs-6",
              type: "query",
              prompt:
                "Return `name` and `orders_count` for customers whose order count is **strictly greater than the average orders per customer**. Highest first, then name.",
              solution:
                "WITH per_customer AS (SELECT c.id, c.name, count(o.id) AS orders_count FROM customers c LEFT JOIN orders o ON o.customer_id = c.id GROUP BY c.id, c.name) SELECT name, orders_count FROM per_customer WHERE orders_count > (SELECT avg(orders_count) FROM per_customer) ORDER BY orders_count DESC, name;",
              grading: { checkColumnNames: true },
              difficulty: "expert",
            },
          ],
        },
      ],
    },
  ],
};
