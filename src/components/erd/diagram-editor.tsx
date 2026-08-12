"use client";

import * as React from "react";
import Link from "next/link";
import {
  Code2,
  Database,
  Download,
  FileJson,
  Plus,
  Redo2,
  Trash2,
  Undo2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import { LogoMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/form-controls";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SqlEditor } from "@/components/sql/sql-editor";
import { CodeBlock } from "@/components/lesson/prompt-text";
import { DiagramCanvas } from "./diagram-canvas";
import { TableInspector } from "./table-inspector";

import { getSqlEngine } from "@/lib/sql/client";
import { datasets, getDataset } from "@/content/datasets";
import {
  diagramFromJson,
  diagramStats,
  diagramToJson,
  importFromSchema,
  toDdl,
} from "@/lib/erd/ddl";
import { emptyDiagram, newTable, type ErdDiagram, type ErdTable } from "@/lib/erd/types";
import { useIsMounted } from "@/hooks/use-client";

/**
 * ER diagram editor.
 *
 * Design decisions worth knowing:
 *
 * - **No SQL parser.** "Import SQL" executes the DDL in a throwaway PGlite
 *   database and reads `information_schema` back. Anything Postgres accepts
 *   imports perfectly, and there is no dialect coverage to maintain.
 * - **Undo is a snapshot stack.** Diagrams are small; storing whole copies is
 *   cheaper in complexity than a command log, and can't drift out of sync.
 * - **Local only.** Diagrams live in localStorage, like everything else here.
 */

const STORAGE_KEY = "sqlquest:diagram";
const HISTORY_LIMIT = 50;

function load(): ErdDiagram | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ErdDiagram) : null;
  } catch {
    return null;
  }
}

export function DiagramEditor() {
  const mounted = useIsMounted();
  if (!mounted) return <EditorSkeleton />;
  return <Editor />;
}

function Editor() {
  const [diagram, setDiagramRaw] = React.useState<ErdDiagram>(
    () => load() ?? emptyDiagram("My schema"),
  );
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [past, setPast] = React.useState<ErdDiagram[]>([]);
  const [future, setFuture] = React.useState<ErdDiagram[]>([]);

  const [importOpen, setImportOpen] = React.useState(false);
  const [importSql, setImportSql] = React.useState("");
  const [importing, setImporting] = React.useState(false);
  const fileInput = React.useRef<HTMLInputElement>(null);

  /** Every mutation goes through here so history stays complete. */
  const commit = React.useCallback(
    (next: ErdDiagram) => {
      setPast((p) => [...p.slice(-HISTORY_LIMIT), diagram]);
      setFuture([]);
      setDiagramRaw({ ...next, updatedAt: new Date().toISOString() });
    },
    [diagram],
  );

  React.useEffect(() => {
    const id = setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(diagram));
      } catch {
        /* Quota or private mode — the diagram still works this session. */
      }
    }, 400);
    return () => clearTimeout(id);
  }, [diagram]);

  const undo = React.useCallback(() => {
    setPast((p) => {
      if (p.length === 0) return p;
      const previous = p[p.length - 1];
      setFuture((f) => [diagram, ...f]);
      setDiagramRaw(previous);
      return p.slice(0, -1);
    });
  }, [diagram]);

  const redo = React.useCallback(() => {
    setFuture((f) => {
      if (f.length === 0) return f;
      setPast((p) => [...p, diagram]);
      setDiagramRaw(f[0]);
      return f.slice(1);
    });
  }, [diagram]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      if (e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((e.key === "z" && e.shiftKey) || e.key === "y") {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  /* -- table operations --------------------------------------------------- */

  const addTable = () => {
    // Offset each new table so they don't stack on the origin.
    const n = diagram.tables.length;
    const table = newTable(`table_${n + 1}`, {
      x: 80 + (n % 3) * 340,
      y: 80 + Math.floor(n / 3) * 300,
    });
    commit({ ...diagram, tables: [...diagram.tables, table] });
    setSelectedId(table.id);
  };

  const updateTable = (next: ErdTable) =>
    commit({
      ...diagram,
      tables: diagram.tables.map((t) => (t.id === next.id ? next : t)),
    });

  const deleteTable = (id: string) => {
    commit({
      ...diagram,
      tables: diagram.tables
        .filter((t) => t.id !== id)
        // Drop any foreign key that pointed at the deleted table.
        .map((t) => ({
          ...t,
          columns: t.columns.map((c) =>
            c.references?.tableId === id ? { ...c, references: undefined } : c,
          ),
        })),
    });
    setSelectedId(null);
  };

  const moveTable = (id: string, position: { x: number; y: number }) =>
    // Position changes bypass history — undoing a drag one pixel at a time
    // would make Cmd+Z useless for real edits.
    setDiagramRaw((d) => ({
      ...d,
      tables: d.tables.map((t) => (t.id === id ? { ...t, position } : t)),
    }));

  const connect = ({
    fromTableId,
    fromColumnId,
    toTableId,
    toColumnId,
  }: {
    fromTableId: string;
    fromColumnId: string;
    toTableId: string;
    toColumnId: string;
  }) => {
    commit({
      ...diagram,
      tables: diagram.tables.map((t) =>
        t.id !== fromTableId
          ? t
          : {
              ...t,
              columns: t.columns.map((c) =>
                c.id === fromColumnId
                  ? { ...c, references: { tableId: toTableId, columnId: toColumnId } }
                  : c,
              ),
            },
      ),
    });
    toast.success("Foreign key added");
  };

  /* -- import / export ---------------------------------------------------- */

  const importFromSql = async (sql: string, name: string) => {
    setImporting(true);
    try {
      const engine = getSqlEngine();
      // A throwaway database: run the DDL, read the schema back out. Postgres
      // is the parser, so anything it accepts imports exactly.
      await engine.useDataset(`erd-import-${Date.now()}`, sql);
      const schema = await engine.schema();
      if (schema.length === 0) throw new Error("No tables found in that SQL.");

      commit(importFromSchema(schema, name));
      setSelectedId(null);
      setImportOpen(false);
      setImportSql("");
      toast.success(`Imported ${schema.length} tables`);
    } catch (error) {
      toast.error("Import failed", {
        description:
          error instanceof Error
            ? error.message.split("\n")[0]
            : "That SQL couldn't be executed.",
      });
    } finally {
      setImporting(false);
    }
  };

  const download = (content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const ddl = React.useMemo(() => toDdl(diagram), [diagram]);
  const stats = diagramStats(diagram);
  const selected = diagram.tables.find((t) => t.id === selectedId) ?? null;
  const fileSafeName = diagram.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      {/* Toolbar */}
      <header className="flex flex-wrap items-center gap-2 border-b border-border-base bg-bg px-4 py-2.5">
        <Link
          href="/learn"
          aria-label="Back to SQLQuest"
          className="mr-1 grid size-9 shrink-0 place-items-center rounded-xl transition-colors hover:bg-bg-inset"
        >
          <LogoMark className="size-7" />
        </Link>

        <Input
          value={diagram.name}
          onChange={(e) => setDiagramRaw({ ...diagram, name: e.target.value })}
          className="h-9 w-48 font-bold"
          aria-label="Diagram name"
        />

        <Button size="sm" onClick={addTable}>
          <Plus />
          Table
        </Button>

        <div className="flex items-center">
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={undo}
            disabled={past.length === 0}
            aria-label="Undo"
          >
            <Undo2 />
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={redo}
            disabled={future.length === 0}
            aria-label="Redo"
          >
            <Redo2 />
          </Button>
        </div>

        <span className="hidden h-6 w-px bg-border-base sm:block" />

        <Button size="sm" variant="outline" onClick={() => setImportOpen(true)}>
          <Upload />
          Import SQL
        </Button>

        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            try {
              commit(diagramFromJson(await file.text()));
              toast.success("Diagram loaded");
            } catch {
              toast.error("That file isn't a SQLQuest diagram.");
            }
          }}
        />
        <Button size="sm" variant="ghost" onClick={() => fileInput.current?.click()}>
          <FileJson />
          Open
        </Button>

        <div className="ml-auto flex items-center gap-2">
          <Badge variant="neutral" size="sm" className="hidden sm:inline-flex">
            {stats.tables} tables · {stats.columns} columns · {stats.relationships} FKs
          </Badge>

          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              download(ddl, `${fileSafeName}.sql`, "application/sql")
            }
          >
            <Download />
            .sql
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() =>
              download(
                diagramToJson(diagram),
                `${fileSafeName}.json`,
                "application/json",
              )
            }
          >
            .json
          </Button>

          {diagram.tables.length > 0 && (
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label="Clear diagram"
              onClick={() => {
                commit(emptyDiagram(diagram.name));
                setSelectedId(null);
              }}
            >
              <Trash2 />
            </Button>
          )}
        </div>
      </header>

      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_24rem]">
        {/* Canvas */}
        <div className="relative min-h-[26rem] border-b border-border-base lg:border-r lg:border-b-0">
          {diagram.tables.length === 0 ? (
            <EmptyCanvas
              onAdd={addTable}
              onImportDataset={(id) =>
                void importFromSql(getDataset(id).sql, getDataset(id).title)
              }
            />
          ) : (
            <DiagramCanvas
              diagram={diagram}
              selectedTableId={selectedId}
              onSelectTable={setSelectedId}
              onMoveTable={moveTable}
              onConnect={connect}
            />
          )}
        </div>

        {/* Side panel */}
        <aside className="flex min-h-0 flex-col bg-bg">
          <Tabs defaultValue={selected ? "table" : "sql"} className="flex min-h-0 flex-1 flex-col">
            <TabsList className="m-3 shrink-0">
              <TabsTrigger value="table" className="flex-1">
                Table
              </TabsTrigger>
              <TabsTrigger value="sql" className="flex-1">
                <Code2 />
                SQL
              </TabsTrigger>
            </TabsList>

            <TabsContent value="table" className="min-h-0 flex-1 overflow-hidden">
              {selected ? (
                <TableInspector
                  diagram={diagram}
                  table={selected}
                  onChange={updateTable}
                  onDelete={() => deleteTable(selected.id)}
                />
              ) : (
                <p className="px-4 py-8 text-center text-sm text-fg-muted">
                  Select a table on the canvas to edit its columns, keys and
                  relationships.
                </p>
              )}
            </TabsContent>

            <TabsContent value="sql" className="min-h-0 flex-1 overflow-y-auto scroll-thin p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="eyebrow text-fg-subtle">Generated DDL</p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    void navigator.clipboard?.writeText(ddl);
                    toast.success("SQL copied");
                  }}
                >
                  Copy
                </Button>
              </div>
              <CodeBlock code={ddl} />
              <p className="mt-3 text-xs leading-relaxed text-fg-subtle">
                Foreign keys are emitted as separate <code>ALTER TABLE</code>{" "}
                statements so the script runs regardless of table order — and
                survives circular references.
              </p>
            </TabsContent>
          </Tabs>
        </aside>
      </div>

      {/* Import dialog */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import from SQL</DialogTitle>
            <DialogDescription>
              Paste <code>CREATE TABLE</code> statements. They&rsquo;re executed
              against a real Postgres in your browser and the schema is read
              back — so anything Postgres accepts imports exactly, including
              constraints and foreign keys.
            </DialogDescription>
          </DialogHeader>

          <SqlEditor
            value={importSql}
            onChange={setImportSql}
            minHeight="14rem"
            placeholder={"CREATE TABLE authors (\n  id integer PRIMARY KEY,\n  name text NOT NULL\n);"}
            aria-label="SQL to import"
          />

          <div>
            <p className="eyebrow text-fg-subtle">Or start from a course dataset</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {datasets.map((d) => (
                <Button
                  key={d.id}
                  size="sm"
                  variant="outline"
                  disabled={importing}
                  onClick={() => void importFromSql(d.sql, d.title)}
                >
                  <Database />
                  {d.title}
                </Button>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setImportOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={importing || !importSql.trim()}
              onClick={() => void importFromSql(importSql, "Imported schema")}
            >
              {importing ? "Importing…" : "Import"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EmptyCanvas({
  onAdd,
  onImportDataset,
}: {
  onAdd: () => void;
  onImportDataset: (datasetId: string) => void;
}) {
  return (
    <div className="grid h-full place-items-center bg-grid p-8 text-center">
      <div className="max-w-md">
        <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-brand-500/12">
          <Database className="size-8 text-brand-500" />
        </div>
        <h2 className="mt-4 text-xl font-extrabold">Design a schema</h2>
        <p className="mt-2 text-sm leading-relaxed text-fg-muted">
          Draw tables, drag between columns to create foreign keys, and get
          runnable <code>CREATE TABLE</code> SQL out the other side. Or start
          from a schema you already know.
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button onClick={onAdd}>
            <Plus />
            Add a table
          </Button>
          <Button variant="outline" onClick={() => onImportDataset("market")}>
            <Database />
            Load the Night Market schema
          </Button>
        </div>
      </div>
    </div>
  );
}

function EditorSkeleton() {
  return (
    <div className="grid h-dvh place-items-center">
      <div className="h-96 w-full max-w-4xl animate-pulse rounded-2xl bg-bg-inset" />
    </div>
  );
}
