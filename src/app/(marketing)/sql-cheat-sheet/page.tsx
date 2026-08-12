import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/marketing/prose";
import { CodeBlock, InlineMarkdown } from "@/components/lesson/prompt-text";
import { JsonLd } from "@/components/seo/json-ld";
import { buildMetadata, breadcrumbSchema } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "SQL cheat sheet — syntax reference with examples",
  description:
    "A practical PostgreSQL cheat sheet: SELECT, WHERE, JOIN, GROUP BY, window functions, CTEs, DML, dates, strings, JSON and indexes. Every snippet is runnable.",
  path: "/sql-cheat-sheet",
  keywords: [
    "SQL cheat sheet",
    "SQL syntax reference",
    "postgres cheat sheet",
    "SQL commands list",
    "SQL quick reference",
  ],
});

interface Entry {
  title: string;
  sql: string;
  note?: string;
}

interface Section {
  id: string;
  title: string;
  blurb: string;
  entries: Entry[];
}

const SECTIONS: Section[] = [
  {
    id: "reading",
    title: "Reading data",
    blurb: "The clauses you'll write in almost every query.",
    entries: [
      {
        title: "Select columns",
        sql: "SELECT name, level FROM heroes;\nSELECT * FROM heroes;              -- everything\nSELECT DISTINCT class FROM heroes; -- unique rows",
      },
      {
        title: "Filter rows",
        sql: "SELECT * FROM heroes\nWHERE level > 40\n  AND class IN ('Mage', 'Warlock')\n  AND name ILIKE '%wind%'\n  AND gold BETWEEN 1000 AND 9000;",
        note: "`BETWEEN` is inclusive at both ends — a trap with timestamps.",
      },
      {
        title: "Handle NULL",
        sql: "WHERE home_realm IS NULL\nWHERE home_realm IS NOT NULL\n\nSELECT COALESCE(home_realm, 'Unknown');  -- fallback\nSELECT NULLIF(level, 0);                 -- make a NULL\nWHERE a IS DISTINCT FROM b;              -- NULL-safe <>",
        note: "`= NULL` never matches anything. Ever.",
      },
      {
        title: "Sort and paginate",
        sql: "SELECT name, gold FROM heroes\nORDER BY gold DESC NULLS LAST, name\nLIMIT 20 OFFSET 40;",
        note: "Without ORDER BY, row order is undefined.",
      },
      {
        title: "Conditional expressions",
        sql: "SELECT name,\n       CASE WHEN level >= 50 THEN 'veteran'\n            WHEN level >= 25 THEN 'seasoned'\n            ELSE 'novice'\n       END AS tier\nFROM heroes;",
      },
    ],
  },
  {
    id: "joins",
    title: "Joins",
    blurb: "Pair rows across tables. Watch your row counts.",
    entries: [
      {
        title: "Inner join — matches only",
        sql: "SELECT h.name, g.name AS guild\nFROM heroes h\nJOIN guilds g ON h.guild_id = g.id;",
      },
      {
        title: "Left join — keep every left row",
        sql: "SELECT h.name, g.name AS guild\nFROM heroes h\nLEFT JOIN guilds g ON h.guild_id = g.id;",
        note: "Conditions on the *right* table belong in ON, not WHERE.",
      },
      {
        title: "Anti-join — rows with no match",
        sql: "SELECT q.title\nFROM quests q\nLEFT JOIN quest_log ql ON ql.quest_id = q.id\nWHERE ql.id IS NULL;\n\n-- Equivalent and NULL-safe:\nSELECT title FROM quests q\nWHERE NOT EXISTS (\n  SELECT 1 FROM quest_log ql WHERE ql.quest_id = q.id\n);",
      },
      {
        title: "Self-join — rows against rows",
        sql: "SELECT e.name AS employee, m.name AS manager\nFROM employees e\nLEFT JOIN employees m ON e.manager_id = m.id;",
      },
      {
        title: "Other join types",
        sql: "FULL OUTER JOIN  -- unmatched rows from both sides\nCROSS JOIN       -- every pair (Cartesian product)\nUSING (id)       -- shorthand when column names match",
      },
    ],
  },
  {
    id: "aggregation",
    title: "Aggregation",
    blurb: "Turn many rows into one number, per group.",
    entries: [
      {
        title: "The core five",
        sql: "SELECT count(*)        AS rows,\n       count(guild_id) AS non_null,\n       count(DISTINCT class) AS classes,\n       sum(gold)       AS total_gold,\n       round(avg(level), 2) AS avg_level,\n       min(level), max(level)\nFROM heroes;",
        note: "`count(*)` counts rows; `count(col)` counts non-NULLs.",
      },
      {
        title: "Group and filter groups",
        sql: "SELECT class, count(*) AS members\nFROM heroes\nWHERE level > 30      -- filters rows first\nGROUP BY class\nHAVING count(*) > 2   -- then filters groups\nORDER BY members DESC;",
      },
      {
        title: "Conditional aggregation (pivot)",
        sql: "SELECT channel,\n       count(*) AS orders,\n       count(*) FILTER (WHERE status = 'delivered') AS delivered,\n       sum(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled\nFROM orders\nGROUP BY channel;",
        note: "`FILTER` is Postgres; the `CASE` form works everywhere.",
      },
      {
        title: "Text and array aggregates",
        sql: "SELECT guild_id,\n       string_agg(name, ', ' ORDER BY name) AS roster,\n       array_agg(level) AS levels\nFROM heroes\nGROUP BY guild_id;",
      },
    ],
  },
  {
    id: "advanced",
    title: "Subqueries, CTEs & windows",
    blurb: "Where SQL stops being a query language and starts being expressive.",
    entries: [
      {
        title: "Subqueries",
        sql: "-- Scalar\nWHERE price > (SELECT avg(price) FROM products)\n\n-- List\nWHERE id IN (SELECT customer_id FROM orders)\n\n-- Derived table (must be aliased)\nFROM (SELECT order_id, sum(qty) AS n FROM items GROUP BY 1) t",
      },
      {
        title: "CTEs",
        sql: "WITH totals AS (\n  SELECT order_id, sum(quantity * unit_price) AS total\n  FROM order_items\n  GROUP BY order_id\n),\nbig AS (\n  SELECT * FROM totals WHERE total > 300\n)\nSELECT count(*) FROM big;",
      },
      {
        title: "Recursive CTE",
        sql: "WITH RECURSIVE chain AS (\n  SELECT id, name, 1 AS depth\n  FROM employees WHERE manager_id IS NULL   -- anchor\n  UNION ALL\n  SELECT e.id, e.name, c.depth + 1          -- recursive term\n  FROM employees e JOIN chain c ON e.manager_id = c.id\n)\nSELECT * FROM chain ORDER BY depth, name;",
      },
      {
        title: "Window functions",
        sql: "SELECT name, category_id, price,\n       avg(price)   OVER (PARTITION BY category_id)              AS cat_avg,\n       row_number() OVER (PARTITION BY category_id ORDER BY price DESC) AS rn,\n       rank()       OVER (ORDER BY price DESC)                   AS rnk,\n       lag(price)   OVER (ORDER BY id)                           AS prev_price,\n       sum(price)   OVER (ORDER BY id)                           AS running_total\nFROM products;",
        note: "You can't filter on a window function in WHERE — wrap it in a CTE.",
      },
      {
        title: "Window frames",
        sql: "avg(x) OVER (ORDER BY t ROWS BETWEEN 2 PRECEDING AND CURRENT ROW)\nsum(x) OVER (ORDER BY t ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)",
        note: "`ROWS` counts rows; `RANGE` counts values. Prefer ROWS.",
      },
      {
        title: "Set operations",
        sql: "SELECT a FROM t1 UNION     SELECT a FROM t2;  -- dedupes\nSELECT a FROM t1 UNION ALL SELECT a FROM t2;  -- faster\nSELECT a FROM t1 INTERSECT SELECT a FROM t2;\nSELECT a FROM t1 EXCEPT    SELECT a FROM t2;",
      },
    ],
  },
  {
    id: "writing",
    title: "Changing data",
    blurb: "Always write the WHERE clause before the SET clause.",
    entries: [
      {
        title: "Insert",
        sql: "INSERT INTO categories (id, name) VALUES (6, 'Relics');\n\nINSERT INTO categories (id, name) VALUES\n  (7, 'Wards'),\n  (8, 'Tomes');\n\nINSERT INTO archive SELECT * FROM orders WHERE placed_at < '2024-01-01';",
      },
      {
        title: "Update & delete",
        sql: "UPDATE products SET price = price * 1.1 WHERE category_id = 3;\nDELETE FROM products WHERE discontinued AND stock = 0;",
        note: "No WHERE means every row. There is no undo outside a transaction.",
      },
      {
        title: "Upsert",
        sql: "INSERT INTO categories (id, name)\nVALUES (1, 'Lamps')\nON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;\n\nINSERT INTO categories (id, name)\nVALUES (6, 'Relics')\nON CONFLICT DO NOTHING;",
      },
      {
        title: "Transactions",
        sql: "BEGIN;\nUPDATE accounts SET balance = balance - 100 WHERE id = 1;\nUPDATE accounts SET balance = balance + 100 WHERE id = 2;\nCOMMIT;   -- or ROLLBACK;",
      },
      {
        title: "Returning changed rows",
        sql: "UPDATE products SET stock = stock - 1\nWHERE id = 7\nRETURNING id, stock;",
      },
    ],
  },
  {
    id: "schema",
    title: "Tables & constraints",
    blurb: "Make invalid data impossible rather than merely unlikely.",
    entries: [
      {
        title: "Create a table",
        sql: "CREATE TABLE coupons (\n  code       text PRIMARY KEY,\n  percent    integer NOT NULL CHECK (percent BETWEEN 1 AND 100),\n  owner_id   integer REFERENCES users(id) ON DELETE CASCADE,\n  expires    date NOT NULL,\n  created_at timestamptz NOT NULL DEFAULT now()\n);",
      },
      {
        title: "Alter a table",
        sql: "ALTER TABLE products ADD COLUMN sku text;\nALTER TABLE products ALTER COLUMN sku SET NOT NULL;\nALTER TABLE products ADD CONSTRAINT price_positive CHECK (price > 0);\nALTER TABLE products DROP COLUMN sku;",
      },
      {
        title: "Views",
        sql: "CREATE VIEW order_totals AS\nSELECT order_id, sum(quantity * unit_price) AS total\nFROM order_items GROUP BY order_id;\n\nCREATE MATERIALIZED VIEW daily_stats AS ...;\nREFRESH MATERIALIZED VIEW daily_stats;",
      },
    ],
  },
  {
    id: "types",
    title: "Dates, text & JSON",
    blurb: "The three data types that generate the most Stack Overflow questions.",
    entries: [
      {
        title: "Dates and times",
        sql: "date_trunc('month', placed_at)          -- bucket to month\nextract(year FROM placed_at)::int      -- pull out a part\nplaced_at + INTERVAL '7 days'\nshipped_at::date - placed_at::date     -- whole days, as an int\nto_char(placed_at, 'DD Mon YYYY')\nnow(), current_date",
        note: "Store `timestamptz` in UTC; convert at the edges.",
      },
      {
        title: "Text",
        sql: "upper(s), lower(s), initcap(s), length(s), trim(s)\nleft(s, 3), right(s, 3), substring(s FROM 2 FOR 4)\nreplace(s, 'a', 'b'), split_part(email, '@', 2)\ns1 || s2                       -- concatenate\nconcat_ws(', ', a, b, c)       -- NULL-safe join\ns ~* '^ab.*z$'                 -- case-insensitive regex",
      },
      {
        title: "JSON / JSONB",
        sql: "payload->'meta'          -- returns JSON\npayload->>'name'         -- returns text\npayload#>>'{a,b,c}'      -- walk a path, return text\npayload @> '{\"x\": 1}'    -- containment (GIN-indexable)\njsonb_build_object('k', v)\njsonb_array_elements(payload->'items')",
      },
    ],
  },
  {
    id: "performance",
    title: "Performance",
    blurb: "Measure first. Then change one thing.",
    entries: [
      {
        title: "Read the plan",
        sql: "EXPLAIN SELECT ...;                    -- estimated plan\nEXPLAIN ANALYZE SELECT ...;            -- actually runs it\nEXPLAIN (ANALYZE, BUFFERS) SELECT ...; -- plus I/O",
        note: "ANALYZE really executes — wrap DML in BEGIN … ROLLBACK.",
      },
      {
        title: "Indexes",
        sql: "CREATE INDEX idx_a ON t (col);\nCREATE INDEX idx_ab ON t (a, b);              -- equality first, range last\nCREATE INDEX idx_partial ON t (a) WHERE b = 'x';\nCREATE INDEX idx_gin ON t USING gin (payload);\nCREATE UNIQUE INDEX ... ;\nDROP INDEX idx_a;",
      },
      {
        title: "Keep predicates sargable",
        sql: "-- Blocks the index\nWHERE extract(year FROM shipped_on) = 2024\nWHERE name LIKE '%son%'\n\n-- Uses the index\nWHERE shipped_on >= '2024-01-01' AND shipped_on < '2025-01-01'\nWHERE name LIKE 'Ander%'",
      },
      {
        title: "Paginate by key, not offset",
        sql: "-- O(n) — produces and discards 40,000 rows\nSELECT * FROM t ORDER BY id LIMIT 20 OFFSET 40000;\n\n-- O(1)\nSELECT * FROM t WHERE id > 40000 ORDER BY id LIMIT 20;",
      },
      {
        title: "Useful catalogue queries",
        sql: "SELECT * FROM pg_stat_user_indexes WHERE idx_scan = 0;  -- unused indexes\nSELECT pg_size_pretty(pg_total_relation_size('t'));      -- table size\nANALYZE t;                                               -- refresh stats",
      },
    ],
  },
  {
    id: "order",
    title: "Order of operations",
    blurb: "Memorise this one sequence and most SQL surprises dissolve.",
    entries: [
      {
        title: "How the database evaluates a query",
        sql: "FROM / JOIN     →  assemble the rows\nWHERE           →  filter rows\nGROUP BY        →  bucket them\nHAVING          →  filter buckets\nWINDOW          →  compute window functions\nSELECT          →  choose and compute output columns\nDISTINCT        →  remove duplicate rows\nORDER BY        →  sort\nLIMIT / OFFSET  →  slice",
        note: "SELECT runs *near the end* — which is why an alias defined there is visible to ORDER BY but not to WHERE.",
      },
    ],
  },
];

export default function CheatSheetPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "SQL cheat sheet", path: "/sql-cheat-sheet" },
        ])}
      />

      <div className="mx-auto w-full max-w-5xl px-4 py-14 sm:px-6 lg:py-20">
        <PageHeader
          eyebrow="Reference"
          title="SQL cheat sheet"
          description="The syntax worth having open in a second tab. PostgreSQL flavoured, but the overwhelming majority is standard SQL that works anywhere."
        />

        <nav aria-label="Sections" className="mb-12 flex flex-wrap gap-2">
          {SECTIONS.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="rounded-full border border-border-base px-3.5 py-1.5 text-sm font-bold text-fg-muted transition-colors hover:border-brand-500 hover:text-brand-500"
            >
              {section.title}
            </a>
          ))}
        </nav>

        <div className="space-y-14">
          {SECTIONS.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-24">
              <h2 className="text-2xl font-extrabold">{section.title}</h2>
              <p className="mt-1 text-fg-muted">{section.blurb}</p>

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                {section.entries.map((entry) => (
                  <Card key={entry.title} className="flex flex-col p-5">
                    <h3 className="mb-3 section-label">
                      {entry.title}
                    </h3>
                    <CodeBlock code={entry.sql} className="flex-1" />
                    {entry.note && (
                      <p className="mt-3 text-xs leading-relaxed text-fg-muted">
                        <InlineMarkdown>{entry.note}</InlineMarkdown>
                      </p>
                    )}
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-16 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-8 text-center text-white">
          <h2 className="text-2xl font-extrabold">Reading it isn&rsquo;t learning it</h2>
          <p className="mx-auto mt-2 max-w-xl opacity-90">
            Every snippet above is runnable right now against a real Postgres
            database in your browser. Try them, break them, see the errors.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button size="lg" variant="accent" asChild>
              <Link href="/playground">
                Open the playground
                <ArrowRight />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="secondary"
              className="border-white/25 bg-white/15 text-white hover:bg-white/25"
              asChild
            >
              <Link href="/learn">Start the course</Link>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
