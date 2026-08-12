import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${siteConfig.name} — ${siteConfig.tagline}`,
    short_name: siteConfig.name,
    description: siteConfig.shortDescription,
    start_url: "/learn",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#1a1524",
    theme_color: siteConfig.themeColor,
    categories: ["education", "productivity", "developer"],
    lang: "en",
    dir: "ltr",
    // SVG only, deliberately: vectors scale to every launcher size, and it
    // keeps the repo free of binary assets that drift out of sync with the mark.
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      {
        src: "/icon-maskable.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Continue learning",
        short_name: "Learn",
        url: "/learn",
        description: "Pick up where you left off",
      },
      {
        name: "Playground",
        short_name: "SQL",
        url: "/playground",
        description: "Run SQL against a real Postgres in your browser",
      },
      {
        name: "Dashboard",
        short_name: "Stats",
        url: "/dashboard",
        description: "Your streak, XP and progress",
      },
    ],
  };
}
