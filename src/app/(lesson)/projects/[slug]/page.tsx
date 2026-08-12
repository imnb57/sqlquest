import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CapstoneWorkspace } from "@/components/capstone/capstone-workspace";
import { JsonLd } from "@/components/seo/json-ld";
import { capstones, getCapstone } from "@/content/capstones";
import { buildMetadata, breadcrumbSchema, learningResourceSchema } from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return capstones.map((c) => ({ slug: c.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const capstone = getCapstone(slug);
  if (!capstone) return { title: "Project not found" };

  return buildMetadata({
    title: `${capstone.title} — SQL capstone project`,
    description: `${capstone.subtitle}. ${capstone.milestones.length} graded milestones on a real Postgres database in your browser. ${capstone.scenario.slice(0, 90)}…`,
    path: `/projects/${capstone.slug}`,
    keywords: capstone.keywords,
  });
}

export default async function CapstonePage({ params }: Props) {
  const { slug } = await params;
  const capstone = getCapstone(slug);
  if (!capstone) notFound();

  return (
    <>
      <JsonLd
        data={[
          learningResourceSchema({
            name: capstone.title,
            description: capstone.subtitle,
            path: `/projects/${capstone.slug}`,
            level: capstone.difficulty,
            minutes: capstone.estimatedMinutes,
            keywords: capstone.keywords,
          }),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Projects", path: "/projects" },
            { name: capstone.title, path: `/projects/${capstone.slug}` },
          ]),
        ]}
      />
      <CapstoneWorkspace capstone={capstone} />
    </>
  );
}
