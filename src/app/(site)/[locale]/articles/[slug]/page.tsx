import type { Metadata } from "next";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { isLocale, type Locale } from "@/i18n/config";
import { getSettings } from "@/lib/settings";
import { Bi } from "@/components/site/bilingual";
import { renderMarkdown, readingMinutes } from "@/components/site/markdown";
import { waLink } from "@/lib/site-format";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw, slug } = await params;
  if (!isLocale(raw)) return {};
  const locale = raw as Locale;

  const post = await prisma.blogPost.findUnique({
    where: { slug },
    select: {
      slug: true,
      titleEn: true, titleAr: true,
      excerptEn: true, excerptAr: true,
      status: true, publishedAt: true,
      category: { select: { slug: true } },
    },
  });
  if (!post || post.status !== "PUBLISHED") return {};

  const title = locale === "ar" ? post.titleAr : post.titleEn;
  const description = (locale === "ar" ? post.excerptAr : post.excerptEn) ?? undefined;

  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical: `/${locale}/articles/${post.slug}`,
      languages: {
        en: `/en/articles/${post.slug}`,
        ar: `/ar/articles/${post.slug}`,
      },
    },
    openGraph: {
      type: "article",
      title,
      description,
      publishedTime: post.publishedAt?.toISOString(),
      images: [{ url: "/brand/pca-og.png" }],
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { locale: raw, slug } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;

  const post = await prisma.blogPost.findUnique({
    where: { slug },
    include: {
      category: { select: { slug: true, nameEn: true, nameAr: true } },
      author: { select: { name: true } },
    },
  });
  if (!post || post.status !== "PUBLISHED") notFound();
  if (!(await getSettings()).blogEnabled) notFound();

  const related = await prisma.blogPost.findMany({
    where: { status: "PUBLISHED", categoryId: post.categoryId, slug: { not: post.slug } },
    orderBy: { publishedAt: "desc" },
    select: { slug: true, titleEn: true, titleAr: true },
    take: 3,
  });

  const settings = await getSettings();
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const abs = (p: string) => new URL(p, base).toString();
  const whatsapp = settings.whatsappEnabled ? settings.whatsappNumber : null;
  const title = locale === "ar" ? post.titleAr : post.titleEn;
  const excerpt = (locale === "ar" ? post.excerptAr : post.excerptEn) ?? "";
  const body = locale === "ar" ? post.bodyAr : post.bodyEn;
  const minutes = readingMinutes(body ?? "");
  const authorName = post.author?.name ?? null;

  // Structured data: the page and its place in the site, plus the article
  // record itself. All values come from our own rows — no user-supplied HTML.
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: title,
      description: excerpt || undefined,
      inLanguage: locale,
      datePublished: post.publishedAt?.toISOString(),
      author: authorName
        ? { "@type": "Person", name: authorName }
        : {
            "@type": "Organization",
            name: "PCA Clinic — Pain Comfort Assessment Clinic",
          },
      publisher: {
        "@type": "Organization",
        name: "PCA Clinic — Pain Comfort Assessment Clinic",
        logo: { "@type": "ImageObject", url: abs("/brand/pca-logo-mark-512.png") },
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: locale === "ar" ? "الرئيسية" : "Home", item: abs(`/${locale}`) },
        { "@type": "ListItem", position: 2, name: locale === "ar" ? "المقالات" : "Articles", item: abs(`/${locale}/articles`) },
        { "@type": "ListItem", position: 3, name: title, item: abs(`/${locale}/articles/${post.slug}`) },
      ],
    },
  ];

  return (
    <main className="m-artr sec" itemScope itemType="https://schema.org/Article">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="wrap m-artr__wrap">
        <nav className="m-artr__crumbs" aria-label="breadcrumb">
          <a href={`/${locale}`}>
            <Bi en="Home" ar="الرئيسية" />
          </a>
          <span aria-hidden="true">/</span>
          <a href={`/${locale}/articles`}>
            <Bi en="Articles" ar="المقالات" />
          </a>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{title}</span>
        </nav>

        <article>
          <header className="m-artr__head">
            {post.category && (
              <span className="tag">
                <Bi en={post.category.nameEn} ar={post.category.nameAr} />
              </span>
            )}
            <h1 itemProp="headline">{title}</h1>
            <p className="lead" itemProp="description">{excerpt}</p>
            <p className="m-artr__meta">
              <i className="ph-light ph-user" aria-hidden="true" />{" "}
              {authorName || <Bi en="The clinical team" ar="الفريق الطبي" />}{" "}
              ·{" "}
              <Bi
                en={minutes === 1 ? "1 min read" : `${minutes} min read`}
                ar={minutes === 1 ? "دقيقة قراءة" : `${minutes} دقايق قراءة`}
              />
            </p>
          </header>

          <div className="m-artr__body" itemProp="articleBody">
            {renderMarkdown(body ?? "")}
          </div>

          <aside className="m-artr__cta">
            <h3>
              <Bi
                en="A question about your child's case?"
                ar="عندك سؤال عن حالة طفلك؟"
              />
            </h3>
            <p>
              <Bi
                en="Booking goes through the clinic — the doctor reviews your file on WhatsApp before the visit."
                ar="الحجز من خلال العيادة — والدكتور بيراجع ملفك على واتساب قبل الكشف."
              />
            </p>
            {whatsapp && (
              <a
                className="btn btn--wa"
                href={waLink(
                  whatsapp,
                  locale === "ar"
                    ? `السلام عليكم، مع عيادة PCA. أرسل عبر مقال: ${title}`
                    : `Hello PCA Clinic — I sent this via the article: ${title}`
                )}
                target="_blank"
                rel="noopener"
              >
                <i className="ph-fill ph-whatsapp-logo" aria-hidden="true" />
                <Bi en="Chat on WhatsApp" ar="كلّمنا واتساب" />
              </a>
            )}
          </aside>

          {related.length > 0 && (
            <section className="m-artr__related">
              <h3>
                <Bi en="Related articles" ar="مقالات ذات صلة" />
              </h3>
              <ul>
                {related.map((rel) => (
                  <li key={rel.slug}>
                    <a href={`/${locale}/articles/${rel.slug}`}>
                      <Bi en={rel.titleEn} ar={rel.titleAr} />
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </article>
      </div>
    </main>
  );
}
