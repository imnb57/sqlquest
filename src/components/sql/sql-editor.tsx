"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { EditorView, keymap } from "@codemirror/view";
import { Prec } from "@codemirror/state";
import { sql, PostgreSQL, type SQLNamespace } from "@codemirror/lang-sql";
import { oneDark } from "@codemirror/theme-one-dark";
import { useTheme } from "next-themes";

import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/stores/settings-store";
import type { SchemaTable } from "@/lib/sql/types";

/**
 * SQL editor.
 *
 * CodeMirror 6 rather than Monaco: a tenth of the bundle, works properly on
 * touch devices, and the SQL language package gives us schema-aware
 * autocompletion for free once we hand it the dataset's tables.
 */

const CodeMirror = dynamic(() => import("@uiw/react-codemirror"), {
  ssr: false,
  loading: () => (
    <div className="h-full min-h-40 w-full animate-pulse rounded-xl bg-bg-inset" />
  ),
});

export interface SqlEditorProps {
  value: string;
  onChange: (value: string) => void;
  /** Fired on ⌘/Ctrl+Enter — the universal "run this" gesture. */
  onSubmit?: () => void;
  schema?: SchemaTable[];
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
  autoFocus?: boolean;
  minHeight?: string;
  "aria-label"?: string;
}

/** Converts our schema model into CodeMirror's completion namespace. */
function toCompletionSchema(tables: SchemaTable[]): SQLNamespace {
  const namespace: Record<string, string[]> = {};
  for (const table of tables) {
    namespace[table.name] = table.columns.map((c) => c.name);
  }
  return namespace;
}

export function SqlEditor({
  value,
  onChange,
  onSubmit,
  schema = [],
  placeholder = "SELECT ...",
  readOnly,
  className,
  autoFocus,
  minHeight = "9rem",
  "aria-label": ariaLabel = "SQL editor",
}: SqlEditorProps) {
  const { resolvedTheme } = useTheme();
  const fontSize = useSettingsStore((s) => s.editorFontSize);
  const showLineNumbers = useSettingsStore((s) => s.lineNumbers);
  const autocomplete = useSettingsStore((s) => s.autocompleteEnabled);

  // The run handler is indirected through a ref so the keymap extension is
  // built once. Rebuilding it would tear down and remount CodeMirror on every
  // keystroke, because callers' `onSubmit` closes over the editor's value.
  // The ref is written in an effect and read only from the key handler, i.e.
  // never during render.
  const submitRef = React.useRef(onSubmit);
  React.useEffect(() => {
    submitRef.current = onSubmit;
  }, [onSubmit]);

  const runSubmit = React.useCallback(() => {
    submitRef.current?.();
    return true;
  }, []);

  const extensions = React.useMemo(() => {
    // `runSubmit` reads a ref, which the hooks linter flags because it can't
    // see across the CodeMirror extension boundary. It is only ever invoked
    // from a keydown handler, never during render.
    const runKeymap = Prec.highest(
      // eslint-disable-next-line react-hooks/refs
      keymap.of([
        { key: "Mod-Enter", preventDefault: true, run: runSubmit },
        { key: "Shift-Enter", preventDefault: true, run: runSubmit },
      ]),
    );

    return [
      sql({
        dialect: PostgreSQL,
        schema: autocomplete ? toCompletionSchema(schema) : undefined,
        upperCaseKeywords: true,
      }),
      EditorView.lineWrapping,
      EditorView.theme({
        "&": { fontSize: `${fontSize}px`, minHeight },
        ".cm-content": { padding: "0.5rem 0.75rem", minHeight },
        ".cm-line": { padding: "0 0.25rem" },
      }),
      runKeymap,
    ];
  }, [schema, autocomplete, fontSize, minHeight, runSubmit]);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border-2 border-border-base bg-code-bg transition-colors",
        "focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-500/15",
        className,
      )}
    >
      <CodeMirror
        value={value}
        onChange={onChange}
        extensions={extensions}
        theme={resolvedTheme === "dark" ? oneDark : "light"}
        placeholder={placeholder}
        readOnly={readOnly}
        autoFocus={autoFocus}
        aria-label={ariaLabel}
        basicSetup={{
          lineNumbers: showLineNumbers,
          foldGutter: false,
          highlightActiveLine: true,
          highlightActiveLineGutter: true,
          autocompletion: autocomplete,
          closeBrackets: true,
          bracketMatching: true,
          highlightSelectionMatches: false,
          searchKeymap: false,
        }}
      />
    </div>
  );
}
