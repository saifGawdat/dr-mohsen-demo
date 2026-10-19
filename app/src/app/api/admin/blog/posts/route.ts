import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { customAlphabet } from "nanoid";
import prisma from "@/lib/prisma";
import { getCurrentUser, unauthorized } from "@/lib/auth";

export const runtime = "nodejs";

const nano = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 8);

export const postSchema = z.object({
  slug: z
    .string()
    .trim()
    .max(200)
    .regex(/^[a-z0-9-]*$/, "Slug must be lowercase letters, numbers and dashes")
    .optional(),
  titleEn: z.string().trim().min(2).max(300),
  titleAr: z.string().trim().min(2).max(300),
  excerptEn: z.string().trim().max(1000).optional().or(z.literal("")),
  excerptAr: z.string().trim().max(1000).optional().or(z.literal("")),
  bodyEn: z.string().trim().max(100000).optional().or(z.literal("")),
  bodyAr: z.string().trim().max(100000).optional().or(z.literal("")),
  featuredImage: z.string().trim().max(500).optional().or(z.literal("")),
  ogImage: z.string().trim().max(500).optional().or(z.literal("")),
  categoryId: z.string().trim().max(64).optional().or(z.literal("")),
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
});

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
