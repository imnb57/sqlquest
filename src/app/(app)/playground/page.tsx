import type { Metadata } from "next";
import { Playground } from "@/components/playground/playground";
import { JsonLd } from "@/components/seo/json-ld";
import { buildMetadata, breadcrumbSchema } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Free online SQL playground",
  description:
    "Run real PostgreSQL in your browser — no signup, no server, no setup. Six ready-made datasets covering joins, aggregation, window functions and query plans.",
  path: "/playground",
  keywords: [
    "online SQL editor",
    "SQL playground",
    "run SQL in browser",
    "postgres online",
    "free SQL sandbox",
    "practice SQL online",
  ],
});

export default function PlaygroundPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Playground", path: "/playground" },
        ])}
      />
      <Playground />
    </>
  );
}
