import type { StatementKind } from "./types";

/**
 * Lightweight SQL inspection helpers.
 *
 * These are deliberately regex-based rather than a full parser: they only
 * classify statements for UI purposes and enforce authoring constraints.
 * Correctness is always decided by *executing* the query, never by parsing it.
 */

/** Strips string literals and comments so keyword matching can't be fooled. */
export function stripLiteralsAndComments(sql: string): string {
  return sql
    .replace(/--[^\n]*/g, " ")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/\$\$[\s\S]*?\$\$/g, " '' ")
    .replace(/'(?:[^']|'')*'/g, " '' ")
    .replace(/"(?:[^"]|"")*"/g, ' "" ');
}

export function normalizeWhitespace(sql: string): string {
  return sql.replace(/\s+/g, " ").trim();
}

export function detectKind(sql: string): StatementKind {
  const s = normalizeWhitespace(stripLiteralsAndComments(sql)).toLowerCase();
  // A leading CTE still resolves to the kind of its main statement.
  const body = s.startsWith("with ")
    ? (s.match(/\)\s*(select|insert|update|delete)\b/)?.[1] ?? "select")
    : s;

  if (/^explain\b/.test(body)) return "explain";
  if (/^select\b/.test(body) || /^\(?\s*select\b/.test(body) || /^table\b/.test(body))
    return "select";
  if (/^insert\b/.test(body)) return "insert";
  if (/^update\b/.test(body)) return "update";
  if (/^delete\b/.test(body)) return "delete";
  if (/^(create|alter|drop|truncate|comment|grant|revoke)\b/.test(body)) return "ddl";
  return "other";
}

/** True when the statement changes data or structure — triggers a re-seed. */
export function isMutating(sql: string): boolean {
  const kind = detectKind(sql);
  return kind === "insert" || kind === "update" || kind === "delete" || kind === "ddl";
}

/** Splits on semicolons that are outside literals/comments. */
export function splitStatements(sql: string): string[] {
  const out: string[] = [];
  let current = "";
  let inSingle = false;
  let inDouble = false;
  let inLineComment = false;
  let inBlockComment = false;
  let dollarTag: string | null = null;

  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];
    const next = sql[i + 1];

    if (inLineComment) {
      current += ch;
      if (ch === "\n") inLineComment = false;
      continue;
    }
    if (inBlockComment) {
      current += ch;
      if (ch === "*" && next === "/") {
        current += next;
        i++;
        inBlockComment = false;
      }
      continue;
    }
    if (dollarTag) {
      current += ch;
      if (sql.startsWith(dollarTag, i)) {
        current += sql.slice(i + 1, i + dollarTag.length);
        i += dollarTag.length - 1;
        dollarTag = null;
      }
      continue;
    }
    if (!inSingle && !inDouble) {
      if (ch === "-" && next === "-") {
        inLineComment = true;
        current += ch;
        continue;
      }
      if (ch === "/" && next === "*") {
        inBlockComment = true;
        current += ch;
        continue;
      }
      const dollar = /^\$[A-Za-z_]*\$/.exec(sql.slice(i));
      if (dollar) {
        dollarTag = dollar[0];
        current += dollar[0];
        i += dollar[0].length - 1;
        continue;
      }
    }

    if (ch === "'" && !inDouble) inSingle = !inSingle;
    else if (ch === '"' && !inSingle) inDouble = !inDouble;

    if (ch === ";" && !inSingle && !inDouble) {
      if (current.trim()) out.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }

  if (current.trim()) out.push(current.trim());
  return out;
}

export function hasOrderBy(sql: string): boolean {
  const s = stripLiteralsAndComments(sql).toLowerCase();
  // Ignore ORDER BY that only appears inside a window frame.
  const withoutWindows = s.replace(/over\s*\([^)]*\)/g, " over() ");
  return /\border\s+by\b/.test(withoutWindows);
}

/** Pretty-prints a query with keyword-per-line formatting. Best-effort. */
const FORMAT_BREAKS = [
  "select",
  "from",
  "where",
  "group by",
  "having",
  "order by",
  "limit",
  "offset",
  "union all",
  "union",
  "intersect",
  "except",
  "inner join",
  "left join",
  "right join",
  "full join",
  "cross join",
  "join",
  "on",
  "values",
  "set",
  "returning",
  "window",
];

export function formatSql(sql: string): string {
  let out = normalizeWhitespace(sql);
  for (const kw of FORMAT_BREAKS) {
    const re = new RegExp(`\\s+${kw.replace(/ /g, "\\s+")}\\s+`, "gi");
    out = out.replace(re, `\n${kw.toUpperCase()} `);
  }
  return out
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");
}
