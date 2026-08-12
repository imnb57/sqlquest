import type { Track } from "../types";

/**
 * Track 3 — Aggregation & Grouping.
 * Uses `guild` for the intuition-building lessons and `market` once the
 * questions start looking like real business analytics.
 */
export const aggregation: Track = {
  id: "aggregation",
  slug: "aggregation",
  title: "Aggregation & Grouping",
  subtitle: "Turn rows into answers",
  description:
    "Counting, summing and averaging is where SQL starts replacing spreadsheets. Learn GROUP BY properly — including the NULL rules and the HAVING/WHERE distinction that most tutorials gloss over.",
  level: "Intermediate",
  glyph: "📊",
  accent: "from-amber-400 to-orange-500",
  outcomes: [
    "Summarise data with COUNT, SUM, AVG, MIN and MAX",
    "Group rows and understand exactly what a group is",
    "Filter groups with HAVING rather than WHERE",
    "Compute conditional aggregates with FILTER and CASE",
  ],
  units: [
    {
      id: "a-u1",
      slug: "summarising",
      title: "Summarising Data",
      description: "Collapse many rows into one number.",
      accent: "amber",
      lessons: [
        {
          id: "a-aggregates",
          slug: "aggregate-functions",
          title: "COUNT, SUM, AVG, MIN, MAX",
          subtitle: "Five functions that answer most questions",
          objective: "Compute summary statistics over a set of rows",
          difficulty: "easy",
          estimatedMinutes: 8,
          datasetId: "guild",
          keywords: ["SQL COUNT", "SQL SUM", "SQL AVG", "aggregate functions"],
          concepts: [
            {
              title: "An aggregate collapses rows",
              body: "`SELECT count(*) FROM heroes` returns a single row, no matter how many rows went in. That's the defining feature: many in, one out.",
              example: {
                sql: "SELECT count(*) AS hero_count,\n       avg(level) AS avg_level,\n       max(level) AS top_level\nFROM heroes;",
              },
            },
            {
              title: "`count(*)` vs `count(column)`",
              body: "`count(*)` counts rows. `count(guild_id)` counts rows where that column is **not NULL**. The difference between the two is a fast way to measure missing data.",
              tone: "warning",
              example: {
                sql: "SELECT count(*) AS all_heroes,\n       count(guild_id) AS with_guild\nFROM heroes;",
              },
            },
            {
              title: "Aggregates ignore NULL",
              body: "`avg(gold_earned)` skips NULLs entirely rather than treating them as zero — which is usually right, but means `avg` and `sum/count(*)` can disagree. Know which one you actually want.",
            },
          ],
          challenges: [
            {
              id: "a-ag-1",
              type: "query",
              prompt: "How many heroes are there? Return a single column named `total`.",
              solution: "SELECT count(*) AS total FROM heroes;",
              grading: { checkColumnNames: true },
              difficulty: "easy",
            },
            {
              id: "a-ag-2",
              type: "query",
              prompt:
                "Return `lowest`, `highest` and `average` hero level in one row. Round the average to 2 decimals.",
              solution:
                "SELECT min(level) AS lowest, max(level) AS highest, ROUND(avg(level), 2) AS average FROM heroes;",
              grading: { checkColumnNames: true },
              difficulty: "medium",
            },
            {
              id: "a-ag-3",
              type: "query",
              prompt:
                "Return `total_gold` — the sum of all `gold_earned` in `quest_log`.",
              solution: "SELECT sum(gold_earned) AS total_gold FROM quest_log;",
              grading: { checkColumnNames: true },
              explanation:
                "Abandoned attempts have NULL `gold_earned`; `sum` skips them silently. That's the desired behaviour here, but always ask.",
              difficulty: "easy",
            },
            {
              id: "a-ag-4",
              type: "query",
              prompt:
                "Return `all_heroes` (every row) and `guilded` (rows with a guild) side by side.",
              solution:
                "SELECT count(*) AS all_heroes, count(guild_id) AS guilded FROM heroes;",
              grading: { checkColumnNames: true },
              difficulty: "medium",
            },
            {
              id: "a-ag-5",
              type: "predict",
              prompt:
                "`quest_log` has 34 rows; 3 have `gold_earned` NULL. What does this return?",
              query: "SELECT count(*), count(gold_earned) FROM quest_log;",
              options: [
                { id: "a", label: "34, 34" },
                { id: "b", label: "34, 31" },
                { id: "c", label: "31, 31" },
                { id: "d", label: "31, 34" },
              ],
              correct: ["b"],
              explanation:
                "`count(*)` counts rows; `count(col)` counts non-NULL values of that column.",
              difficulty: "medium",
            },
            {
              id: "a-ag-6",
              type: "query",
              prompt:
                "How many **distinct classes** are represented among heroes? Return `class_count`.",
              solution: "SELECT count(DISTINCT class) AS class_count FROM heroes;",
              grading: { checkColumnNames: true },
              hints: ["`DISTINCT` can go inside `count()`."],
              difficulty: "medium",
            },
          ],
        },
        {
          id: "a-group-by",
          slug: "group-by",
          title: "GROUP BY",
          subtitle: "One summary row per category",
          objective: "Aggregate within groups instead of over everything",
          difficulty: "medium",
          estimatedMinutes: 11,
          datasetId: "guild",
          requires: ["a-aggregates"],
          keywords: ["SQL GROUP BY", "group by tutorial", "aggregate by category"],
          concepts: [
            {
              title: "Grouping splits before it summarises",
              body: "`GROUP BY class` buckets the rows by class, then runs the aggregate inside each bucket. You get one output row per distinct class.",
              example: {
                sql: "SELECT class, count(*) AS members\nFROM heroes\nGROUP BY class;",
              },
            },
            {
              title: "The golden rule",
              body: "Every column in `SELECT` must either be **in the GROUP BY** or **inside an aggregate**. Anything else is ambiguous — if a group has 5 different names, which one would the database print?",
              tone: "warning",
              example: {
                sql: "-- Error: name is neither grouped nor aggregated\nSELECT class, name, count(*)\nFROM heroes\nGROUP BY class;",
              },
            },
            {
              title: "Grouping by several columns",
              body: "`GROUP BY class, guild_id` makes one group per unique *combination*. More grouping columns means more, smaller groups.",
            },
            {
              title: "NULL forms its own group",
              body: "Unlike in `WHERE`, all the NULLs in a grouping column are gathered together into a single group. It's the one place SQL treats NULLs as equal to each other.",
              tone: "tip",
            },
          ],
          challenges: [
            {
              id: "a-gb-1",
              type: "query",
              prompt:
                "How many heroes are in each class? Return `class` and `members`, most members first, then class A→Z.",
              solution:
                "SELECT class, count(*) AS members FROM heroes GROUP BY class ORDER BY members DESC, class;",
              grading: { checkColumnNames: true },
              difficulty: "easy",
            },
            {
              id: "a-gb-2",
              type: "query",
              prompt:
                "For each `difficulty` in `quests`, return the `difficulty`, the number of quests as `quest_count`, and the average reward as `avg_reward` rounded to 2 decimals. Sort by avg_reward descending.",
              solution:
                "SELECT difficulty, count(*) AS quest_count, ROUND(avg(reward_gold), 2) AS avg_reward FROM quests GROUP BY difficulty ORDER BY avg_reward DESC;",
              grading: { checkColumnNames: true },
              difficulty: "medium",
            },
            {
              id: "a-gb-3",
              type: "query",
              prompt:
                "How many quest attempts ended in each `status`? Return `status` and `attempts`, sorted by status.",
              solution:
                "SELECT status, count(*) AS attempts FROM quest_log GROUP BY status ORDER BY status;",
              grading: { checkColumnNames: true },
              difficulty: "easy",
            },
            {
              id: "a-gb-4",
              type: "query",
              prompt:
                "For each guild, return the guild `name` as `guild` and its member count as `members` — including guilds with **zero** members. Sort by members descending, then guild.",
              solution:
                "SELECT g.name AS guild, count(h.id) AS members FROM guilds g LEFT JOIN heroes h ON h.guild_id = g.id GROUP BY g.name ORDER BY members DESC, guild;",
              grading: { checkColumnNames: true },
              hints: [
                "LEFT JOIN keeps empty guilds.",
                "Use `count(h.id)`, not `count(*)` — the latter would count the NULL row as 1.",
              ],
              explanation:
                "This pair — LEFT JOIN plus `count(child_column)` — is the canonical \"count with zeros\" recipe.",
              difficulty: "hard",
            },
            {
              id: "a-gb-5",
              type: "query",
              prompt:
                "For each `region`, return `region` and the total `reward_gold` available as `total_reward`. Sort by total_reward descending.",
              solution:
                "SELECT region, sum(reward_gold) AS total_reward FROM quests GROUP BY region ORDER BY total_reward DESC;",
              grading: { checkColumnNames: true },
              difficulty: "medium",
            },
            {
              id: "a-gb-6",
              type: "debug",
              prompt: "Find the line that breaks the golden rule.",
              brokenSql:
                "SELECT class,\n       name,\n       count(*) AS members\nFROM heroes\nGROUP BY class;",
              buggyLine: 1,
              fixedSql:
                "SELECT class,\n       count(*) AS members\nFROM heroes\nGROUP BY class;",
              explanation:
                "`name` is neither grouped nor aggregated. If you genuinely want one name per class, use an aggregate like `min(name)` or a window function.",
              difficulty: "medium",
            },
          ],
        },
        {
          id: "a-having",
          slug: "having",
          title: "HAVING",
          subtitle: "Filtering groups, not rows",
          objective: "Apply conditions to aggregated results",
          difficulty: "medium",
          estimatedMinutes: 9,
          datasetId: "guild",
          requires: ["a-group-by"],
          keywords: ["SQL HAVING", "HAVING vs WHERE", "filter aggregate results"],
          concepts: [
            {
              title: "WHERE runs first, HAVING runs last",
              body: "`WHERE` filters individual rows *before* grouping. `HAVING` filters whole groups *after* the aggregates are computed. That's why you can't put `count(*) > 2` in `WHERE` — at that point no counting has happened yet.",
              example: {
                sql: "SELECT class, count(*) AS members\nFROM heroes\nWHERE level > 30      -- drops rows first\nGROUP BY class\nHAVING count(*) > 2;  -- then drops small groups",
              },
            },
            {
              title: "Prefer WHERE when you can",
              body: "Filtering rows early means fewer rows to group, which is usually faster. Reach for `HAVING` only when the condition genuinely depends on an aggregate.",
              tone: "tip",
            },
            {
              title: "Execution order, once and for all",
              body: "FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT. This single sequence explains most SQL surprises, including why `ORDER BY` can use a SELECT alias but `WHERE` can't.",
            },
          ],
          challenges: [
            {
              id: "a-hv-1",
              type: "query",
              prompt:
                "Which classes have **more than 2 members**? Return `class` and `members`, sorted by class.",
              solution:
                "SELECT class, count(*) AS members FROM heroes GROUP BY class HAVING count(*) > 2 ORDER BY class;",
              grading: { checkColumnNames: true },
              difficulty: "medium",
            },
            {
              id: "a-hv-2",
              type: "query",
              prompt:
                "Which `region`s offer a **total** reward above 3000 gold? Return `region` and `total_reward`, highest first.",
              solution:
                "SELECT region, sum(reward_gold) AS total_reward FROM quests GROUP BY region HAVING sum(reward_gold) > 3000 ORDER BY total_reward DESC;",
              grading: { checkColumnNames: true },
              difficulty: "medium",
            },
            {
              id: "a-hv-3",
              type: "query",
              prompt:
                "Among heroes **above level 35**, which classes have at least 2 members? Return `class` and `members`, sorted by class.",
              solution:
                "SELECT class, count(*) AS members FROM heroes WHERE level > 35 GROUP BY class HAVING count(*) >= 2 ORDER BY class;",
              grading: { checkColumnNames: true },
              hints: [
                "Two different filters: one on rows, one on groups.",
                "`WHERE level > 35` … `HAVING count(*) >= 2`",
              ],
              difficulty: "hard",
            },
            {
              id: "a-hv-4",
              type: "query",
              prompt:
                "Which heroes have attempted **3 or more** quests? Return `hero_id` and `attempts`, most attempts first, then hero_id.",
              solution:
                "SELECT hero_id, count(*) AS attempts FROM quest_log GROUP BY hero_id HAVING count(*) >= 3 ORDER BY attempts DESC, hero_id;",
              grading: { checkColumnNames: true },
              difficulty: "medium",
            },
            {
              id: "a-hv-5",
              type: "choice",
              prompt: "Why is `WHERE count(*) > 2` invalid?",
              options: [
                { id: "a", label: "count(*) isn't a real function" },
                { id: "b", label: "WHERE runs before rows are grouped, so no count exists yet" },
                { id: "c", label: "You must always alias aggregates" },
                { id: "d", label: "It's valid — HAVING is just clearer" },
              ],
              correct: ["b"],
              difficulty: "medium",
            },
            {
              id: "a-hv-6",
              type: "order",
              prompt: "Put the clauses in the order the **database evaluates** them.",
              items: ["FROM", "WHERE", "GROUP BY", "HAVING", "SELECT", "ORDER BY", "LIMIT"],
              explanation:
                "Note SELECT comes near the end — that's precisely why an alias defined there isn't visible to WHERE or GROUP BY, but is visible to ORDER BY.",
              difficulty: "hard",
            },
          ],
        },
      ],
    },
    {
      id: "a-u2",
      slug: "analytics-patterns",
      title: "Analytics Patterns",
      description: "The grouping techniques that show up in real reports.",
      accent: "orange",
      lessons: [
        {
          id: "a-conditional",
          slug: "conditional-aggregation",
          title: "Conditional aggregation",
          subtitle: "Counting subsets without extra queries",
          objective: "Aggregate a subset of rows inside a single pass",
          difficulty: "hard",
          estimatedMinutes: 11,
          datasetId: "market",
          requires: ["a-having"],
          keywords: ["FILTER clause SQL", "conditional aggregation", "pivot SQL", "CASE in aggregate"],
          concepts: [
            {
              title: "`FILTER` narrows one aggregate",
              body: "Postgres lets each aggregate carry its own filter: `count(*) FILTER (WHERE status = 'delivered')`. You get several different slices of the same rows in one scan.",
              example: {
                sql: "SELECT\n  count(*) AS orders,\n  count(*) FILTER (WHERE status = 'delivered') AS delivered,\n  count(*) FILTER (WHERE status = 'cancelled') AS cancelled\nFROM orders;",
              },
            },
            {
              title: "`CASE` is the portable version",
              body: "`sum(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END)` does the same thing and works in every database. `FILTER` is cleaner where you have it.",
              tone: "tip",
            },
            {
              title: "This is how you pivot",
              body: "Put the category in the aggregate's filter and the grouping key in `GROUP BY`, and rows become columns — a crosstab without any special syntax.",
            },
          ],
          challenges: [
            {
              id: "a-cd-1",
              type: "query",
              prompt:
                "Return `total_orders`, `delivered`, and `cancelled` counts from `orders` in a single row.",
              solution:
                "SELECT count(*) AS total_orders, count(*) FILTER (WHERE status = 'delivered') AS delivered, count(*) FILTER (WHERE status = 'cancelled') AS cancelled FROM orders;",
              grading: { checkColumnNames: true },
              difficulty: "medium",
            },
            {
              id: "a-cd-2",
              type: "query",
              prompt:
                "Per `channel`, return `channel`, `orders`, and `delivered_orders`. Sort by channel.",
              solution:
                "SELECT channel, count(*) AS orders, count(*) FILTER (WHERE status = 'delivered') AS delivered_orders FROM orders GROUP BY channel ORDER BY channel;",
              grading: { checkColumnNames: true },
              difficulty: "medium",
            },
            {
              id: "a-cd-3",
              type: "query",
              prompt:
                "For each customer `tier`, return `tier`, the number of customers as `customers`, and how many are from Europe-adjacent countries — specifically Spain, Sweden, France, Italy, Ireland or Croatia — as `european`. Sort by tier.",
              solution:
                "SELECT tier, count(*) AS customers, count(*) FILTER (WHERE country IN ('Spain','Sweden','France','Italy','Ireland','Croatia')) AS european FROM customers GROUP BY tier ORDER BY tier;",
              grading: { checkColumnNames: true },
              difficulty: "hard",
            },
            {
              id: "a-cd-4",
              type: "query",
              prompt:
                "Using `CASE` inside `sum`, return `channel` and `cancelled_count` per channel. Sort by channel.",
              solution:
                "SELECT channel, sum(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_count FROM orders GROUP BY channel ORDER BY channel;",
              grading: {
                checkColumnNames: true,
                mustUse: [{ pattern: "\\bcase\\b", label: "a `CASE` expression" }],
              },
              difficulty: "hard",
            },
            {
              id: "a-cd-5",
              type: "query",
              prompt:
                "Per `category_id` in `products`, return `category_id`, `products`, and `in_stock` (products with stock above 0). Sort by category_id.",
              solution:
                "SELECT category_id, count(*) AS products, count(*) FILTER (WHERE stock > 0) AS in_stock FROM products GROUP BY category_id ORDER BY category_id;",
              grading: { checkColumnNames: true },
              difficulty: "medium",
            },
          ],
        },
        {
          id: "a-revenue",
          slug: "aggregating-across-joins",
          title: "Aggregating across joins",
          subtitle: "Revenue, order values, and the double-counting trap",
          objective: "Combine joins and grouping to answer business questions",
          difficulty: "hard",
          estimatedMinutes: 13,
          datasetId: "market",
          requires: ["a-conditional"],
          keywords: ["SQL revenue query", "join and group by", "fan out double counting"],
          concepts: [
            {
              title: "Aggregate at the right grain",
              body: "`order_items` has one row per line item. To get order revenue you sum `quantity * unit_price` grouped by `order_id`. Get the grain wrong and every number downstream is wrong.",
              example: {
                sql: "SELECT order_id, sum(quantity * unit_price) AS order_total\nFROM order_items\nGROUP BY order_id;",
              },
            },
            {
              title: "The fan-out trap",
              body: "Join `orders` to `order_items` and each order repeats once per line. Now `sum(orders.something)` counts that value multiple times. Aggregate first, then join — or aggregate only columns from the many-side.",
              tone: "warning",
            },
          ],
          challenges: [
            {
              id: "a-rv-1",
              type: "query",
              prompt:
                "Return `order_id` and `order_total` (sum of quantity × unit_price) for each order. Sort by order_total descending, then order_id.",
              solution:
                "SELECT order_id, sum(quantity * unit_price) AS order_total FROM order_items GROUP BY order_id ORDER BY order_total DESC, order_id;",
              grading: { checkColumnNames: true },
              difficulty: "medium",
            },
            {
              id: "a-rv-2",
              type: "query",
              prompt:
                "Return product `name` and `units_sold` (total quantity across all order items). Only products that sold something. Most units first, then name.",
              solution:
                "SELECT p.name, sum(oi.quantity) AS units_sold FROM products p JOIN order_items oi ON oi.product_id = p.id GROUP BY p.name ORDER BY units_sold DESC, p.name;",
              grading: { checkColumnNames: true },
              difficulty: "hard",
            },
            {
              id: "a-rv-3",
              type: "query",
              prompt:
                "Return customer `name` and `lifetime_value` — their total spend across **delivered** orders only. Highest first, then name.",
              solution:
                "SELECT c.name, sum(oi.quantity * oi.unit_price) AS lifetime_value FROM customers c JOIN orders o ON o.customer_id = c.id JOIN order_items oi ON oi.order_id = o.id WHERE o.status = 'delivered' GROUP BY c.name ORDER BY lifetime_value DESC, c.name;",
              grading: { checkColumnNames: true },
              difficulty: "hard",
            },
            {
              id: "a-rv-4",
              type: "query",
              prompt:
                "Return category `name` as `category` and `revenue` (quantity × unit_price summed) across all orders. Highest revenue first.",
              solution:
                "SELECT cat.name AS category, sum(oi.quantity * oi.unit_price) AS revenue FROM categories cat JOIN products p ON p.category_id = cat.id JOIN order_items oi ON oi.product_id = p.id GROUP BY cat.name ORDER BY revenue DESC;",
              grading: { checkColumnNames: true },
              difficulty: "hard",
            },
            {
              id: "a-rv-5",
              type: "query",
              prompt:
                "Return `country` and `customers` (how many customers) plus `orders_placed` (how many orders those customers placed, 0 if none). Sort by orders_placed descending, then country.",
              solution:
                "SELECT c.country, count(DISTINCT c.id) AS customers, count(o.id) AS orders_placed FROM customers c LEFT JOIN orders o ON o.customer_id = c.id GROUP BY c.country ORDER BY orders_placed DESC, c.country;",
              grading: { checkColumnNames: true },
              hints: [
                "The join fans out customers — `count(c.id)` would over-count.",
                "`count(DISTINCT c.id)` fixes the customer count.",
              ],
              explanation:
                "This is fan-out in miniature. Whenever a join multiplies rows, any count of the *one*-side must be `DISTINCT`.",
              difficulty: "expert",
            },
          ],
        },
        {
          id: "a-boss",
          slug: "aggregation-checkpoint",
          title: "Checkpoint: The Quartermaster",
          subtitle: "Report-writing under exam conditions",
          objective: "Produce real analytical output from a live schema",
          difficulty: "hard",
          estimatedMinutes: 15,
          datasetId: "market",
          kind: "boss",
          requires: ["a-revenue"],
          keywords: ["SQL aggregation practice", "GROUP BY exercises"],
          concepts: [
            {
              title: "Think in three steps",
              body: "For each question: what is one row of the answer? which tables do I need to reach it? does anything fan out on the way? Answer those and the SQL writes itself.",
            },
          ],
          challenges: [
            {
              id: "a-bs-1",
              type: "query",
              prompt:
                "Return the top 3 products by `revenue` — columns `name` and `revenue`. Highest first.",
              solution:
                "SELECT p.name, sum(oi.quantity * oi.unit_price) AS revenue FROM products p JOIN order_items oi ON oi.product_id = p.id GROUP BY p.name ORDER BY revenue DESC LIMIT 3;",
              grading: { checkColumnNames: true },
              difficulty: "hard",
            },
            {
              id: "a-bs-2",
              type: "query",
              prompt:
                "Which customers have placed **more than 2** orders? Return `name` and `order_count`, most first, then name.",
              solution:
                "SELECT c.name, count(*) AS order_count FROM customers c JOIN orders o ON o.customer_id = c.id GROUP BY c.name HAVING count(*) > 2 ORDER BY order_count DESC, c.name;",
              grading: { checkColumnNames: true },
              difficulty: "medium",
            },
            {
              id: "a-bs-3",
              type: "query",
              prompt:
                "Return `status` and `avg_items` — the average number of line items per order, per order status, rounded to 2 decimals. Sort by status.",
              solution:
                "SELECT o.status, ROUND(avg(item_count), 2) AS avg_items FROM orders o JOIN (SELECT order_id, count(*) AS item_count FROM order_items GROUP BY order_id) i ON i.order_id = o.id GROUP BY o.status ORDER BY o.status;",
              grading: { checkColumnNames: true },
              hints: [
                "Count items per order first, then average those counts.",
                "A subquery in FROM gives you the per-order counts to average.",
              ],
              explanation:
                "Averaging an aggregate needs two levels. Doing it in one pass would average line items, not orders — a subtly different (and wrong) number.",
              difficulty: "expert",
            },
            {
              id: "a-bs-4",
              type: "query",
              prompt:
                "Return `category` name and `margin` — total (unit_price − cost) × quantity across all sold items. Highest margin first.",
              solution:
                "SELECT cat.name AS category, sum((oi.unit_price - p.cost) * oi.quantity) AS margin FROM categories cat JOIN products p ON p.category_id = cat.id JOIN order_items oi ON oi.product_id = p.id GROUP BY cat.name ORDER BY margin DESC;",
              grading: { checkColumnNames: true },
              difficulty: "hard",
            },
            {
              id: "a-bs-5",
              type: "query",
              prompt:
                "Return `tier` and `avg_order_value` — the average total value of a delivered order, per customer tier, rounded to 2 decimals. Sort by avg_order_value descending.",
              solution:
                "SELECT c.tier, ROUND(avg(t.order_total), 2) AS avg_order_value FROM customers c JOIN orders o ON o.customer_id = c.id JOIN (SELECT order_id, sum(quantity * unit_price) AS order_total FROM order_items GROUP BY order_id) t ON t.order_id = o.id WHERE o.status = 'delivered' GROUP BY c.tier ORDER BY avg_order_value DESC;",
              grading: { checkColumnNames: true },
              difficulty: "expert",
            },
          ],
        },
      ],
    },
  ],
};
