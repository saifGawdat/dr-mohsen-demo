import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getCurrentUser, unauthorized } from "@/lib/auth";

export const runtime = "nodejs";

export const specialtySchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2)
    .max(64)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers and dashes"),
  nameEn: z.string().trim().min(2).max(160),
  nameAr: z.string().trim().min(2).max(160),
  descriptionEn: z.string().trim().max(2000).optional().or(z.literal("")),
  descriptionAr: z.string().trim().max(2000).optional().or(z.literal("")),
  order: z.coerce.number().int().min(0).max(9999).optional(),
  active: z.boolean().optional(),
});

export async function GET() {
  const authUser = await getCurrentUser();
  if (authUser?.role !== "ADMIN") return unauthorized();

  const specialties = await prisma.specialty.findMany({
    orderBy: [{ order: "asc" }, { nameEn: "asc" }],
    include: { _count: { select: { doctors: true } } },
  });

  return NextResponse.json({ specialties });
}

export async function POST(request: NextRequest) {
  const authUser = await getCurrentUser();
  if (authUser?.role !== "ADMIN") return unauthorized();

  const parsed = specialtySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid data" }, { status: 400 });
  }

  const s = parsed.data;

  const specialty = await prisma.specialty.create({
    data: {
      slug: s.slug,
      nameEn: s.nameEn,
      nameAr: s.nameAr,
      descriptionEn: s.descriptionEn || null,
      descriptionAr: s.descriptionAr || null,
      order: s.order ?? 0,
      active: s.active ?? true,
    },
  });

  return NextResponse.json({ specialty }, { status: 201 });
}
