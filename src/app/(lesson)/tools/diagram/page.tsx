import type { Metadata } from "next";

import { DiagramEditor } from "@/components/erd/diagram-editor";
import { JsonLd } from "@/components/seo/json-ld";
import { buildMetadata, breadcrumbSchema } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "ER diagram editor — design a schema, get the SQL",
  description:
    "Draw entity-relationship diagrams in your browser and export runnable CREATE TABLE statements. Import existing SQL and get a diagram back. Free, no signup, nothing leaves your device.",
  path: "/tools/diagram",
  keywords: [
    "ER diagram tool",
    "ERD editor online",
    "database schema designer",
    "SQL to diagram",
    "diagram to SQL",
    "free database design tool",
    "entity relationship diagram",
  ],
});

export default function DiagramToolPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Tools", path: "/tools" },
          { name: "ER diagram editor", path: "/tools/diagram" },
        ])}
      />
      <DiagramEditor />
    </>
  );
}
