"use client";

import * as React from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  type Connection,
  type Edge,
  type Node,
  type NodeChange,
  applyNodeChanges,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { TableNode } from "./table-node";
import { relationshipsOf, type ErdDiagram } from "@/lib/erd/types";

/**
 * The canvas.
 *
 * React Flow owns pan/zoom/drag; the diagram model stays the source of truth
 * and nodes are projected from it on every render. Dragging writes positions
 * straight back into the model, so there's never a second copy of the graph to
 * keep in sync.
 */

const NODE_TYPES = { table: TableNode };

const CARDINALITY_LABEL = {
  "one-to-one": "1 — 1",
  "one-to-many": "1 — ∞",
  "many-to-many": "∞ — ∞",
} as const;

interface CanvasProps {
  diagram: ErdDiagram;
  selectedTableId: string | null;
  onSelectTable: (id: string | null) => void;
  onMoveTable: (id: string, position: { x: number; y: number }) => void;
  /** Dragging column-to-column creates a foreign key. */
  onConnect: (args: {
    fromTableId: string;
    fromColumnId: string;
    toTableId: string;
    toColumnId: string;
  }) => void;
}

function CanvasInner({
  diagram,
  selectedTableId,
  onSelectTable,
  onMoveTable,
  onConnect,
}: CanvasProps) {
  const nodes: Node[] = React.useMemo(
    () =>
      diagram.tables.map((table) => ({
        id: table.id,
        type: "table",
        position: table.position,
        data: { table },
        selected: table.id === selectedTableId,
      })),
    [diagram.tables, selectedTableId],
  );

  const edges: Edge[] = React.useMemo(
    () =>
      relationshipsOf(diagram).map((rel) => ({
        id: rel.id,
        source: rel.fromTable,
        sourceHandle: `${rel.fromColumn}-source`,
        target: rel.toTable,
        targetHandle: `${rel.toColumn}-target`,
        type: "smoothstep",
        animated: false,
        label: CARDINALITY_LABEL[rel.cardinality],
        labelStyle: { fontSize: 11, fontWeight: 700, fill: "var(--fg-muted)" },
        labelBgStyle: { fill: "var(--bg-elevated)" },
        labelBgPadding: [6, 3] as [number, number],
        labelBgBorderRadius: 6,
        style: { stroke: "var(--color-aqua-500)", strokeWidth: 2 },
      })),
    [diagram],
  );

  const handleNodesChange = React.useCallback(
    (changes: NodeChange[]) => {
      // Positions are the only node state we persist; React Flow's other
      // changes (selection, dimensions) are transient and handled elsewhere.
      const next = applyNodeChanges(changes, nodes);
      for (const change of changes) {
        if (change.type === "position" && change.dragging === false) {
          const moved = next.find((n) => n.id === change.id);
          if (moved) onMoveTable(moved.id, moved.position);
        }
      }
    },
    [nodes, onMoveTable],
  );

  const handleConnect = React.useCallback(
    (connection: Connection) => {
      const fromColumnId = connection.sourceHandle?.replace(/-source$/, "");
      const toColumnId = connection.targetHandle?.replace(/-target$/, "");
      if (!connection.source || !connection.target || !fromColumnId || !toColumnId)
        return;

      onConnect({
        fromTableId: connection.source,
        fromColumnId,
        toTableId: connection.target,
        toColumnId,
      });
    },
    [onConnect],
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={NODE_TYPES}
      onNodesChange={handleNodesChange}
      onConnect={handleConnect}
      onNodeClick={(_, node) => onSelectTable(node.id)}
      onPaneClick={() => onSelectTable(null)}
      fitView
      fitViewOptions={{ padding: 0.2, maxZoom: 1.1, minZoom: 0.5 }}
      minZoom={0.2}
      maxZoom={2}
      proOptions={{ hideAttribution: false }}
      className="bg-bg-subtle"
    >
      <Background
        variant={BackgroundVariant.Dots}
        gap={20}
        size={1.5}
        className="!text-border-strong"
      />
      <Controls
        showInteractive={false}
        className="!rounded-xl !border !border-border-base !bg-bg-elevated !shadow-lg [&_button]:!border-border-base [&_button]:!bg-bg-elevated [&_button]:!fill-fg-muted hover:[&_button]:!bg-bg-inset"
      />
      {/* MiniMap paints into SVG `fill` attributes, where our `var(--…)`
          tokens don't resolve — it rendered as an empty white box. Concrete
          rgba values, chosen to read acceptably in both themes. */}
      <MiniMap
        pannable
        zoomable
        ariaLabel="Diagram overview"
        className="!rounded-xl !border !border-border-base !bg-bg-subtle"
        maskColor="rgba(124, 58, 237, 0.10)"
        nodeColor="rgba(139, 92, 246, 0.85)"
        nodeStrokeColor="rgba(109, 40, 217, 1)"
        nodeStrokeWidth={3}
        nodeBorderRadius={4}
      />
    </ReactFlow>
  );
}

export function DiagramCanvas(props: CanvasProps) {
  return (
    <ReactFlowProvider>
      <CanvasInner {...props} />
    </ReactFlowProvider>
  );
}
