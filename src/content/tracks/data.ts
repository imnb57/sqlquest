import type { Track } from "../types";

/**
 * Track 5 — Changing & Modelling Data.
 *
 * Every DML challenge carries a `verifyQuery`: the grader resets the dataset,
 * runs the learner's statement, observes the table through that query, then
 * repeats the whole thing with the reference solution and compares. That means
 * an UPDATE is graded on its *effect*, not on how it was written.
 */
export const dataTrack: Track = {
  id: "data",
  slug: "data-and-modeling",
  title: "Changing & Modelling Data",
  subtitle: "Write to the database without breaking it",
  description:
    "Reading is half of SQL. Learn to insert, update and delete safely, wrap changes in transactions, design constraints that make bad data impossible, and handle dates, text and JSON like a professional.",
  level: "Advanced",
  glyph: "🛠️",
  accent: "from-rose-400 to-pink-500",
  outcomes: [
    "Insert, update and delete rows with confidence",
    "Use transactions so partial failures can't corrupt state",
    "Design keys and constraints that enforce your rules",
    "Work fluently with dates, strings and JSON",
  ],
  units: [
    {
      id: "d-u1",
      slug: "modifying-data",
      title: "Modifying Data",
      description: "INSERT, UPDATE, DELETE — and how not to lose a table.",
      accent: "rose",
      lessons: [
        {
          id: "d-insert",
          slug: "insert",
          title: "INSERT",
          subtitle: "Adding rows",
          objective: "Insert single and multiple rows, including from a query",
          difficulty: "easy",
          estimatedMinutes: 8,
          datasetId: "market",
          keywords: ["SQL INSERT", "INSERT INTO", "insert multiple rows", "RETURNING clause"],
          concepts: [
            {
              title: "Name your columns",
              body: "`INSERT INTO products (id, name, price) VALUES (...)` is far safer than relying on column position — the query keeps working when someone adds a column.",
              example: {
                sql: "INSERT INTO categories (id, name)\nVALUES (6, 'Relics');",
              },
            },
            {
              title: "Many rows, one statement",
              body: "Comma-separate the `VALUES` tuples. One statement with 1,000 rows is dramatically faster than 1,000 statements — each round trip has real cost.",
              example: {
                sql: "INSERT INTO categories (id, name) VALUES\n  (6, 'Relics'),\n  (7, 'Wards');",
              },
            },
            {
              title: "INSERT ... SELECT",
              body: "You can feed an insert directly from a query, which is how archive and backfill jobs are written.",
              tone: "tip",
              example: {
                sql: "INSERT INTO archive_orders\nSELECT * FROM orders WHERE placed_at < '2024-01-01';",
              },
            },
          ],
          challenges: [
            {
              id: "d-in-1",
              type: "query",
              prompt:
                "Insert a new category with `id` 6 and `name` **Relics**.",
              starter: "INSERT INTO categories (id, name)\n",
              solution: "INSERT INTO categories (id, name) VALUES (6, 'Relics');",
              verifyQuery: "SELECT id, name FROM categories ORDER BY id;",
              difficulty: "easy",
            },
            {
              id: "d-in-2",
              type: "query",
              prompt:
                "Insert **two** categories in one statement: (7, 'Wards') and (8, 'Tomes').",
              solution:
                "INSERT INTO categories (id, name) VALUES (7, 'Wards'), (8, 'Tomes');",
              verifyQuery: "SELECT id, name FROM categories ORDER BY id;",
              difficulty: "easy",
            },
            {
              id: "d-in-3",
              type: "query",
              prompt:
                "Insert a product: id 17, name **Ghostlight Lamp**, category_id 1, price 99.00, cost 41.00, stock 25, not discontinued.",
              solution:
                "INSERT INTO products (id, name, category_id, price, cost, stock, discontinued) VALUES (17, 'Ghostlight Lamp', 1, 99.00, 41.00, 25, false);",
              verifyQuery: "SELECT id, name, price, stock FROM products ORDER BY id;",
              difficulty: "medium",
            },
            {
              id: "d-in-4",
              type: "choice",
              prompt: "Why prefer `INSERT INTO t (a, b) VALUES (...)` over `INSERT INTO t VALUES (...)`?",
              options: [
                { id: "a", label: "It's faster" },
                { id: "b", label: "It keeps working when the table gains or reorders columns" },
                { id: "c", label: "It's required by Postgres" },
                { id: "d", label: "It allows duplicate keys" },
              ],
              correct: ["b"],
              difficulty: "easy",
            },
            {
              id: "d-in-5",
              type: "fill-blank",
              prompt: "Complete the multi-row insert.",
              template:
                "INSERT ___ categories (id, name)\n___\n  (9, 'Runes'),\n  (10, 'Seals');",
              answers: ["INTO", "VALUES"],
              distractors: ["TO", "SET", "ROWS"],
              difficulty: "easy",
            },
          ],
        },
        {
          id: "d-update",
          slug: "update",
          title: "UPDATE",
          subtitle: "Changing rows that already exist",
          objective: "Modify rows safely and precisely",
          difficulty: "medium",
          estimatedMinutes: 9,
          datasetId: "market",
          requires: ["d-insert"],
          keywords: ["SQL UPDATE", "UPDATE SET WHERE", "update from another table"],
          concepts: [
            {
              title: "`WHERE` is not optional in practice",
              body: "`UPDATE products SET price = 0` updates **every row**. There's no undo outside a transaction. Write the `WHERE` clause first, then the `SET`.",
              tone: "warning",
              example: {
                sql: "UPDATE products\nSET price = price * 1.10\nWHERE category_id = 3;",
              },
            },
            {
              title: "Test with SELECT first",
              body: "Run `SELECT * FROM products WHERE ...` with the exact same condition. If the row count looks right, swap `SELECT *` for `UPDATE ... SET`. This habit prevents most production accidents.",
              tone: "tip",
            },
            {
              title: "Update several columns at once",
              body: "One `SET`, comma-separated assignments. The right-hand sides all see the *old* values, so you can swap two columns in a single statement.",
              example: {
                sql: "UPDATE products\nSET price = price * 0.9,\n    discontinued = true\nWHERE stock = 0;",
              },
            },
          ],
          challenges: [
            {
              id: "d-up-1",
              type: "query",
              prompt: "Set the `stock` of product id 3 to **50**.",
              solution: "UPDATE products SET stock = 50 WHERE id = 3;",
              verifyQuery: "SELECT id, stock FROM products ORDER BY id;",
              difficulty: "easy",
            },
            {
              id: "d-up-2",
              type: "query",
              prompt:
                "Raise the `price` of every product in category 3 (**Brews**) by **10%**.",
              solution: "UPDATE products SET price = price * 1.10 WHERE category_id = 3;",
              verifyQuery: "SELECT id, price FROM products ORDER BY id;",
              difficulty: "medium",
            },
            {
              id: "d-up-3",
              type: "query",
              prompt:
                "Mark every product with **zero stock** as `discontinued = true`.",
              solution: "UPDATE products SET discontinued = true WHERE stock = 0;",
              verifyQuery: "SELECT id, discontinued FROM products ORDER BY id;",
              difficulty: "easy",
            },
            {
              id: "d-up-4",
              type: "query",
              prompt:
                "Promote every customer from **bronze** to **silver**.",
              solution: "UPDATE customers SET tier = 'silver' WHERE tier = 'bronze';",
              verifyQuery: "SELECT id, tier FROM customers ORDER BY id;",
              difficulty: "easy",
            },
            {
              id: "d-up-5",
              type: "query",
              prompt:
                "For every **cancelled** order, set `shipped_at` to NULL and `channel` to **'void'**.",
              solution:
                "UPDATE orders SET shipped_at = NULL, channel = 'void' WHERE status = 'cancelled';",
              verifyQuery: "SELECT id, shipped_at, channel FROM orders ORDER BY id;",
              difficulty: "medium",
            },
            {
              id: "d-up-6",
              type: "debug",
              prompt: "This was meant to discount one product. Which line is catastrophic?",
              brokenSql: "UPDATE products\nSET price = price * 0.5;",
              buggyLine: 1,
              fixedSql: "UPDATE products\nSET price = price * 0.5\nWHERE id = 7;",
              explanation:
                "There's no `WHERE`, so every product is halved. Outside a transaction this is unrecoverable — which is exactly why the next lesson exists.",
              difficulty: "medium",
            },
          ],
        },
        {
          id: "d-delete",
          slug: "delete-and-upsert",
          title: "DELETE & UPSERT",
          subtitle: "Removing rows, and insert-or-update",
          objective: "Delete safely and handle conflicts with ON CONFLICT",
          difficulty: "medium",
          estimatedMinutes: 10,
          datasetId: "market",
          requires: ["d-update"],
          keywords: ["SQL DELETE", "TRUNCATE vs DELETE", "UPSERT", "ON CONFLICT DO UPDATE"],
          concepts: [
            {
              title: "DELETE removes whole rows",
              body: "`DELETE FROM orders WHERE status = 'cancelled'` — again, omit the `WHERE` and the table empties. `TRUNCATE` is the fast bulk version, but it can't be filtered and doesn't fire row triggers.",
              tone: "warning",
            },
            {
              title: "Foreign keys protect you",
              body: "You can't delete a customer who still has orders unless the constraint says `ON DELETE CASCADE`. That error is the database doing its job — resist the urge to drop the constraint.",
            },
            {
              title: "UPSERT: insert, or update if it exists",
              body: "`INSERT ... ON CONFLICT (id) DO UPDATE SET ...` handles \"create or overwrite\" atomically. Use `EXCLUDED` to reference the values you tried to insert.",
              tone: "tip",
              example: {
                sql: "INSERT INTO categories (id, name)\nVALUES (1, 'Lamps')\nON CONFLICT (id) DO UPDATE\n  SET name = EXCLUDED.name;",
              },
            },
          ],
          challenges: [
            {
              id: "d-dl-1",
              type: "query",
              prompt: "Delete every **pending** order's line items, then… actually, start simpler: delete all rows from `order_items` belonging to order 1009.",
              solution: "DELETE FROM order_items WHERE order_id = 1009;",
              verifyQuery: "SELECT id, order_id FROM order_items ORDER BY id;",
              difficulty: "easy",
            },
            {
              id: "d-dl-2",
              type: "query",
              prompt:
                "Delete every product that is **discontinued and out of stock**.",
              solution: "DELETE FROM products WHERE discontinued AND stock = 0;",
              verifyQuery: "SELECT id, name FROM products ORDER BY id;",
              difficulty: "medium",
            },
            {
              id: "d-dl-3",
              type: "query",
              prompt:
                "Upsert category id 1 so its name becomes **Lamps & Lanterns**, using `ON CONFLICT`.",
              solution:
                "INSERT INTO categories (id, name) VALUES (1, 'Lamps & Lanterns') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;",
              verifyQuery: "SELECT id, name FROM categories ORDER BY id;",
              grading: { mustUse: [{ pattern: "on\\s+conflict", label: "`ON CONFLICT`" }] },
              difficulty: "hard",
            },
            {
              id: "d-dl-4",
              type: "query",
              prompt:
                "Insert category (6, 'Relics') but do **nothing** if the id already exists.",
              solution:
                "INSERT INTO categories (id, name) VALUES (6, 'Relics') ON CONFLICT (id) DO NOTHING;",
              verifyQuery: "SELECT id, name FROM categories ORDER BY id;",
              difficulty: "medium",
            },
            {
              id: "d-dl-5",
              type: "choice",
              prompt: "What happens if you `DELETE FROM customers WHERE id = 1` and customer 1 has orders?",
              options: [
                { id: "a", label: "The customer and their orders are both deleted" },
                { id: "b", label: "A foreign-key violation error — the delete is rejected" },
                { id: "c", label: "The orders' customer_id becomes NULL" },
                { id: "d", label: "The customer row is silently skipped" },
              ],
              correct: ["b"],
              explanation:
                "Unless the constraint declares `ON DELETE CASCADE` or `SET NULL`, Postgres refuses rather than leave orphaned rows.",
              difficulty: "medium",
            },
          ],
        },
        {
          id: "d-transactions",
          slug: "transactions",
          title: "Transactions",
          subtitle: "All of it, or none of it",
          objective: "Group statements atomically and roll back on failure",
          difficulty: "hard",
          estimatedMinutes: 10,
          datasetId: "market",
          requires: ["d-delete"],
          keywords: ["SQL transaction", "BEGIN COMMIT ROLLBACK", "ACID", "isolation levels"],
          concepts: [
            {
              title: "BEGIN … COMMIT",
              body: "Everything between them succeeds together or fails together. A transfer that debits one account and credits another must be atomic, or money vanishes.",
              example: {
                sql: "BEGIN;\nUPDATE accounts SET balance = balance - 100 WHERE id = 1;\nUPDATE accounts SET balance = balance + 100 WHERE id = 2;\nCOMMIT;",
              },
            },
            {
              title: "ROLLBACK undoes everything",
              body: "Made a mistake mid-transaction? `ROLLBACK` discards the whole block. This is the safety net that makes a `WHERE`-less UPDATE survivable — as long as you started with `BEGIN`.",
              tone: "tip",
            },
            {
              title: "ACID in one line each",
              body: "**Atomic** — all or nothing. **Consistent** — constraints hold at commit. **Isolated** — concurrent transactions don't see each other's half-done work. **Durable** — once committed, it survives a crash.",
            },
          ],
          challenges: [
            {
              id: "d-tx-1",
              type: "query",
              prompt:
                "In a single transaction, set product 1's stock to 100 and product 2's stock to 200, then commit.",
              solution:
                "BEGIN; UPDATE products SET stock = 100 WHERE id = 1; UPDATE products SET stock = 200 WHERE id = 2; COMMIT;",
              verifyQuery: "SELECT id, stock FROM products ORDER BY id;",
              grading: { mustUse: [{ pattern: "\\bbegin\\b", label: "`BEGIN`" }] },
              difficulty: "medium",
            },
            {
              id: "d-tx-2",
              type: "query",
              prompt:
                "Start a transaction, delete every row from `order_items`, then **roll it back** so nothing changes.",
              solution: "BEGIN; DELETE FROM order_items; ROLLBACK;",
              verifyQuery: "SELECT count(*) AS remaining FROM order_items;",
              grading: { mustUse: [{ pattern: "\\brollback\\b", label: "`ROLLBACK`" }] },
              explanation:
                "The delete really happened — inside the transaction. `ROLLBACK` discarded it. This is the single most useful safety habit in SQL.",
              difficulty: "hard",
            },
            {
              id: "d-tx-3",
              type: "choice",
              prompt: "Which property guarantees a committed transaction survives a power cut?",
              options: [
                { id: "a", label: "Atomicity" },
                { id: "b", label: "Consistency" },
                { id: "c", label: "Isolation" },
                { id: "d", label: "Durability" },
              ],
              correct: ["d"],
              difficulty: "easy",
            },
            {
              id: "d-tx-4",
              type: "choice",
              prompt:
                "Two transactions read the same row, both add 10, both commit. The increment is applied once, not twice. What's this called?",
              options: [
                { id: "a", label: "Dirty read" },
                { id: "b", label: "Lost update" },
                { id: "c", label: "Phantom read" },
                { id: "d", label: "Deadlock" },
              ],
              correct: ["b"],
              explanation:
                "Fix it with `UPDATE ... SET n = n + 10` (which locks and re-reads), `SELECT ... FOR UPDATE`, or a stricter isolation level.",
              difficulty: "expert",
            },
            {
              id: "d-tx-5",
              type: "order",
              prompt: "Order the steps of a safe, reversible bulk edit.",
              items: [
                "BEGIN;",
                "SELECT count(*) FROM products WHERE category_id = 3;",
                "UPDATE products SET price = price * 1.1 WHERE category_id = 3;",
                "SELECT id, price FROM products WHERE category_id = 3;",
                "COMMIT;",
              ],
              difficulty: "medium",
            },
          ],
        },
      ],
    },

    {
      id: "d-u2",
      slug: "modelling-and-types",
      title: "Modelling & Types",
      description: "Constraints, views, and the data types you'll actually meet.",
      accent: "pink",
      lessons: [
        {
          id: "d-constraints",
          slug: "constraints-and-keys",
          title: "Constraints & keys",
          subtitle: "Make invalid data impossible",
          objective: "Design tables that reject bad data by construction",
          difficulty: "hard",
          estimatedMinutes: 11,
          datasetId: "market",
          requires: ["d-transactions"],
          keywords: ["SQL constraints", "CHECK constraint", "NOT NULL", "UNIQUE", "foreign key"],
          concepts: [
            {
              title: "Constraints are cheaper than validation",
              body: "Application code can be bypassed; a database constraint cannot. `NOT NULL`, `UNIQUE`, `CHECK` and `FOREIGN KEY` turn entire classes of bug into an error at write time.",
              example: {
                sql: "CREATE TABLE coupons (\n  code    text PRIMARY KEY,\n  percent integer NOT NULL CHECK (percent BETWEEN 1 AND 100),\n  expires date NOT NULL\n);",
              },
            },
            {
              title: "CHECK expresses business rules",
              body: "`CHECK (price >= cost)` means a loss-making row can never exist. Constraints are documentation that's guaranteed to be accurate.",
              tone: "tip",
            },
            {
              title: "Adding constraints to live tables",
              body: "`ALTER TABLE t ADD CONSTRAINT ... CHECK (...)` validates existing rows and fails if any violate it — which is a very good way to discover what your data really looks like.",
            },
          ],
          challenges: [
            {
              id: "d-cs-1",
              type: "query",
              prompt:
                "Create a table `coupons` with `code` text primary key, `percent` integer not null with a CHECK that it's between 1 and 100, and `expires` date not null.",
              solution:
                "CREATE TABLE coupons (code text PRIMARY KEY, percent integer NOT NULL CHECK (percent BETWEEN 1 AND 100), expires date NOT NULL);",
              verifyQuery:
                "SELECT column_name, is_nullable, data_type FROM information_schema.columns WHERE table_name = 'coupons' ORDER BY ordinal_position;",
              difficulty: "medium",
            },
            {
              id: "d-cs-2",
              type: "query",
              prompt:
                "Add a `UNIQUE` constraint named `products_name_unique` on `products(name)`.",
              solution:
                "ALTER TABLE products ADD CONSTRAINT products_name_unique UNIQUE (name);",
              verifyQuery:
                "SELECT constraint_name FROM information_schema.table_constraints WHERE table_name = 'products' AND constraint_type = 'UNIQUE' ORDER BY constraint_name;",
              difficulty: "medium",
            },
            {
              id: "d-cs-3",
              type: "query",
              prompt:
                "Add a CHECK constraint named `products_price_positive` ensuring `price` is greater than 0.",
              solution:
                "ALTER TABLE products ADD CONSTRAINT products_price_positive CHECK (price > 0);",
              verifyQuery:
                "SELECT constraint_name FROM information_schema.table_constraints WHERE table_name = 'products' AND constraint_type = 'CHECK' AND constraint_name = 'products_price_positive';",
              difficulty: "medium",
            },
            {
              id: "d-cs-4",
              type: "choice",
              prompt: "Which constraint prevents an order referencing a customer that doesn't exist?",
              options: [
                { id: "a", label: "NOT NULL" },
                { id: "b", label: "UNIQUE" },
                { id: "c", label: "FOREIGN KEY" },
                { id: "d", label: "CHECK" },
              ],
              correct: ["c"],
              difficulty: "easy",
            },
            {
              id: "d-cs-5",
              type: "choice",
              prompt: "How many NULLs can a `UNIQUE` column hold in Postgres?",
              options: [
                { id: "a", label: "None" },
                { id: "b", label: "Exactly one" },
                { id: "c", label: "Any number — NULLs aren't considered equal" },
                { id: "d", label: "It depends on the index type" },
              ],
              correct: ["c"],
              explanation:
                "Because `NULL = NULL` is unknown, uniqueness never triggers between NULLs. Add `NOT NULL` if you need genuine uniqueness.",
              difficulty: "hard",
            },
          ],
        },
        {
          id: "d-views",
          slug: "views",
          title: "Views",
          subtitle: "Save a query and reuse it as a table",
          objective: "Encapsulate query logic behind a stable interface",
          difficulty: "medium",
          estimatedMinutes: 8,
          datasetId: "market",
          requires: ["d-constraints"],
          keywords: ["SQL views", "CREATE VIEW", "materialized view"],
          concepts: [
            {
              title: "A view is a named query",
              body: "`CREATE VIEW order_totals AS SELECT ...` — from then on you can `SELECT * FROM order_totals` like any table. Nothing is stored; the query runs each time.",
              example: {
                sql: "CREATE VIEW order_totals AS\nSELECT order_id, sum(quantity * unit_price) AS total\nFROM order_items\nGROUP BY order_id;",
              },
            },
            {
              title: "Why teams love them",
              body: "Views centralise business definitions. When \"active customer\" changes meaning, you change one view rather than hunting through forty dashboards.",
              tone: "tip",
            },
            {
              title: "Materialized views trade freshness for speed",
              body: "`CREATE MATERIALIZED VIEW` stores the results physically. Reads are fast; the data is stale until you `REFRESH MATERIALIZED VIEW`.",
            },
          ],
          challenges: [
            {
              id: "d-vw-1",
              type: "query",
              prompt:
                "Create a view `order_totals` with columns `order_id` and `total` (sum of quantity × unit_price per order).",
              solution:
                "CREATE VIEW order_totals AS SELECT order_id, sum(quantity * unit_price) AS total FROM order_items GROUP BY order_id;",
              verifyQuery: "SELECT order_id, total FROM order_totals ORDER BY order_id;",
              difficulty: "medium",
            },
            {
              id: "d-vw-2",
              type: "query",
              prompt:
                "Create a view `active_products` showing `id`, `name` and `price` for products that are **not discontinued and have stock**.",
              solution:
                "CREATE VIEW active_products AS SELECT id, name, price FROM products WHERE NOT discontinued AND stock > 0;",
              verifyQuery: "SELECT id, name, price FROM active_products ORDER BY id;",
              difficulty: "medium",
            },
            {
              id: "d-vw-3",
              type: "choice",
              prompt: "What does a regular (non-materialized) view store?",
              options: [
                { id: "a", label: "A copy of the result rows" },
                { id: "b", label: "Only the query definition — it re-runs each time" },
                { id: "c", label: "An index over the base tables" },
                { id: "d", label: "Nothing; it's purely documentation" },
              ],
              correct: ["b"],
              difficulty: "easy",
            },
            {
              id: "d-vw-4",
              type: "query",
              prompt:
                "Create a view `customer_orders` joining customers and orders with columns `customer_name`, `order_id` and `status`.",
              solution:
                "CREATE VIEW customer_orders AS SELECT c.name AS customer_name, o.id AS order_id, o.status FROM customers c JOIN orders o ON o.customer_id = c.id;",
              verifyQuery:
                "SELECT customer_name, order_id, status FROM customer_orders ORDER BY order_id;",
              difficulty: "medium",
            },
          ],
        },
        {
          id: "d-dates",
          slug: "dates-and-times",
          title: "Dates & times",
          subtitle: "Truncating, intervals, and time zones",
          objective: "Manipulate temporal data reliably",
          difficulty: "hard",
          estimatedMinutes: 11,
          datasetId: "market",
          requires: ["d-views"],
          keywords: ["SQL date functions", "DATE_TRUNC", "INTERVAL", "EXTRACT", "timezone SQL"],
          concepts: [
            {
              title: "`date_trunc` buckets time",
              body: "`date_trunc('month', placed_at)` snaps every timestamp to the first instant of its month — the standard way to build monthly reports without string juggling.",
              example: {
                sql: "SELECT date_trunc('month', placed_at) AS month, count(*)\nFROM orders\nGROUP BY 1\nORDER BY 1;",
              },
            },
            {
              title: "`EXTRACT` pulls out a part",
              body: "`extract(year FROM placed_at)`, `extract(dow FROM placed_at)` (0 = Sunday). Great for grouping by day-of-week, less good for chronological ordering — use `date_trunc` for that.",
            },
            {
              title: "Intervals do date arithmetic",
              body: "`placed_at + INTERVAL '7 days'`, `now() - INTERVAL '1 month'`. Subtracting two timestamps gives an interval; subtracting two `date`s gives a plain integer of days.",
              tone: "tip",
            },
            {
              title: "Store UTC, display local",
              body: "Use `timestamptz` and keep everything in UTC internally. Converting at the edges (`AT TIME ZONE 'Europe/Madrid'`) avoids an entire genre of off-by-one-day bug.",
              tone: "warning",
            },
          ],
          challenges: [
            {
              id: "d-dt-1",
              type: "query",
              prompt:
                "Return `month` (truncated to month) and `orders` count per month. Sort by month.",
              solution:
                "SELECT date_trunc('month', placed_at) AS month, count(*) AS orders FROM orders GROUP BY 1 ORDER BY 1;",
              grading: { checkColumnNames: true },
              difficulty: "medium",
            },
            {
              id: "d-dt-2",
              type: "query",
              prompt:
                "Return `id`, `placed_at` and `ship_deadline` — 3 days after the order was placed. Sort by id.",
              solution:
                "SELECT id, placed_at, placed_at + INTERVAL '3 days' AS ship_deadline FROM orders ORDER BY id;",
              grading: { checkColumnNames: true },
              difficulty: "medium",
            },
            {
              id: "d-dt-3",
              type: "query",
              prompt:
                "Return `id` and `days_to_ship` — whole days between `placed_at` and `shipped_at`, only for orders that shipped. Sort by id.",
              solution:
                "SELECT id, (shipped_at::date - placed_at::date) AS days_to_ship FROM orders WHERE shipped_at IS NOT NULL ORDER BY id;",
              grading: { checkColumnNames: true },
              difficulty: "hard",
            },
            {
              id: "d-dt-4",
              type: "query",
              prompt:
                "Return `year` and `signups` — customers per signup year. Sort by year.",
              solution:
                "SELECT extract(year FROM signed_up)::int AS year, count(*) AS signups FROM customers GROUP BY 1 ORDER BY 1;",
              grading: { checkColumnNames: true },
              difficulty: "medium",
            },
            {
              id: "d-dt-5",
              type: "query",
              prompt:
                "Return `id` and `placed_label` formatted as `DD Mon YYYY` (e.g. `08 Jan 2024`). Sort by id.",
              solution:
                "SELECT id, to_char(placed_at, 'DD Mon YYYY') AS placed_label FROM orders ORDER BY id;",
              grading: { checkColumnNames: true },
              difficulty: "hard",
            },
            {
              id: "d-dt-6",
              type: "choice",
              prompt: "Why prefer `timestamptz` over `timestamp` for event times?",
              options: [
                { id: "a", label: "It's smaller on disk" },
                { id: "b", label: "It anchors the value to an absolute instant, surviving time-zone and DST changes" },
                { id: "c", label: "It supports higher precision" },
                { id: "d", label: "It's indexed automatically" },
              ],
              correct: ["b"],
              difficulty: "hard",
            },
          ],
        },
        {
          id: "d-strings-json",
          slug: "strings-and-json",
          title: "Text & JSON",
          subtitle: "Two data types you'll meet everywhere",
          objective: "Manipulate strings and query JSON documents",
          difficulty: "hard",
          estimatedMinutes: 12,
          datasetId: "market",
          requires: ["d-dates"],
          keywords: ["SQL string functions", "postgres JSONB", "json query SQL", "regexp SQL"],
          concepts: [
            {
              title: "The string toolkit",
              body: "`upper`, `lower`, `initcap`, `length`, `trim`, `substring`, `replace`, `split_part`, `left`, `right`. `position('@' in email)` finds an index; `||` concatenates.",
              example: {
                sql: "SELECT email,\n       split_part(email, '@', 2) AS domain,\n       initcap(name)           AS display\nFROM customers;",
              },
            },
            {
              title: "Pattern matching beyond LIKE",
              body: "`~` applies a POSIX regex, `~*` is its case-insensitive twin. `regexp_replace(name, '[^a-z]', '', 'g')` strips characters. Powerful — and slow enough that you should filter first.",
              tone: "tip",
            },
            {
              title: "JSONB is a first-class type",
              body: "`->` returns JSON, `->>` returns text, `#>>` walks a path. `jsonb` is binary, indexable and de-duplicated; plain `json` keeps the raw text. Use `jsonb` unless you need byte-exact round-tripping.",
              example: {
                sql: "SELECT payload->>'name'          AS name,\n       (payload->'meta'->>'age')::int AS age\nFROM records;",
              },
            },
          ],
          challenges: [
            {
              id: "d-sj-1",
              type: "query",
              prompt:
                "Return `name` and `domain` — the part of `email` after the `@`. Sort by name.",
              solution:
                "SELECT name, split_part(email, '@', 2) AS domain FROM customers ORDER BY name;",
              grading: { checkColumnNames: true },
              difficulty: "medium",
            },
            {
              id: "d-sj-2",
              type: "query",
              prompt:
                "Return `name` and `initials` — the first letter of the first word plus the first letter of the last word, uppercase, e.g. `Nadia Reyes` → `NR`. Sort by name.",
              solution:
                "SELECT name, upper(left(split_part(name, ' ', 1), 1) || left(split_part(name, ' ', 2), 1)) AS initials FROM customers ORDER BY name;",
              grading: { checkColumnNames: true },
              difficulty: "expert",
            },
            {
              id: "d-sj-3",
              type: "query",
              prompt:
                "Return product `name` and `slug` — lowercase with spaces replaced by hyphens. Sort by name.",
              solution:
                "SELECT name, replace(lower(name), ' ', '-') AS slug FROM products ORDER BY name;",
              grading: { checkColumnNames: true },
              difficulty: "medium",
            },
            {
              id: "d-sj-4",
              type: "query",
              prompt:
                "Build a JSON object per customer: return `id` and `doc` where doc is `jsonb_build_object('name', name, 'country', country)`. Sort by id.",
              solution:
                "SELECT id, jsonb_build_object('name', name, 'country', country) AS doc FROM customers ORDER BY id;",
              grading: { checkColumnNames: true },
              difficulty: "hard",
            },
            {
              id: "d-sj-5",
              type: "query",
              prompt:
                "From a JSON literal, extract a text value: return `city` from `'{\"address\": {\"city\": \"Lisbon\"}}'::jsonb` using the `#>>` path operator.",
              solution:
                "SELECT ('{\"address\": {\"city\": \"Lisbon\"}}'::jsonb) #>> '{address,city}' AS city;",
              grading: { checkColumnNames: true },
              difficulty: "expert",
            },
            {
              id: "d-sj-6",
              type: "choice",
              prompt: "What's the difference between `->` and `->>` in Postgres JSON?",
              options: [
                { id: "a", label: "`->` returns JSON; `->>` returns text" },
                { id: "b", label: "`->` is for arrays; `->>` is for objects" },
                { id: "c", label: "`->>` is deprecated" },
                { id: "d", label: "They're identical" },
              ],
              correct: ["a"],
              explanation:
                "`->` keeps you in JSON so you can chain further; `->>` unwraps to text and ends the chain. Reaching for `->>` too early is a common mistake.",
              difficulty: "medium",
            },
          ],
        },
      ],
    },
  ],
};
