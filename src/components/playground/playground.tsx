"use client";

import * as React from "react";
import {
  BookMarked,
  Database,
  Loader2,
  Play,
  RotateCcw,
  Trash2,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/form-controls";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SqlEditor } from "@/components/sql/sql-editor";
import { ResultGrid } from "@/components/sql/result-grid";
import { SchemaPanel } from "@/components/sql/schema-panel";
import { LottiePlayer } from "@/components/animation/lottie";

import { useSqlEngine } from "@/hooks/use-sql-engine";
import { useIsMounted } from "@/hooks/use-client";
import { datasets, getDataset } from "@/content/datasets";
import { formatSql } from "@/lib/sql/statement";
import { useProgressStore } from "@/stores/progress-store";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Free-form SQL scratchpad.
 *
 * Same WASM Postgres the lessons use, with no grading and no hearts. History
 * and the current buffer persist to localStorage so a refresh never loses
 * work, and everything stays on-device.
 */

const STORAGE_KEY = "sqlquest:playground";
const MAX_HISTORY = 30;

interface PersistedState {
  datasetId: string;
  sql: string;
  history: { sql: string; datasetId: string; at: number }[];
}

const STARTERS: Record<string, string> = {
  realm: "SELECT name, class, level, gold\nFROM heroes\nORDER BY level DESC\nLIMIT 10;",
  guild:
    "SELECT g.name AS guild, count(h.id) AS members\nFROM guilds g\nLEFT JOIN heroes h ON h.guild_id = g.id\nGROUP BY g.name\nORDER BY members DESC;",
  market:
    "SELECT c.name, sum(oi.quantity * oi.unit_price) AS spend\nFROM customers c\nJOIN orders o      ON o.customer_id = c.id\nJOIN order_items oi ON oi.order_id = o.id\nWHERE o.status = 'delivered'\nGROUP BY c.name\nORDER BY spend DESC;",
  telemetry:
    "SELECT user_id,\n       started_at,\n       duration_s,\n       sum(duration_s) OVER (PARTITION BY user_id ORDER BY started_at) AS running_total\nFROM sessions\nORDER BY user_id, started_at;",
  org: "WITH RECURSIVE chain AS (\n  SELECT id, name, 1 AS depth\n  FROM employees WHERE manager_id IS NULL\n  UNION ALL\n  SELECT e.id, e.name, c.depth + 1\n  FROM employees e JOIN chain c ON e.manager_id = c.id\n)\nSELECT * FROM chain ORDER BY depth, name;",
  warehouse:
    "EXPLAIN ANALYZE\nSELECT carrier, count(*) AS shipments\nFROM shipments\nWHERE shipped_on >= DATE '2024-01-01'\nGROUP BY carrier\nORDER BY shipments DESC;",
};

function loadPersisted(): PersistedState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PersistedState) : null;
  } catch {
    return null;
  }
}

/**
 * Gate that defers the editor until after hydration.
 *
 * The saved buffer lives in localStorage, which the server can't see. Rather
 * than render defaults and then overwrite them from an effect — a guaranteed
 * hydration mismatch and a visible flash — we render a skeleton on the server
 * and mount the real editor once, on the client, where the lazy state
 * initialiser can read storage directly.
 */
export function Playground({ initialDataset }: { initialDataset?: string }) {
  const mounted = useIsMounted();
  if (!mounted) return <PlaygroundSkeleton />;
  return <PlaygroundEditor initialDataset={initialDataset} />;
}

function PlaygroundEditor({ initialDataset }: { initialDataset?: string }) {
  const saved = React.useMemo(() => (initialDataset ? null : loadPersisted()), [initialDataset]);

  const [datasetId, setDatasetId] = React.useState(
    () => initialDataset ?? saved?.datasetId ?? datasets[0].id,
  );
  const [sql, setSql] = React.useState(
    () => saved?.sql ?? STARTERS[initialDataset ?? datasets[0].id],
  );
  const [history, setHistory] = React.useState<PersistedState["history"]>(
    () => loadPersisted()?.history ?? [],
  );

  const engine = useSqlEngine(datasetId);
  const dataset = getDataset(datasetId);
  const recordRun = useProgressStore((s) => s.recordPlaygroundRun);

  /* -- persistence ------------------------------------------------------- */

  React.useEffect(() => {
    const id = setTimeout(() => {
      try {
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ datasetId, sql, history } satisfies PersistedState),
        );
      } catch {
        /* Private mode or a full quota — not worth surfacing. */
      }
    }, 400);
    return () => clearTimeout(id);
  }, [datasetId, sql, history]);

  /* -- actions ----------------------------------------------------------- */

  const run = React.useCallback(async () => {
    if (!sql.trim() || engine.status !== "ready") return;
    const result = await engine.run(sql);
    recordRun(datasetId);
    if (result) {
      setHistory((h) =>
        [{ sql: sql.trim(), datasetId, at: Date.now() }, ...h.filter((x) => x.sql !== sql.trim())].slice(
          0,
          MAX_HISTORY,
        ),
      );
      // A DDL/DML statement may have changed the shape of the database.
      if (result.kind !== "select" && result.kind !== "explain") {
        void engine.refreshSchema();
      }
    }
  }, [sql, engine, datasetId, recordRun]);

  const changeDataset = (id: string) => {
    setDatasetId(id);
    setSql(STARTERS[id] ?? "SELECT 1;");
  };

  const insertAtEnd = (text: string) => setSql((s) => `${s}${s.endsWith(" ") ? "" : " "}${text}`);

  const booting = engine.status === "booting" || engine.status === "seeding";

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold sm:text-3xl">SQL Playground</h1>
          <p className="mt-1 max-w-2xl text-sm text-fg-muted">
            A real PostgreSQL engine running in this tab. Break things freely —
            nothing you type is sent anywhere, and{" "}
            <button
              type="button"
              onClick={() => void engine.reset()}
              className="font-bold text-brand-500 hover:underline"
            >
              resetting
            </button>{" "}
            restores the dataset instantly.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={datasetId} onValueChange={changeDataset}>
            <SelectTrigger className="w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {datasets.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="min-w-0 space-y-4">
          <SqlEditor
            value={sql}
            onChange={setSql}
            onSubmit={run}
            schema={engine.schema}
            minHeight="13rem"
            autoFocus
            aria-label="SQL playground editor"
          />

          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={run} disabled={booting || engine.isRunning || !sql.trim()}>
              {engine.isRunning ? <Loader2 className="animate-spin" /> : <Play />}
              Run
              <kbd className="ml-1 hidden rounded border border-white/30 px-1 font-mono text-2xs sm:inline">
                ⌘↵
              </kbd>
            </Button>

            <Button variant="outline" onClick={() => setSql(formatSql(sql))} disabled={!sql.trim()}>
              <Wand2 />
              Format
            </Button>

            <Button variant="ghost" onClick={() => void engine.reset()} disabled={booting}>
              <RotateCcw />
              Reset data
            </Button>

            {booting && (
              <Badge variant="neutral">
                <Loader2 className="animate-spin" />
                Booting Postgres…
              </Badge>
            )}
          </div>

          {booting ? (
            <div className="grid place-items-center rounded-2xl border-2 border-dashed border-border-base p-10 text-center">
              <div className="size-20">
                <LottiePlayer
                  name="booting-engine"
                  className="size-full"
                  fallback={<Loader2 className="size-8 animate-spin text-brand-500" />}
                />
              </div>
              <p className="mt-2 text-sm font-bold">
                Compiling PostgreSQL to WebAssembly…
              </p>
              <p className="mt-1 text-xs text-fg-muted">
                One-time cost per session. Then every query is instant.
              </p>
            </div>
          ) : (
            <ResultGrid
              result={engine.result}
              error={engine.error}
              maxHeight="28rem"
              emptyMessage="Write a query and hit Run."
            />
          )}
        </div>

        <aside className="min-w-0">
          <Tabs defaultValue="schema">
            <TabsList className="w-full">
              <TabsTrigger value="schema" className="flex-1">
                <Database />
                Schema
              </TabsTrigger>
              <TabsTrigger value="history" className="flex-1">
                <BookMarked />
                History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="schema" className="mt-3 space-y-3">
              <div className="rounded-xl border border-border-base bg-bg-subtle p-3.5">
                <h2 className="text-sm font-extrabold">{dataset.title}</h2>
                <p className="mt-1 text-xs leading-relaxed text-fg-muted">
                  {dataset.description}
                </p>
              </div>
              <SchemaPanel
                schema={engine.schema}
                loading={engine.status !== "ready"}
                onInsert={insertAtEnd}
              />
            </TabsContent>

            <TabsContent value="history" className="mt-3">
              {history.length === 0 ? (
                <p className="px-1 py-8 text-center text-sm text-fg-muted">
                  Queries you run will appear here.
                </p>
              ) : (
                <>
                  <div className="mb-2 flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setHistory([]);
                        toast.success("History cleared");
                      }}
                    >
                      <Trash2 />
                      Clear
                    </Button>
                  </div>
                  <ul className="space-y-2">
                    {history.map((entry, i) => (
                      <li key={`${entry.at}-${i}`}>
                        <button
                          type="button"
                          onClick={() => {
                            if (entry.datasetId !== datasetId) setDatasetId(entry.datasetId);
                            setSql(entry.sql);
                          }}
                          className={cn(
                            "w-full rounded-xl border border-border-base p-2.5 text-left transition-colors",
                            "hover:border-brand-500 hover:bg-bg-subtle",
                          )}
                        >
                          <code className="line-clamp-3 font-mono text-xs leading-relaxed break-words">
                            {entry.sql}
                          </code>
                          <span className="mt-1 block text-2xs font-bold text-fg-subtle uppercase">
                            {getDataset(entry.datasetId).title}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </TabsContent>
          </Tabs>
        </aside>
      </div>
    </div>
  );
}

/** Server-rendered placeholder with the same shape as the editor. */
function PlaygroundSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6">
      <header className="mb-5">
        <h1 className="text-2xl font-extrabold sm:text-3xl">SQL Playground</h1>
        <p className="mt-1 max-w-2xl text-sm text-fg-muted">
          A real PostgreSQL engine running in this tab. Break things freely —
          nothing you type is sent anywhere.
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="space-y-4">
          <Skeleton className="h-52 rounded-xl" />
          <Skeleton className="h-11 w-72 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    </div>
  );
}
