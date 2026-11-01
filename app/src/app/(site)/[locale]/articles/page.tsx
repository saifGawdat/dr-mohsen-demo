import type { Metadata } from "next";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { isLocale, type Locale } from "@/i18n/config";
import { getSettings } from "@/lib/settings";
import { Bi } from "@/components/site/bilingual";
import { readingMinutes } from "@/components/site/markdown";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ locale: string }>;
}

function minuteLabel(locale: Locale, minutes: number): string {
  if (locale === "ar") return minutes === 1 ? "دقيقة قراءة" : `${minutes} دقايق قراءة`;
  return minutes === 1 ? "1 min read" : `${minutes} min read`;
}

// The journal is a category-indexed list of the clinic's medical articles —
// rewritten in the clinic voice (content-source/README.md) and gated on the
// same blogEnabled setting the admin dashboard controls.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params;
  if (!isLocale(raw)) return {};
  const locale = raw as Locale;

  const title = "المقالات الطبية — عيادة PCA";
  const description =
    "مقالات في جراحة الأطفال وتخدير الأطفال وعلاج الألم، مكتوبة بلغة واضحة للأسرة — من أطباء عيادة PCA. اقرأ قبل أي قرار عملية لطفلك.";
  const titleEn = "Medical articles — PCA Clinic";
  const descriptionEn =
    "Plain-language medical articles on paediatric surgery, paediatric anaesthesia and pain care — from the PCA Clinic doctors. Read before any decision about your child's operation.";

  return {
    title: { absolute: locale === "ar" ? title : titleEn },
    description: locale === "ar" ? description : descriptionEn,
    alternates: {
      canonical: `/${locale}/articles`,
      languages: { en: "/en/articles", ar: "/ar/articles" },
    },
  };
}

export default async function ArticlesPage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const settings = await getSettings();
  if (!settings.blogEnabled) notFound();

  const posts = await prisma.blogPost.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "asc" },
    include: { category: { select: { slug: true, nameEn: true, nameAr: true } } },
  });

  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const listJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: locale === "ar" ? "المقالات الطبية — عيادة PCA" : "Medical articles — PCA Clinic",
    itemListElement: posts.map((post, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: new URL(`/${locale}/articles/${post.slug}`, base).toString(),
      name: locale === "ar" ? post.titleAr : post.titleEn,
    })),
  };

  return (
    <main className="m-art sec" id="articles">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(listJsonLd) }}
      />
      <div className="wrap">
        <div className="sec-head sec-head--split">
          <div>
            <span className="eyebrow">
              <Bi en="The journal" ar="المقالات الطبية" />
            </span>
            <h2 style={{ marginTop: 14 }}>
              <Bi
                en="Read before you decide."
                ar="اقرأ قبل ما تقرر."
              />
            </h2>
          </div>
          <p className="lead">
            <Bi
              en="Plain-language medical articles in paediatric surgery, anaesthesia and pain care — written by the clinic's doctors."
              ar="مقالات طبية في جراحة الأطفال والتخدير وعلاج الألم بلغة الأهل — من كتابة أطباء العيادة."
            />
          </p>
        </div>

        {posts.length === 0 && (
          <p className="lead">
            <Bi en="The first articles are being prepared." ar="المقالات الأولى بتتجهز." />
          </p>
        )}

        <div className="m-art__grid" data-stagger>
          {posts.map((post) => (
            <a
              className="m-art__card"
              key={post.id}
              href={`/${locale}/articles/${post.slug}`}
            >
              <span className="tag">
                <Bi en={post.category?.nameEn ?? ""} ar={post.category?.nameAr ?? ""} />
              </span>
              <b>
                <Bi en={post.titleEn} ar={post.titleAr} />
              </b>
              <p>
                <Bi en={post.excerptEn ?? ""} ar={post.excerptAr ?? ""} />
              </p>
              <span className="m-art__meta">
                {(() => {
                  const minutes = readingMinutes(locale === "ar" ? post.bodyAr ?? "" : post.bodyEn ?? "");
                  return (
                    <span>
                      {minuteLabel(locale, minutes)}
                    </span>
                  );
                })()}
                <i className="ph-light ph-arrow-right flip" aria-hidden="true" />
              </span>
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}
