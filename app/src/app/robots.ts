import type { MetadataRoute } from "next";

/**
 * The one robots policy for the whole app. The storefront is crawlable
 * everywhere except its own plumbing: the admin dashboard does not index
 * (it also sets noindex), the API surface carries no canonical pages, and
 * /api/uploads serves patient documents — those must never be crawled.
 */
export default function robots(): MetadataRoute.Robots {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/admin/", "/api/"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
