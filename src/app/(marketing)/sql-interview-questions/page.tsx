import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/marketing/prose";
import { CodeBlock, InlineMarkdown } from "@/components/lesson/prompt-text";
import { JsonLd } from "@/components/seo/json-ld";
import { buildMetadata, breadcrumbSchema, faqSchema } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "SQL interview questions with answers",
  description:
    "The SQL questions that actually come up in interviews — second-highest salary, top-N per group, running totals, gaps and islands, duplicate detection — each with a worked answer and the reasoning behind it.",
  path: "/sql-interview-questions",
  keywords: [
    "SQL interview questions",
    "SQL interview questions and answers",
    "second highest salary SQL",
    "top n per group SQL",
    "data analyst SQL interview",
    "SQL coding interview",
  ],
});

interface Question {
  question: string;
  difficulty: "Easy" | "Medium" | "Hard";
  topic: string;
  /** What the interviewer is really checking. */
  testing: string;
  answer: string;
  explanation: string;
  lesson?: string;
}

const QUESTIONS: Question[] = [
  {
    question: "Find the second-highest salary.",
    difficulty: "Easy",
    topic: "Ordering",
    testing:
      "Whether you reach for LIMIT/OFFSET, and whether you notice the tie problem.",
    answer: `-- Simple, but treats duplicates as separate rows
SELECT salary
FROM employees
ORDER BY salary DESC
LIMIT 1 OFFSET 1;

-- Handles ties correctly: the second distinct salary
SELECT DISTINCT salary
FROM employees
ORDER BY salary DESC
LIMIT 1 OFFSET 1;

-- Window-function version, scales to Nth
SELECT DISTINCT salary
FROM (
  SELECT salary, dense_rank() OVER (ORDER BY salary DESC) AS rnk
  FROM employees
) t
WHERE rnk = 2;`,
    explanation:
      "The real test is whether you ask *'what if two people share the top salary?'*. `DENSE_RANK` gives the second distinct salary; `ROW_NUMBER` would give the second row. Saying which you've chosen and why is worth more than the query itself.",
    lesson: "limit-and-offset",
  },
  {
    question: "Return the top 3 products by revenue in each category.",
    difficulty: "Medium",
    topic: "Window functions",
    testing: "Whether you know the top-N-per-group pattern.",
    answer: `WITH revenue AS (
  SELECT p.category_id,
         p.name,
         sum(oi.quantity * oi.unit_price) AS revenue
  FROM products p
  JOIN order_items oi ON oi.product_id = p.id
  GROUP BY p.category_id, p.name
),
ranked AS (
  SELECT *,
         row_number() OVER (
           PARTITION BY category_id
           ORDER BY revenue DESC, name
         ) AS rn
  FROM revenue
)
SELECT category_id, name, revenue
FROM ranked
WHERE rn <= 3
ORDER BY category_id, revenue DESC;`,
    explanation:
      "Partition by the group, order by the metric, number the rows, filter outside. The `name` tiebreaker matters: without it `ROW_NUMBER` is non-deterministic and the query can return different rows on different runs.",
    lesson: "ranking-functions",
  },
  {
    question: "Find duplicate rows in a table.",
    difficulty: "Easy",
    topic: "Aggregation",
    testing: "Comfort with GROUP BY and HAVING.",
    answer: `-- Which values are duplicated, and how often
SELECT email, count(*) AS copies
FROM users
GROUP BY email
HAVING count(*) > 1;

-- The actual duplicate rows, keeping the earliest of each
WITH ranked AS (
  SELECT id, email,
         row_number() OVER (PARTITION BY email ORDER BY id) AS rn
  FROM users
)
SELECT * FROM ranked WHERE rn > 1;`,
    explanation:
      "The follow-up is always 'now delete them, keeping one'. The window version answers both — `DELETE FROM users WHERE id IN (SELECT id FROM ranked WHERE rn > 1)`.",
    lesson: "having",
  },
  {
    question: "Calculate a running total of daily revenue.",
    difficulty: "Medium",
    topic: "Window functions",
    testing: "Whether you know that ORDER BY inside OVER creates a frame.",
    answer: `SELECT day,
       revenue,
       sum(revenue) OVER (ORDER BY day) AS running_total
FROM daily_revenue
ORDER BY day;`,
    explanation:
      "Adding `ORDER BY` inside `OVER` implicitly frames the window as everything up to and including the current row — so `sum()` becomes cumulative with no extra syntax. A self-join answer isn't wrong, but it signals unfamiliarity with window functions.",
    lesson: "lag-lead-running-totals",
  },
  {
    question: "Show month-over-month revenue change.",
    difficulty: "Medium",
    topic: "Window functions",
    testing: "LAG, and handling the first row.",
    answer: `WITH monthly AS (
  SELECT date_trunc('month', placed_at) AS month,
         sum(total) AS revenue
  FROM orders
  WHERE status = 'delivered'
  GROUP BY 1
)
SELECT month,
       revenue,
       revenue - lag(revenue) OVER (ORDER BY month) AS change,
       round(
         100.0 * (revenue - lag(revenue) OVER (ORDER BY month))
         / NULLIF(lag(revenue) OVER (ORDER BY month), 0), 1
       ) AS pct_change
FROM monthly
ORDER BY month;`,
    explanation:
      "`NULLIF(..., 0)` guards against dividing by a zero-revenue month. The first row correctly returns NULL rather than a fabricated 0% — volunteering that detail is exactly what interviewers are listening for.",
    lesson: "lag-lead-running-totals",
  },
  {
    question: "Find customers who have never placed an order.",
    difficulty: "Easy",
    topic: "Joins",
    testing: "Whether you know the anti-join — and the NOT IN trap.",
    answer: `-- NOT EXISTS: safest
SELECT c.name
FROM customers c
WHERE NOT EXISTS (
  SELECT 1 FROM orders o WHERE o.customer_id = c.id
);

-- LEFT JOIN + IS NULL: equally valid
SELECT c.name
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
WHERE o.id IS NULL;

-- NOT IN: breaks if customer_id can be NULL
SELECT name FROM customers
WHERE id NOT IN (SELECT customer_id FROM orders);`,
    explanation:
      "Mentioning that `NOT IN` returns *zero rows* if the subquery yields a single NULL is often the whole point of the question. Default to `NOT EXISTS`.",
    lesson: "correlated-subqueries",
  },
  {
    question: "What's the difference between WHERE and HAVING?",
    difficulty: "Easy",
    topic: "Fundamentals",
    testing: "Understanding of evaluation order.",
    answer: `SELECT class, count(*) AS members
FROM heroes
WHERE level > 30      -- filters ROWS, before grouping
GROUP BY class
HAVING count(*) > 2;  -- filters GROUPS, after aggregation`,
    explanation:
      "`WHERE` runs before `GROUP BY`, so it can't see aggregates. `HAVING` runs after. Prefer `WHERE` whenever possible — filtering earlier means fewer rows to group. The full order is FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT.",
    lesson: "having",
  },
  {
    question: "Explain the difference between INNER and LEFT JOIN.",
    difficulty: "Easy",
    topic: "Joins",
    testing: "Whether you can reason about row counts, not recite definitions.",
    answer: `-- 18 heroes, 2 with a NULL guild_id, 5 guilds

SELECT count(*) FROM heroes h
JOIN guilds g ON h.guild_id = g.id;        -- 16

SELECT count(*) FROM heroes h
LEFT JOIN guilds g ON h.guild_id = g.id;   -- 18`,
    explanation:
      "The strong answer predicts the counts and explains why: NULL never equals anything, so an inner join silently drops the two guildless heroes. Mentioning that a `WHERE` clause on the right-hand table would neutralise the LEFT JOIN is a bonus.",
    lesson: "left-join",
  },
  {
    question: "Find gaps in a sequence of dates (gaps and islands).",
    difficulty: "Hard",
    topic: "Window functions",
    testing: "Whether you know the row_number-difference trick.",
    answer: `-- Group consecutive days into 'islands'
WITH numbered AS (
  SELECT activity_date,
         activity_date - (row_number() OVER (ORDER BY activity_date))::int AS grp
  FROM activity
)
SELECT min(activity_date) AS island_start,
       max(activity_date) AS island_end,
       count(*)           AS days
FROM numbered
GROUP BY grp
ORDER BY island_start;`,
    explanation:
      "For consecutive dates, `date − row_number()` is constant; a gap shifts it. Grouping by that difference collapses each run into one row. This is the standard solution to streak calculations — which is exactly how SQLQuest computes yours.",
    lesson: "lag-lead-running-totals",
  },
  {
    question: "Why is this query slow, and how would you fix it?",
    difficulty: "Hard",
    topic: "Performance",
    testing: "Whether you reach for EXPLAIN before guessing.",
    answer: `-- Slow: the function blocks the index on shipped_on
SELECT count(*)
FROM shipments
WHERE extract(year FROM shipped_on) = 2024;

-- Fast: sargable range, uses the index
SELECT count(*)
FROM shipments
WHERE shipped_on >= '2024-01-01'
  AND shipped_on <  '2025-01-01';`,
    explanation:
      "The first step of any honest answer is 'I'd run EXPLAIN ANALYZE'. Then: an index stores raw column values, so wrapping the column in a function forces a sequential scan. Rewriting as a range restores the index — and stays useful for every other date query.",
    lesson: "anti-patterns",
  },
  {
    question: "What does NULL mean, and how does it behave?",
    difficulty: "Medium",
    topic: "Fundamentals",
    testing: "Depth. Everyone knows 'it means missing'; few know the consequences.",
    answer: `NULL = NULL          -- unknown, NOT true
NULL <> 'x'          -- unknown, so WHERE drops the row
5 NOT IN (1, 2, NULL) -- unknown → returns NO rows

count(*)      -- counts rows
count(col)    -- counts non-NULL values
avg(col)      -- divides by non-NULL count

GROUP BY  -- treats all NULLs as ONE group
UNIQUE    -- treats all NULLs as DISTINCT (many allowed)`,
    explanation:
      "SQL uses three-valued logic and `WHERE` keeps only definitively-true rows. The best answers name a concrete bug they've hit — a report that silently under-counted because a filter excluded NULLs.",
    lesson: "working-with-null",
  },
  {
    question: "Design an index for `WHERE status = ? AND created_at > ?`.",
    difficulty: "Hard",
    topic: "Performance",
    testing: "Whether you know composite index column order matters.",
    answer: `CREATE INDEX idx_orders_status_created
ON orders (status, created_at);

-- If you only ever query one status, go partial:
CREATE INDEX idx_orders_pending
ON orders (created_at)
WHERE status = 'pending';`,
    explanation:
      "Equality column first, range column last. Reversed, the index is sorted by `created_at` and the matching statuses are scattered through it. The partial-index follow-up shows you're thinking about index size and write cost, not just read speed.",
    lesson: "indexes",
  },
];

const DIFFICULTY_VARIANT = {
  Easy: "success",
  Medium: "warning",
  Hard: "danger",
} as const;

export default function InterviewQuestionsPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "SQL interview questions", path: "/sql-interview-questions" },
          ]),
          faqSchema(
            QUESTIONS.map((q) => ({
              question: q.question,
              answer: `${q.explanation} Example: ${q.answer.split("\n").slice(0, 6).join(" ")}`,
            })),
          ),
        ]}
      />

      <div className="mx-auto w-full max-w-4xl px-4 py-14 sm:px-6 lg:py-20">
        <PageHeader
          eyebrow="Preparation"
          title="SQL interview questions"
          description="The questions that actually come up, with worked answers — and, more usefully, what the interviewer is really listening for in each one."
        />

        <div className="mb-10 rounded-2xl border border-border-base bg-bg-subtle p-5">
          <h2 className="font-extrabold">How to use this</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">
            Try each question in the{" "}
            <Link href="/playground" className="font-bold text-brand-500 hover:underline">
              playground
            </Link>{" "}
            before reading the answer. Almost every interviewer cares more about
            how you reason out loud than about perfect syntax — say what one row
            of your result represents, name the edge case, then write the query.
          </p>
        </div>

        <ol className="space-y-8">
          {QUESTIONS.map((q, i) => (
            <li key={q.question}>
              <Card className="overflow-hidden">
                <div className="border-b border-border-base p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="neutral" size="sm">
                      #{i + 1}
                    </Badge>
                    <Badge variant={DIFFICULTY_VARIANT[q.difficulty]} size="sm">
                      {q.difficulty}
                    </Badge>
                    <Badge variant="outline" size="sm">
                      {q.topic}
                    </Badge>
                  </div>

                  <h2 className="mt-2.5 text-xl font-extrabold">{q.question}</h2>
                  <p className="mt-1.5 text-sm text-fg-muted">
                    <strong className="font-extrabold text-fg">
                      What they&rsquo;re testing:
                    </strong>{" "}
                    {q.testing}
                  </p>
                </div>

                <div className="p-5">
                  <CodeBlock code={q.answer} />
                  <p className="mt-4 text-sm leading-relaxed text-fg-muted">
                    <InlineMarkdown>{q.explanation}</InlineMarkdown>
                  </p>

                  {q.lesson && (
                    <Link
                      href={`/learn/${q.lesson}`}
                      className="mt-3 inline-block text-sm font-extrabold text-brand-500 hover:underline"
                    >
                      Practise this →
                    </Link>
                  )}
                </div>
              </Card>
            </li>
          ))}
        </ol>

        <div className="mt-14 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-8 text-center text-white">
          <h2 className="text-2xl font-extrabold">
            Reading answers won&rsquo;t get you the job
          </h2>
          <p className="mx-auto mt-2 max-w-xl opacity-90">
            The Advanced track&rsquo;s checkpoint is built from exactly these
            problems — with a real database, real feedback, and no answer key
            to peek at.
          </p>
          <Button size="lg" variant="accent" className="mt-6" asChild>
            <Link href="/courses/advanced">
              Open the Advanced track
              <ArrowRight />
            </Link>
          </Button>
        </div>
      </div>
    </>
  );
}
