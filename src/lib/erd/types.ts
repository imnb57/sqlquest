/**
 * Entity-relationship model.
 *
 * Relationships are *derived* from a column's `references` rather than stored
 * as separate edge objects. That's deliberate: it mirrors how a real schema
 * works, makes an orphaned edge structurally impossible, and means DDL
 * generation is a direct walk of the model rather than a reconciliation of two
 * parallel structures.
 */

export type Cardinality = "one-to-one" | "one-to-many" | "many-to-many";

export interface ErdColumn {
  id: string;
  name: string;
  /** Free text — anything Postgres accepts. Not an enum, on purpose. */
  type: string;
  isPrimaryKey: boolean;
  isNullable: boolean;
  isUnique: boolean;
  /** Foreign key target. The edge on the canvas is drawn from this. */
  references?: { tableId: string; columnId: string };
  /** ON DELETE behaviour, emitted into the generated DDL. */
  onDelete?: "cascade" | "set null" | "restrict" | "no action";
  defaultValue?: string;
}

export interface ErdTable {
  id: string;
  name: string;
  columns: ErdColumn[];
  position: { x: number; y: number };
  /** One of the brand accents; purely visual grouping. */
  accent?: string;
  note?: string;
}

export interface ErdDiagram {
  id: string;
  name: string;
  /** "erd" today; "uml" swaps the node renderer, same graph underneath. */
  kind: "erd" | "uml";
  tables: ErdTable[];
  updatedAt: string;
}

/* --------------------------------------------------------------- helpers */

let counter = 0;

/** Ids only need to be unique within a diagram, and stable across a session. */
export function newId(prefix: string): string {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36)}`;
}

export function emptyDiagram(name = "Untitled diagram"): ErdDiagram {
  return {
    id: newId("d"),
    name,
    kind: "erd",
    tables: [],
    updatedAt: new Date().toISOString(),
  };
}

export function newColumn(overrides: Partial<ErdColumn> = {}): ErdColumn {
  return {
    id: newId("c"),
    name: "column_name",
    type: "text",
    isPrimaryKey: false,
    isNullable: true,
    isUnique: false,
    ...overrides,
  };
}

export function newTable(
  name: string,
  position: { x: number; y: number },
): ErdTable {
  return {
    id: newId("t"),
    name,
    position,
    columns: [
      newColumn({
        name: "id",
        type: "integer",
        isPrimaryKey: true,
        isNullable: false,
      }),
    ],
  };
}

/** Common Postgres types offered in the type picker. Free text still wins. */
export const COMMON_TYPES = [
  "integer",
  "bigint",
  "serial",
  "text",
  "varchar(255)",
  "boolean",
  "numeric(10,2)",
  "date",
  "timestamp",
  "timestamptz",
  "uuid",
  "jsonb",
] as const;

/**
 * Infers the cardinality of a foreign key from the constraints on both sides.
 *
 * A FK column that is itself unique (or a primary key) can only ever match one
 * parent row, which makes it one-to-one; otherwise many child rows can point at
 * the same parent.
 */
export function inferCardinality(
  diagram: ErdDiagram,
  tableId: string,
  columnId: string,
): Cardinality {
  const table = diagram.tables.find((t) => t.id === tableId);
  const column = table?.columns.find((c) => c.id === columnId);
  if (!column) return "one-to-many";
  return column.isUnique || column.isPrimaryKey ? "one-to-one" : "one-to-many";
}

export interface Relationship {
  id: string;
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
  cardinality: Cardinality;
}

/** Flattens every foreign key in the diagram into drawable edges. */
export function relationshipsOf(diagram: ErdDiagram): Relationship[] {
  const out: Relationship[] = [];
  for (const table of diagram.tables) {
    for (const column of table.columns) {
      if (!column.references) continue;
      // Skip dangling references — a table may have been deleted underneath.
      const target = diagram.tables.find((t) => t.id === column.references!.tableId);
      if (!target) continue;

      out.push({
        id: `${table.id}.${column.id}`,
        fromTable: table.id,
        fromColumn: column.id,
        toTable: column.references.tableId,
        toColumn: column.references.columnId,
        cardinality: inferCardinality(diagram, table.id, column.id),
      });
    }
  }
  return out;
}
