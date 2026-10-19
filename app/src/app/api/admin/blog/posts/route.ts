import { NextRequest, NextResponse } from "next/server";
import { customAlphabet } from "nanoid";
import prisma from "@/lib/prisma";
import { getCurrentUser, unauthorized } from "@/lib/auth";
import { postSchema } from "@/lib/admin-schemas";

export const runtime = "nodejs";

const nano = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 8);

export async function GET() {
  const authUser = await getCurrentUser();
  if (authUser?.role !== "ADMIN") return unauthorized();

  const posts = await prisma.blogPost.findMany({
    orderBy: { createdAt: "desc" },
    include: { category: { select: { nameEn: true } } },
  });

  return NextResponse.json({ posts });
}

export async function POST(request: NextRequest) {
  const authUser = await getCurrentUser();
  if (authUser?.role !== "ADMIN") return unauthorized();

  const parsed = postSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid data" }, { status: 400 });
  }

  const p = parsed.data;
  const published = p.status === "PUBLISHED";

  const post = await prisma.blogPost.create({
    data: {
      slug: p.slug || `${nano()}`,
      titleEn: p.titleEn,
      titleAr: p.titleAr,
      excerptEn: p.excerptEn || null,
      excerptAr: p.excerptAr || null,
      bodyEn: p.bodyEn || null,
      bodyAr: p.bodyAr || null,
      featuredImage: p.featuredImage || null,
      ogImage: p.ogImage || null,
      categoryId: p.categoryId || null,
      status: p.status ?? "DRAFT",
      publishedAt: published ? new Date() : null,
      authorId: authUser.id,
    },
  });

  return NextResponse.json({ post }, { status: 201 });
}
