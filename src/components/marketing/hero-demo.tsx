"use client";

import * as React from "react";
import { Check, Loader2, Play } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { usePrefersReducedMotion } from "@/hooks/use-client";

/**
 * Hero "editor" — cycles through four queries that show the range of the course.
 *
 * Deliberately *not* the real engine: the homepage must stay fast and fully
 * server-rendered, and booting 16 MB of WebAssembly to show a five-row table
 * would be a poor trade. The real thing is one click away in the playground.
 *
 * Every result below was produced by running that exact query against that
 * exact dataset and pasted back verbatim. A demo showing numbers the product
 * wouldn't actually return is a lie — if you edit a query here, re-run it and
 * update the rows.
 */

interface Demo {
  /** Shown in the window title bar. */
  dataset: string;
  /** Shown on the chip — what this query demonstrates. */
  label: string;
  sql: string;
  columns: string[];
  rows: string[][];
  /** Real measured duration, rounded. */
  ms: string;
}

const DEMOS: Demo[] = [
  {
    dataset: "guild_hall",
    label: "Joins & grouping",
    sql: `SELECT g.name AS guild,
       count(h.id) AS members,
       round(avg(h.level), 1) AS avg_level
FROM guilds g
LEFT JOIN heroes h ON h.guild_id = g.id
GROUP BY g.name
ORDER BY members DESC, guild;`,
    columns: ["guild", "members", "avg_level"],
    rows: [
      ["Emberhand", "4", "49.3"],
      ["Duskrunners", "3", "38.7"],
      ["Stone Vigil", "3", "37.7"],
      ["The Green Pact", "3", "35.7"],
      ["The Silver Compass", "3", "44.3"],
    ],
    ms: "3.1",
  },
  {
    dataset: "night_market",
    label: "Window functions",
    sql: `SELECT name,
       price,
       rank() OVER (ORDER BY price DESC) AS price_rank
FROM products
ORDER BY price_rank
LIMIT 5;`,
    columns: ["name", "price", "price_rank"],
    rows: [
      ["Stormharp", "480.00", "1"],
      ["Hollow Kingdom Map", "340.00", "2"],
      ["Chart of the Deep", "210.00", "3"],
      ["Silence Sigil", "199.00", "4"],
      ["Wandering Fiddle", "155.00", "5"],
    ],
    ms: "2.4",
  },
  {
    dataset: "org_chart",
    label: "Recursive CTEs",
    sql: `WITH RECURSIVE chain AS (
  SELECT id, name, 1 AS depth
  FROM employees WHERE manager_id IS NULL
  UNION ALL
  SELECT e.id, e.name, c.depth + 1
  FROM employees e JOIN chain c ON e.manager_id = c.id
)
SELECT name, depth FROM chain
ORDER BY depth, name LIMIT 5;`,
    columns: ["name", "depth"],
    rows: [
      ["Imogen Vale", "1"],
      ["Grace Bellamy", "2"],
      ["Nour Haddad", "2"],
      ["Rafael Ortiz", "2"],
      ["Rosa Vidal", "2"],
    ],
    ms: "2.9",
  },
  {
    dataset: "warehouse",
    label: "50,000 rows",
    sql: `SELECT carrier,
       count(*) AS shipments,
       round(avg(weight_kg), 1) AS avg_kg
FROM shipments
GROUP BY carrier
ORDER BY shipments DESC;`,
    columns: ["carrier", "shipments", "avg_kg"],
    rows: [
      ["Cinder Express", "12500", "25.0"],
      ["Aurora Freight", "12500", "24.9"],
      ["Dawnline", "12500", "25.0"],
      ["Beacon Post", "12500", "25.0"],
    ],
    ms: "14.4",
  },
];

const TYPE_SPEED_MS = 18;
const RUN_MS = 550;
const HOLD_MS = 3800;

type Phase = "typing" | "running" | "done";

export function HeroDemo() {
  const prefersReduced = usePrefersReducedMotion();

  const [index, setIndex] = React.useState(0);
  const [typedLength, setTypedLength] = React.useState(0);
  const [phase, setPhase] = React.useState<Phase>("typing");
  const [paused, setPaused] = React.useState(false);

  const demo = DEMOS[index];

  /* Reset the typewriter when the demo changes. Adjusted during render —
     React's documented alternative to an effect — so the previous query's
     text never paints for a frame beneath the new heading. */
  const [renderedIndex, setRenderedIndex] = React.useState(index);
  if (renderedIndex !== index) {
    setRenderedIndex(index);
    setTypedLength(0);
    setPhase("typing");
  }

  /* -- type it out -------------------------------------------------------- */
  React.useEffect(() => {
    if (prefersReduced || paused || phase !== "typing") return;
    const id = setInterval(() => {
      setTypedLength((n) => (n >= demo.sql.length ? n : n + 1));
    }, TYPE_SPEED_MS);
    return () => clearInterval(id);
  }, [prefersReduced, paused, phase, demo.sql.length]);

  /* -- typing → running → done -------------------------------------------- */
  React.useEffect(() => {
    if (prefersReduced || phase !== "typing" || typedLength < demo.sql.length) return;
    const id = setTimeout(() => setPhase("running"), 120);
    return () => clearTimeout(id);
  }, [prefersReduced, phase, typedLength, demo.sql.length]);

  React.useEffect(() => {
    if (phase !== "running") return;
    const id = setTimeout(() => setPhase("done"), RUN_MS);
    return () => clearTimeout(id);
  }, [phase]);

  /* -- advance to the next demo ------------------------------------------- */
  React.useEffect(() => {
    if (prefersReduced || paused || phase !== "done") return;
    const id = setTimeout(() => setIndex((i) => (i + 1) % DEMOS.length), HOLD_MS);
    return () => clearTimeout(id);
  }, [prefersReduced, paused, phase]);

  // With reduced motion nothing animates: the query is shown complete and the
  // reader switches demos with the chips instead.
  const typed = prefersReduced ? demo.sql : demo.sql.slice(0, typedLength);
  const settled = prefersReduced || phase === "done";

  return (
    <div
      className="overflow-hidden rounded-2xl border border-border-base bg-bg-elevated shadow-2xl shadow-brand-950/10"
      // Pausing on hover/focus means nobody loses a query mid-read.
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {/* Window chrome */}
      <div className="flex items-center gap-2 border-b border-border-base bg-bg-subtle px-4 py-2.5">
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="size-3 rounded-full bg-danger/70" />
          <span className="size-3 rounded-full bg-warning/70" />
          <span className="size-3 rounded-full bg-success/70" />
        </span>
        <span className="ml-2 truncate font-mono text-xs font-semibold text-fg-subtle">
          {demo.dataset} — postgres (wasm)
        </span>
        <Badge variant="success" size="sm" className="ml-auto shrink-0">
          Local
        </Badge>
      </div>

      {/* Editor. Fixed height so cycling never jolts the page. */}
      <pre
        className="h-48 overflow-hidden bg-code-bg px-4 py-4 font-mono text-sm leading-relaxed"
        aria-label={`Example SQL query: ${demo.label}`}
      >
        <code>
          {typed}
          {!settled && (
            <span className="ml-0.5 inline-block h-4 w-[2px] animate-pulse bg-brand-500 align-middle" />
          )}
        </code>
      </pre>

      {/* Run bar */}
      <div className="flex items-center gap-2 border-y border-border-base px-4 py-2.5">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-extrabold transition-colors",
            settled
              ? "bg-success/15 text-success"
              : "bg-brand-500/15 text-brand-600 dark:text-brand-300",
          )}
          role="status"
          aria-live="polite"
        >
          {phase === "running" && !prefersReduced ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              Running
            </>
          ) : settled ? (
            <>
              <Check className="size-3.5" strokeWidth={3} />
              {demo.rows.length} rows · {demo.ms} ms
            </>
          ) : (
            <>
              <Play className="size-3.5" />
              Ready
            </>
          )}
        </span>
        <span className="ml-auto hidden font-mono text-xs text-fg-subtle sm:inline">
          ⌘↵ to run
        </span>
      </div>

      {/* Result. Min-height reserved so the panel never collapses mid-cycle. */}
      <div
        className={cn(
          "min-h-58 transition-opacity duration-500",
          settled ? "opacity-100" : "opacity-0",
        )}
      >
        <table className="w-full text-sm">
          <caption className="sr-only">
            Example result: {demo.label}, {demo.rows.length} rows
          </caption>
          <thead>
            <tr className="border-b border-border-base bg-bg-subtle">
              {demo.columns.map((column, i) => (
                <th
                  key={column}
                  scope="col"
                  className={cn(
                    "px-4 py-2 text-xs font-extrabold whitespace-nowrap",
                    i === 0 ? "text-left" : "text-right",
                  )}
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {demo.rows.map((row, ri) => (
              <tr
                key={`${index}-${ri}`}
                className={cn(
                  "border-b border-border-base last:border-b-0",
                  ri % 2 === 1 && "bg-bg-subtle/45",
                )}
              >
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    className={cn(
                      "px-4 py-2 whitespace-nowrap",
                      ci === 0 ? "font-semibold" : "text-right tabular-nums",
                    )}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Switcher. Doubles as a progress indicator, and is the only way to
          reach the other examples if you've asked for reduced motion. */}
      <div className="flex flex-wrap items-center gap-1.5 border-t border-border-base bg-bg-subtle px-3 py-2.5">
        {DEMOS.map((d, i) => (
          <button
            key={d.label}
            type="button"
            onClick={() => setIndex(i)}
            aria-current={i === index ? "true" : undefined}
            className={cn(
              "rounded-lg px-2.5 py-1 text-xs font-bold transition-colors",
              "outline-none focus-visible:ring-2 focus-visible:ring-ring",
              i === index
                ? "bg-brand-500/15 text-brand-600 dark:text-brand-300"
                : "text-fg-subtle hover:bg-bg-inset hover:text-fg",
            )}
          >
            {d.label}
          </button>
        ))}
      </div>
    </div>
  );
}
