import type { Capstone } from "./capstone-types";

/**
 * Capstone projects.
 *
 * Three realistic briefs on the existing datasets. Each milestone is graded by
 * the same engine as a lesson challenge — execute the submission and the
 * reference solution against identical state, compare result sets — so any
 * correct approach passes and `npm run verify:content` covers them too.
 *
 * Milestones are written as stakeholder requests rather than instructions.
 * "Finance needs monthly revenue with month-on-month growth" makes the learner
 * choose `LAG`; "use LAG to compute growth" does not.
 */

/* ========================================================== 1. revenue ==== */

const revenueReview: Capstone = {
  id: "cap-revenue",
  slug: "quarterly-revenue-review",
  title: "The Quarterly Revenue Review",
  subtitle: "Build the revenue pack the CFO actually asks for",
  scenario:
    "You've just joined Night Market as their first analyst. The CFO sends one message: “Board meeting Thursday. I need our revenue story — what we made, whether it's growing, and what's driving it.” Nobody has built this before. There is no dashboard. There is a database.",
  language: "sql",
  datasetId: "market",
  difficulty: "medium",
  estimatedMinutes: 40,
  glyph: "📈",
  accent: "from-amber-400 to-orange-500",
  requiresTracks: ["foundations", "joins", "aggregation"],
  deliverables: [
    "A per-order revenue table the rest of the business can build on",
    "Monthly revenue with month-on-month growth",
    "The top products by revenue and by margin",
    "Revenue split by customer tier",
    "A single headline number for slide one",
  ],
  brief: [
    {
      type: "p",
      text: "Revenue lives in `order_items` — one row per line item, with `quantity` and `unit_price`. Nothing stores an order total, so **every number in this project starts by computing one**.",
    },
    {
      type: "callout",
      tone: "warning",
      title: "Only delivered orders count",
      text: "`orders.status` includes `cancelled` and `pending`. Counting those as revenue is the single most common way this report gets built wrong — and the fastest way to lose the CFO's trust.",
    },
    {
      type: "p",
      text: "Work milestone by milestone. Each one is a piece of the final pack, and later steps build on the shape of earlier ones.",
    },
  ],
  briefing: [
    {
      title: "Revenue is quantity × price, summed",
      body: "There's no `total` column anywhere. You compute it from the line items and aggregate to whatever grain the question asks for.",
      sql: "sum(oi.quantity * oi.unit_price)",
    },
    {
      title: "Bucketing dates",
      body: "`date_trunc('month', ts)` snaps a timestamp to the first instant of its month — the standard way to group a time series without string juggling.",
      sql: "date_trunc('month', o.placed_at) AS month",
    },
    {
      title: "Comparing a row to the one before it",
      body: "A window function reads a neighbouring row without a self-join. Guard the division — the first month has nothing to compare against.",
      sql: "lag(revenue) OVER (ORDER BY month)",
    },
    {
      title: "Watch the join grain",
      body: "Joining `orders` to `order_items` repeats each order once per line. Anything you count from the order side needs `DISTINCT`.",
      sql: "count(DISTINCT o.id)",
    },
  ],
  milestones: [
    {
      id: "cap-rev-1",
      title: "Order totals",
      brief:
        "Everything downstream needs one number per order. Start there — this is the building block for the rest of the pack.",
      task: "Return `order_id` and `order_total` (quantity × unit price, summed) for every order in the system. Highest value first, then order_id.",
      solution:
        "SELECT order_id, sum(quantity * unit_price) AS order_total FROM order_items GROUP BY order_id ORDER BY order_total DESC, order_id;",
      grading: { checkColumnNames: true },
      hints: [
        "One row per order means grouping by `order_id`.",
        "The value of a line is `quantity * unit_price`.",
      ],
      debrief:
        "This is the grain everything else is built on. In a real warehouse you'd persist this as a view or a model — which is exactly what the Views lesson covers.",
      deliverable: { label: "Order totals", kind: "table" },
    },
    {
      id: "cap-rev-2",
      title: "Monthly revenue",
      brief:
        "“What did we make each month?” — the first chart on the slide. Delivered orders only.",
      task: "Return `month` (truncated to the month) and `revenue` for delivered orders. Oldest month first.",
      solution:
        "SELECT date_trunc('month', o.placed_at) AS month, sum(oi.quantity * oi.unit_price) AS revenue FROM orders o JOIN order_items oi ON oi.order_id = o.id WHERE o.status = 'delivered' GROUP BY 1 ORDER BY 1;",
      grading: { checkColumnNames: true },
      hints: [
        "Filter to `status = 'delivered'` before aggregating.",
        "`date_trunc('month', o.placed_at)` gives the bucket.",
      ],
      debrief:
        "Note the filter sits in `WHERE`, before grouping — cancelled orders never enter the sum at all.",
      deliverable: { label: "Monthly revenue", kind: "table" },
    },
    {
      id: "cap-rev-3",
      title: "Growth",
      brief:
        "The CFO's actual question isn't “how much” — it's “are we growing”. Add the month-on-month change.",
      task: "Return `month`, `revenue` and `mom_change` — the difference from the previous month, NULL for the first. Oldest first.",
      solution:
        "WITH monthly AS (SELECT date_trunc('month', o.placed_at) AS month, sum(oi.quantity * oi.unit_price) AS revenue FROM orders o JOIN order_items oi ON oi.order_id = o.id WHERE o.status = 'delivered' GROUP BY 1) SELECT month, revenue, revenue - lag(revenue) OVER (ORDER BY month) AS mom_change FROM monthly ORDER BY month;",
      grading: { checkColumnNames: true },
      hints: [
        "Aggregate first in a CTE, then compare rows.",
        "`lag(revenue) OVER (ORDER BY month)` is the previous month.",
      ],
      debrief:
        "The first row returning NULL is correct, not a bug — there is no prior month. Fabricating a 0% there would be a lie in a board pack.",
      deliverable: { label: "Growth", kind: "table" },
    },
    {
      id: "cap-rev-4",
      title: "What's driving it",
      brief:
        "“Which products are actually making us money?” Revenue isn't the whole story — a high-revenue product with thin margin matters less than the number suggests.",
      task: "Return product `name`, `revenue`, and `margin` ((unit_price − cost) × quantity, summed) across all order items. Highest revenue first, then name.",
      solution:
        "SELECT p.name, sum(oi.quantity * oi.unit_price) AS revenue, sum((oi.unit_price - p.cost) * oi.quantity) AS margin FROM products p JOIN order_items oi ON oi.product_id = p.id GROUP BY p.name ORDER BY revenue DESC, p.name;",
      grading: { checkColumnNames: true },
      hints: ["`products.cost` is what we paid; `unit_price` is what they paid."],
      debrief:
        "Look at the gap between the revenue and margin orderings — that difference is usually the most interesting slide in the pack.",
      deliverable: { label: "Product performance", kind: "table" },
    },
    {
      id: "cap-rev-5",
      title: "Who's buying",
      brief:
        "Sales want to know whether the tier programme is worth running. Break the revenue down by customer tier.",
      task: "Return `tier`, `customers` (how many distinct customers in that tier actually bought), and `revenue` from delivered orders. Highest revenue first.",
      solution:
        "SELECT c.tier, count(DISTINCT c.id) AS customers, sum(oi.quantity * oi.unit_price) AS revenue FROM customers c JOIN orders o ON o.customer_id = c.id JOIN order_items oi ON oi.order_id = o.id WHERE o.status = 'delivered' GROUP BY c.tier ORDER BY revenue DESC;",
      grading: { checkColumnNames: true },
      hints: [
        "The join to `order_items` repeats each customer once per line item.",
        "`count(DISTINCT c.id)` is the only honest customer count here.",
      ],
      debrief:
        "This is the fan-out trap in a real report. `count(c.id)` would have inflated every tier by its average basket size — and nobody would have noticed.",
      deliverable: { label: "Revenue by tier", kind: "table" },
    },
    {
      id: "cap-rev-6",
      title: "Slide one",
      brief:
        "Everything above is detail. The board sees one number first. Make it the right one.",
      task: "Return a single row with `total_revenue` — all delivered-order revenue across the whole period.",
      solution:
        "SELECT sum(oi.quantity * oi.unit_price) AS total_revenue FROM orders o JOIN order_items oi ON oi.order_id = o.id WHERE o.status = 'delivered';",
      grading: { checkColumnNames: true },
      debrief:
        "You built this from six queries that agree with each other, which is why you can defend it. That's the actual deliverable — not the number, the fact that it's reproducible.",
      deliverable: { label: "Total revenue", kind: "metric" },
    },
  ],
  keywords: [
    "SQL revenue report",
    "SQL analytics project",
    "month over month SQL",
    "SQL portfolio project",
  ],
};

/* ======================================================= 2. activation ==== */

const activationAudit: Capstone = {
  id: "cap-activation",
  slug: "activation-and-engagement-audit",
  title: "Activation & Engagement Audit",
  subtitle: "Work out whether new signups actually stick",
  scenario:
    "Growth is spending on acquisition and the product lead is uneasy: “We're adding users. I don't know if they're doing anything.” You have an event stream — sessions and named events — and one week to answer it properly.",
  language: "sql",
  datasetId: "telemetry",
  difficulty: "hard",
  estimatedMinutes: 45,
  glyph: "🔬",
  accent: "from-sky-400 to-indigo-500",
  requiresTracks: ["foundations", "joins", "aggregation", "advanced"],
  deliverables: [
    "Session counts and total time per user",
    "A defensible activation definition, and who meets it",
    "Time from signup to first real usage",
    "Engagement compared across plans",
    "A funnel from first open to upgrade intent",
  ],
  brief: [
    {
      type: "p",
      text: "`events` are named and timestamped, and belong to a `session`, which belongs to an `app_user`. The names that matter: `app_open`, `query_run`, `lesson_done`, `upgrade_view`, `upgrade_done`.",
    },
    {
      type: "callout",
      tone: "info",
      title: "Define activation before you measure it",
      text: "“Activated” isn't in the data — it's a decision you make and then have to defend. Here we'll use *ran a query **and** completed a lesson*, because either one alone is easy to do by accident.",
    },
    {
      type: "p",
      text: "Some users have sessions but almost no events. Those are the interesting ones, and the easiest to accidentally drop with an inner join.",
    },
  ],
  briefing: [
    {
      title: "Counting a subset in one pass",
      body: "`FILTER` lets each aggregate carry its own condition, so you can count several different things without several queries.",
      sql: "count(*) FILTER (WHERE e.name = 'query_run')",
    },
    {
      title: "Keeping users who did nothing",
      body: "An inner join silently deletes the users you're most worried about. Preserve them and count a child column.",
      sql: "LEFT JOIN sessions s ON s.user_id = u.id",
    },
    {
      title: "Existence, not counting",
      body: "When the question is “did this ever happen”, `EXISTS` stops at the first match and is NULL-safe.",
      sql: "WHERE EXISTS (SELECT 1 FROM events e WHERE ...)",
    },
    {
      title: "The first event per user",
      body: "Number the rows inside each user, ordered by time, then keep number one.",
      sql: "row_number() OVER (PARTITION BY user_id ORDER BY occurred_at)",
    },
  ],
  milestones: [
    {
      id: "cap-act-1",
      title: "Usage baseline",
      brief:
        "Before any judgement, the raw shape: how much is each user actually using the product?",
      task: "Return `handle`, `sessions` (how many) and `total_seconds` for every user — including anyone with no sessions at all, who should show 0. Most sessions first, then handle.",
      solution:
        "SELECT u.handle, count(s.id) AS sessions, COALESCE(sum(s.duration_s), 0) AS total_seconds FROM app_users u LEFT JOIN sessions s ON s.user_id = u.id GROUP BY u.handle ORDER BY sessions DESC, u.handle;",
      grading: { checkColumnNames: true },
      hints: [
        "A LEFT JOIN keeps users with nothing.",
        "`count(s.id)` counts matches; `count(*)` would count the empty row as 1.",
        "`sum` of no rows is NULL — wrap it in `COALESCE`.",
      ],
      debrief:
        "Two habits in one query: LEFT JOIN plus `count(child_id)` for honest zeros, and `COALESCE` so a missing sum reads as 0 rather than blank.",
      deliverable: { label: "Usage by user", kind: "table" },
    },
    {
      id: "cap-act-2",
      title: "Who activated",
      brief:
        "Apply the definition: a user is activated once they've both run a query and completed a lesson.",
      task: "Return the `handle` of every activated user, alphabetically.",
      solution:
        "SELECT u.handle FROM app_users u WHERE EXISTS (SELECT 1 FROM sessions s JOIN events e ON e.session_id = s.id WHERE s.user_id = u.id AND e.name = 'query_run') AND EXISTS (SELECT 1 FROM sessions s JOIN events e ON e.session_id = s.id WHERE s.user_id = u.id AND e.name = 'lesson_done') ORDER BY u.handle;",
      hints: [
        "Two independent conditions — both must hold.",
        "`EXISTS` twice is clearer here than joining and counting.",
      ],
      debrief:
        "Two `EXISTS` clauses read exactly like the definition you'd say out loud, which is what makes the metric defensible in a review.",
      deliverable: { label: "Activated users", kind: "table" },
    },
    {
      id: "cap-act-3",
      title: "Activation rate",
      brief: "Growth wants one number they can track weekly.",
      task: "Return `activated` and `total_users` in a single row.",
      solution:
        "SELECT count(*) FILTER (WHERE EXISTS (SELECT 1 FROM sessions s JOIN events e ON e.session_id = s.id WHERE s.user_id = u.id AND e.name = 'query_run') AND EXISTS (SELECT 1 FROM sessions s JOIN events e ON e.session_id = s.id WHERE s.user_id = u.id AND e.name = 'lesson_done')) AS activated, count(*) AS total_users FROM app_users u;",
      grading: { checkColumnNames: true },
      hints: ["`FILTER` can wrap the whole activation condition from the last step."],
      debrief:
        "One scan, two numbers. The alternative — two queries and a calculator — is how reported metrics drift apart between decks.",
      deliverable: { label: "Activation", kind: "table" },
    },
    {
      id: "cap-act-4",
      title: "Time to first value",
      brief:
        "“How long before a new user does something real?” Use their first `query_run`.",
      task: "Return `handle` and `first_query_at` — the timestamp of each user's earliest `query_run` event. Users who never ran one are excluded. Earliest first.",
      solution:
        "SELECT u.handle, min(e.occurred_at) AS first_query_at FROM app_users u JOIN sessions s ON s.user_id = u.id JOIN events e ON e.session_id = s.id WHERE e.name = 'query_run' GROUP BY u.handle ORDER BY first_query_at;",
      grading: { checkColumnNames: true },
      hints: ["`min()` over a timestamp gives the earliest."],
      debrief:
        "`min()` is the simplest answer here. `row_number()` would also work and matters once you need the whole first *row*, not just one column of it.",
      deliverable: { label: "Time to first value", kind: "table" },
    },
    {
      id: "cap-act-5",
      title: "Does the plan matter?",
      brief:
        "Finance thinks paid users engage more. Check whether the data agrees before anyone repeats it.",
      task: "Return `plan`, `users`, and `avg_session_seconds` (rounded to 1 decimal) per plan, counting only users who have sessions. Longest average first.",
      solution:
        "SELECT u.plan, count(DISTINCT u.id) AS users, ROUND(avg(s.duration_s), 1) AS avg_session_seconds FROM app_users u JOIN sessions s ON s.user_id = u.id GROUP BY u.plan ORDER BY avg_session_seconds DESC;",
      grading: { checkColumnNames: true },
      hints: ["The join fans users out per session — count them `DISTINCT`."],
      debrief:
        "With eight users this is directional at best. Saying so out loud is part of the job; a confident chart drawn from four data points is worse than no chart.",
      deliverable: { label: "Engagement by plan", kind: "table" },
    },
    {
      id: "cap-act-6",
      title: "The funnel",
      brief:
        "Last piece: where do people fall out? Count the distinct users reaching each stage.",
      task: "Return `stage` and `users` for the four stages `app_open`, `query_run`, `lesson_done`, `upgrade_view`, ordered by users descending.",
      solution:
        "SELECT e.name AS stage, count(DISTINCT s.user_id) AS users FROM events e JOIN sessions s ON s.id = e.session_id WHERE e.name IN ('app_open', 'query_run', 'lesson_done', 'upgrade_view') GROUP BY e.name ORDER BY users DESC;",
      grading: { checkColumnNames: true },
      hints: [
        "One row per stage means grouping by the event name.",
        "A user can fire the same event many times — count them once.",
      ],
      debrief:
        "`count(DISTINCT user_id)` is what makes this a funnel rather than an event tally. Counting rows would show more `query_run`s than `app_open`s, which is nonsense.",
      deliverable: { label: "Funnel", kind: "table" },
    },
  ],
  keywords: [
    "SQL funnel analysis",
    "activation metrics SQL",
    "product analytics SQL project",
    "cohort analysis SQL",
  ],
};

/* ====================================================== 3. performance ==== */

const performanceAudit: Capstone = {
  id: "cap-performance",
  slug: "warehouse-performance-audit",
  title: "Warehouse Performance Audit",
  subtitle: "A dashboard is timing out. Find out why, and fix it.",
  scenario:
    "The ops shipment dashboard used to load instantly. It now times out, and the table has grown to 50,000 rows. Nobody has changed the code. You've been asked to work out what happened and make it fast again — without breaking the numbers.",
  language: "sql",
  datasetId: "warehouse",
  difficulty: "expert",
  estimatedMinutes: 50,
  glyph: "⚡",
  accent: "from-yellow-400 to-amber-500",
  requiresTracks: ["foundations", "joins", "aggregation", "performance"],
  deliverables: [
    "A baseline of what the dashboard reports",
    "A rewritten date filter the index can actually use",
    "Carrier delivery times against the SLA",
    "Loss hot-spots by region",
    "The index the dashboard's main query needs",
    "Pagination that stays fast on page 500",
  ],
  brief: [
    {
      type: "p",
      text: "`shipments` has 50,000 rows — large enough that query shape genuinely changes the runtime, which is the whole point of this project.",
    },
    {
      type: "callout",
      tone: "warning",
      title: "Measure, then change one thing",
      text: "Run `EXPLAIN ANALYZE` before and after every change. Changing three things at once and seeing an improvement teaches you nothing about which of them mattered.",
    },
    {
      type: "p",
      text: "Correctness first. A fast query that returns different numbers than the slow one hasn't been optimised — it's been broken.",
    },
  ],
  briefing: [
    {
      title: "Sargable predicates",
      body: "An index stores raw column values. Wrap the column in a function and the planner can't use it — rewrite as a range instead.",
      sql: "-- blocks the index\nWHERE extract(year FROM shipped_on) = 2024\n-- uses it\nWHERE shipped_on >= '2024-01-01' AND shipped_on < '2025-01-01'",
    },
    {
      title: "Composite index column order",
      body: "Equality columns first, the range column last. An index on (a, b) can't serve a filter on b alone.",
      sql: "CREATE INDEX idx ON t (status, shipped_on);",
    },
    {
      title: "Deep pagination is linear",
      body: "OFFSET makes the database produce and discard every skipped row. Seeking from the last key you saw is constant time.",
      sql: "WHERE id > :last_seen ORDER BY id LIMIT 20",
    },
  ],
  milestones: [
    {
      id: "cap-perf-1",
      title: "Baseline",
      brief:
        "Before touching anything, capture what the dashboard currently reports. This is your regression test.",
      task: "Return `carrier` and `shipments` (how many) for every carrier. Most shipments first, then carrier.",
      solution:
        "SELECT carrier, count(*) AS shipments FROM shipments GROUP BY carrier ORDER BY shipments DESC, carrier;",
      grading: { checkColumnNames: true },
      debrief:
        "Every later change has to keep reproducing these numbers. Optimisation without a baseline is just hoping.",
      deliverable: { label: "Baseline", kind: "table" },
    },
    {
      id: "cap-perf-2",
      title: "The slow filter",
      brief:
        "The dashboard filters the year with a function on the column. That's what stopped it using the index. Rewrite it so the planner can seek.",
      task: "Return `shipments_2024` — the count of shipments shipped during 2024 — using a filter an index could serve. Do not call a function on `shipped_on`.",
      solution:
        "SELECT count(*) AS shipments_2024 FROM shipments WHERE shipped_on >= '2024-01-01' AND shipped_on < '2025-01-01';",
      grading: {
        checkColumnNames: true,
        mustNotUse: [
          { pattern: "extract\\s*\\(|date_trunc\\s*\\(|to_char\\s*\\(", label: "a function on the indexed column" },
        ],
      },
      hints: [
        "A year is a half-open range: from 1 January up to — but not including — the next 1 January.",
        "`>= '2024-01-01' AND < '2025-01-01'` covers it exactly, leap year or not.",
      ],
      debrief:
        "Half-open ranges are the safe idiom. `BETWEEN '2024-01-01' AND '2024-12-31'` silently drops anything timestamped after midnight on the last day.",
      deliverable: { label: "2024 volume", kind: "metric" },
    },
    {
      id: "cap-perf-3",
      title: "Delivery SLA",
      brief:
        "Ops promise five days. Find out which carriers actually hit it, counting only shipments that were delivered.",
      task: "Return `carrier`, `deliveries`, and `avg_days` (rounded to 2 decimals) between `shipped_on` and `delivered_on`. Fastest first.",
      solution:
        "SELECT carrier, count(*) AS deliveries, ROUND(avg(delivered_on - shipped_on), 2) AS avg_days FROM shipments WHERE delivered_on IS NOT NULL GROUP BY carrier ORDER BY avg_days, carrier;",
      grading: { checkColumnNames: true },
      hints: [
        "Subtracting two `date` values in Postgres gives an integer number of days.",
        "Undelivered shipments have a NULL `delivered_on`.",
      ],
      debrief:
        "The `IS NOT NULL` filter is doing real work: without it `avg` would still skip the NULLs, but `count(*)` would include shipments that never arrived, and the two numbers would disagree.",
      deliverable: { label: "Delivery SLA", kind: "table" },
    },
    {
      id: "cap-perf-4",
      title: "Where we lose things",
      brief:
        "Finance want the loss rate by region — and they want the rate, not the raw count, because the regions aren't the same size.",
      task: "Return `region`, `total`, `lost`, and `lost_pct` (lost as a percentage of total, rounded to 2 decimals). Worst rate first.",
      solution:
        "SELECT w.region, count(*) AS total, count(*) FILTER (WHERE s.status = 'lost') AS lost, ROUND(100.0 * count(*) FILTER (WHERE s.status = 'lost') / count(*), 2) AS lost_pct FROM shipments s JOIN warehouses w ON w.id = s.warehouse_id GROUP BY w.region ORDER BY lost_pct DESC, w.region;",
      grading: { checkColumnNames: true },
      hints: [
        "`count(*) FILTER (WHERE ...)` counts a subset in the same pass.",
        "Multiply by `100.0`, not `100` — integer division would floor every rate to 0.",
      ],
      debrief:
        "The `100.0` matters. With `100` the whole expression stays integer, every rate rounds to zero, and the report looks like nothing is ever lost.",
      deliverable: { label: "Loss by region", kind: "table" },
    },
    {
      id: "cap-perf-5",
      title: "The index",
      brief:
        "The dashboard's main query filters one warehouse and a date range. Give it the index it's been missing.",
      task: "Create an index named `idx_shipments_wh_date` supporting `WHERE warehouse_id = ? AND shipped_on >= ?`.",
      solution:
        "CREATE INDEX idx_shipments_wh_date ON shipments (warehouse_id, shipped_on);",
      verifyQuery:
        "SELECT indexname FROM pg_indexes WHERE tablename = 'shipments' ORDER BY indexname;",
      hints: [
        "Equality column first, range column last.",
        "The reverse order would sort by date and scatter the warehouse rows throughout.",
      ],
      debrief:
        "Column order is the whole decision. `(shipped_on, warehouse_id)` would look almost identical in a code review and help far less.",
      deliverable: { label: "Index created", kind: "table" },
    },
    {
      id: "cap-perf-6",
      title: "Pagination that scales",
      brief:
        "Last complaint: the shipment list crawls on later pages. It uses OFFSET. Replace it with something that doesn't degrade.",
      task: "Return `id`, `carrier` and `status` for the 10 shipments after id 40000, ordered by id. No OFFSET.",
      solution:
        "SELECT id, carrier, status FROM shipments WHERE id > 40000 ORDER BY id LIMIT 10;",
      grading: { mustNotUse: [{ pattern: "\\boffset\\b", label: "`OFFSET`" }] },
      hints: ["Seek from the last id the client saw, rather than counting past rows."],
      debrief:
        "This reads 10 index entries regardless of depth. `OFFSET 40000` produced and threw away 40,000 rows to return the same 10 — and got slower with every page.",
      deliverable: { label: "Fast pagination", kind: "table" },
    },
  ],
  keywords: [
    "SQL performance project",
    "query optimization practice",
    "postgres index design",
    "SQL tuning portfolio",
  ],
};

/* ========================================================== registry ====== */

export const capstones: Capstone[] = [
  revenueReview,
  activationAudit,
  performanceAudit,
];

const bySlug = new Map(capstones.map((c) => [c.slug, c]));

export function getCapstone(slug: string): Capstone | undefined {
  return bySlug.get(slug);
}

export const capstoneStats = {
  projects: capstones.length,
  milestones: capstones.reduce((n, c) => n + c.milestones.length, 0),
  minutes: capstones.reduce((n, c) => n + c.estimatedMinutes, 0),
};
