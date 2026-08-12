import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site";

export const runtime = "nodejs";
export const contentType = "image/png";

/**
 * Dynamic Open Graph images.
 *
 * `/og?title=...&subtitle=...&tag=...` renders a 1200×630 card. Built with
 * system-available fonts only so it needs no network fetch at build or
 * request time — a webfont here is the usual cause of OG generation failing
 * in a locked-down container.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const title = (searchParams.get("title") ?? siteConfig.tagline).slice(0, 110);
  const subtitle = (
    searchParams.get("subtitle") ?? siteConfig.shortDescription
  ).slice(0, 160);
  const tag = searchParams.get("tag")?.slice(0, 32);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background:
            "linear-gradient(135deg, #2e1065 0%, #4c1d95 45%, #1e1b4b 100%)",
          color: "white",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Aurora accent */}
        <div
          style={{
            position: "absolute",
            top: -160,
            right: -120,
            width: 520,
            height: 520,
            borderRadius: 9999,
            background:
              "radial-gradient(circle, rgba(34,211,238,0.45) 0%, rgba(34,211,238,0) 70%)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -180,
            left: -100,
            width: 460,
            height: 460,
            borderRadius: 9999,
            background:
              "radial-gradient(circle, rgba(163,230,53,0.3) 0%, rgba(163,230,53,0) 70%)",
            display: "flex",
          }}
        />

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 18,
              background: "linear-gradient(135deg, #8b5cf6, #22d3ee)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 34,
            }}
          >
            🗄️
          </div>
          <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: -0.5 }}>
            SQLQuest
          </div>

          {tag && (
            <div
              style={{
                marginLeft: 12,
                padding: "8px 18px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.16)",
                fontSize: 22,
                fontWeight: 700,
              }}
            >
              {tag}
            </div>
          )}
        </div>

        {/* Title block */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              fontSize: title.length > 60 ? 60 : 74,
              fontWeight: 800,
              lineHeight: 1.08,
              letterSpacing: -1.5,
              maxWidth: 1000,
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 28,
              lineHeight: 1.4,
              color: "rgba(255,255,255,0.82)",
              maxWidth: 900,
            }}
          >
            {subtitle}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 24,
            color: "rgba(255,255,255,0.78)",
          }}
        >
          <div style={{ display: "flex", gap: 28 }}>
            <span>Free &amp; open source</span>
            <span>·</span>
            <span>Real Postgres in your browser</span>
          </div>
          <div style={{ fontWeight: 700 }}>sqlquest.dev</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
