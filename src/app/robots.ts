import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Private surfaces and anything that would produce thin duplicates.
        disallow: [
          "/api/",
          "/dashboard",
          "/settings",
          "/stats",
          "/shop",
          "/login",
          "/register",
          "/*?*", // query-string variants of canonical pages
        ],
      },
      {
        // Crawl budget is not a concern here; only block what's genuinely private.
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/api/", "/dashboard", "/settings", "/stats", "/login", "/register"],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  };
}
