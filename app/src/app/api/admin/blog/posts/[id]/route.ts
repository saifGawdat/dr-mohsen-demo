import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, unauthorized } from "@/lib/auth";
import { postSchema } from "../route";

export const runtime = "nodejs";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authUser = await getCurrentUser();
  if (authUser?.role !== "ADMIN") return unauthorized();

  const { id } = await params;

  const parsed = postSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid data" }, { status: 400 });
  }

  const p = parsed.data;
  const published = p.status === "PUBLISHED";

  // Set publishedAt the first time a post goes out; never stamp it again.
  const existing = await prisma.blogPost.findUnique({
    where: { id },
    select: { publishedAt: true },
  });

  const post = await prisma.blogPost.update({
    where: { id },
    data: {
      slug: p.slug || undefined,
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
      publishedAt: published ? existing?.publishedAt ?? new Date() : null,
    },
  });

  return NextResponse.json({ post });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authUser = await getCurrentUser();
  if (authUser?.role !== "ADMIN") return unauthorized();

  const { id } = await params;

  await prisma.blogPost.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
