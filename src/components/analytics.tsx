import Script from "next/script";

/**
 * Optional, privacy-friendly analytics.
 *
 * Renders nothing unless a self-hosted Plausible/Umami endpoint is configured,
 * so the default deployment ships with zero third-party scripts and no cookie
 * banner obligation.
 */
export function Analytics() {
  const src = process.env.NEXT_PUBLIC_ANALYTICS_URL;
  const siteId = process.env.NEXT_PUBLIC_ANALYTICS_SITE_ID;
  if (!src || !siteId) return null;

  return (
    <Script
      src={src}
      data-website-id={siteId}
      data-domain={siteId}
      strategy="lazyOnload"
      defer
    />
  );
}
