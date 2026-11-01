import type { MetadataRoute } from "next";
import prisma from "@/lib/prisma";

/**
 * The storefront sitemap: home, doctor profiles, the journal index and every
 * published article, in both locales with hreflang alternates. Rendered per request.
 *
 * The DB read is wrapped so a build/deploy without a reachable database
 * still ships the sitemap with the static routes rather than failing —
 * article URLs reappear on the next successful render.
 */
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const root = base.replace(/\/$/, "");

  const locales = ["ar", "en"] as const;
  // The Arabic storefront is the canonical locale; it gets the higher weight.
  const priority = (locale: (typeof locales)[number]) => (locale === "ar" ? 1 : 0.8);

  const staticPath = (locale: string) => [
    { path: "", changeFrequency: "weekly" as const, priority: priority(locale as "ar") },
    { path: "articles", changeFrequency: "weekly" as const, priority: priority(locale as "ar") },
  ];

  const entries: MetadataRoute.Sitemap = [];
  const now = new Date();

  // Article slugs come from the database; on failure keep only static routes.
  let articles: { slug: string; updatedAt: Date }[] = [];
  try {
    articles = await prisma.blogPost.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      select: { slug: true, updatedAt: true },
    });
  } catch {
    articles = [];
  }

  const doctors = await prisma.doctor.findMany({
    where: { active: true }, select: { id: true },
  }).catch(() => []);

  for (const locale of locales) {
    for (const page of staticPath(locale)) {
      entries.push({
        url: `${root}/${locale}${page.path ? `/${page.path}` : ""}`,
        lastModified: now,
        changeFrequency: page.changeFrequency,
        priority: page.priority,
        alternates: {
          languages: locale === "ar" ? { en: `${root}/en${page.path ? `/${page.path}` : ""}` } : { ar: `${root}/ar${page.path ? `/${page.path}` : ""}` },
        },
      });
    }
    for (const doctor of doctors) {
      entries.push({
        url: `${root}/${locale}/${doctor.id}`,
        changeFrequency: "monthly",
        priority: priority(locale),
        alternates: { languages: { ar: `${root}/ar/${doctor.id}`, en: `${root}/en/${doctor.id}` } },
      });
    }
    for (const article of articles) {
      entries.push({
        url: `${root}/${locale}/articles/${article.slug}`,
        lastModified: article.updatedAt,
        changeFrequency: "monthly",
        priority: priority(locale),
        alternates: {
          languages:
            locale === "ar"
              ? { en: `${root}/en/articles/${article.slug}` }
              : { ar: `${root}/ar/articles/${article.slug}` },
        },
      });
    }
  }

  return entries;
}
