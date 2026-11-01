/**
 * Article seed for the PCA Clinic journal, data-only. Content is REWRITTEN in
 * the clinic voice — source material lives in ../../content-source (Dr.
 * Meliha's site harvest) and is never published verbatim.
 *
 * Bodies live outside the code as restricted-markdown resource files:
 *
 *   prisma/seed-content/articles/<slug>.ar.md
 *   prisma/seed-content/articles/<slug>.en.md
 *
 * The subset is `##`/`###` headings, `-` lists and blank-line paragraphs, with
 * **bold** emphasis. The storefront renders that subset through its own
 * parser, so nothing here is an HTML/sanitisation surface. Keeping the bodies
 * as files also means later article batches land as content, not code.
 */
import { PrismaClient } from "@prisma/client";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const CATEGORIES: { slug: string; nameEn: string; nameAr: string; order: number }[] = [
  { slug: "circumcision", nameEn: "Circumcision", nameAr: "طهارة الذكور", order: 1 },
  { slug: "hernia", nameEn: "Hernia", nameAr: "الفتق", order: 2 },
  { slug: "undescended-testis", nameEn: "Undescended testis", nameAr: "الخصية المعلقة", order: 3 },
  { slug: "hypospadias", nameEn: "Hypospadias", nameAr: "الإحليل السفلي", order: 4 },
  { slug: "tongue-tie", nameEn: "Tongue tie", nameAr: "اللسان المربوط", order: 5 },
  { slug: "pre-post", nameEn: "Before & after surgery", nameAr: "قبل وبعد الجراحة", order: 6 },
  { slug: "awareness", nameEn: "General awareness", nameAr: "توعية عامة", order: 7 },
];

interface ArticleMeta {
  slug: string;
  category: string;
  titleEn: string;
  titleAr: string;
  excerptEn: string;
  excerptAr: string;
}

export const ARTICLES: ArticleMeta[] = [
  {
    slug: "circumcision-faq",
    category: "circumcision",
    titleEn: "Circumcision for boys: the questions parents ask most",
    titleAr: "عملية طهارة الذكور — أسئلة الأهالي الأكثر شيوعاً",
    excerptEn:
      "The right age, the anaesthetic, fasting hours, home care — and the one finding that must see a paediatric surgeon before anything else.",
    excerptAr:
      "السن المناسب، التخدير وساعات الصيام، العناية بعد العملية، وواجب فيه يوقف طبيب جراح أطفال قبل أي خطوة.",
  },
  {
    slug: "inguinal-hernia-signs",
    category: "hernia",
    titleEn: "Inguinal hernia in children: signs you can catch early",
    titleAr: "علامات الفتق الإربي عند الأطفال — اكتشفها بدري",
    excerptEn:
      "The bulge that comes and goes is the giveaway sign — what it looks like, when watching closely is enough, and the red flags that mean the emergency room now.",
    excerptAr:
      "انتفاخ بيظهر ويختفي هو العلامة الأساسية — شكله إيه، ومتى المشاهدة كافية، ومتى العلامات تعني طوارئ فوراً.",
  },
];

// Bodies that exist as .ar.md/.en.md resources. An entry without a body file
// is a content gap: the seed reports it and the article stays unpublished.
async function loadBody(slug: string, locale: "ar" | "en"): Promise<string | null> {
  const file = path.join(contentDir, "articles", `${slug}.${locale}.md`);
  try {
    return (await readFile(file, "utf8")).trim() || null;
  } catch {
    return null;
  }
}

const here = path.dirname(fileURLToPath(import.meta.url));
const contentDir = path.resolve(here, "seed-content");

const prisma = new PrismaClient();

export async function seedArticles(list: ArticleMeta[] = ARTICLES) {
  for (const [index, c] of CATEGORIES.entries()) {
    await prisma.blogCategory.upsert({
      where: { slug: c.slug },
      update: { nameEn: c.nameEn, nameAr: c.nameAr, order: index + 1 },
      create: { slug: c.slug, nameEn: c.nameEn, nameAr: c.nameAr, order: index + 1 },
    });
  }
  const slugs = CATEGORIES.map((c) => c.slug);
  await prisma.blogCategory.deleteMany({ where: { slug: { notIn: slugs } } });

  const published: string[] = [];
  for (const meta of list) {
    const [bodyAr, bodyEn] = await Promise.all([loadBody(meta.slug, "ar"), loadBody(meta.slug, "en")]);
    if (!bodyAr || !bodyEn) {
      console.warn(`skipped ${meta.slug}: missing body file (${!bodyAr ? "ar" : "en"})`);
      continue;
    }
    const cat = await prisma.blogCategory.findUnique({ where: { slug: meta.category } });
    if (!cat) continue;
    const now = new Date();
    const values = {
      titleEn: meta.titleEn,
      titleAr: meta.titleAr,
      excerptEn: meta.excerptEn,
      excerptAr: meta.excerptAr,
      bodyEn,
      bodyAr,
      status: "PUBLISHED" as const,
      publishedAt: now,
      categoryId: cat.id,
    };
    await prisma.blogPost.upsert({
      where: { slug: meta.slug },
      update: values,
      create: { slug: meta.slug, ...values },
    });
    published.push(meta.slug);
  }

  const stale = await prisma.blogPost.findMany({
    where: { slug: { notIn: published } },
    select: { slug: true, titleAr: true },
  });
  // Rows never harvested into the approved backlog are pruned; rows whose
  // body files are missing mid-batch get unpublished instead, so nothing is
  // deleted just because a file went away.
  for (const post of stale) {
    const everListed = list.some((meta) => meta.slug === post.slug);
    if (everListed) {
      await prisma.blogPost.update({ where: { slug: post.slug }, data: { status: "DRAFT" } });
    } else {
      await prisma.blogPost.delete({ where: { slug: post.slug } });
    }
  }

  const publishedCount = await prisma.blogPost.count({ where: { status: "PUBLISHED" } });
  console.log(
    `Article seed complete: ${published.length} handled, ${publishedCount} published.`
  );
}
