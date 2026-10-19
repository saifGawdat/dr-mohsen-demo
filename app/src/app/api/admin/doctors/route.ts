import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { customAlphabet } from "nanoid";
import prisma from "@/lib/prisma";
import { getCurrentUser, unauthorized } from "@/lib/auth";

export const runtime = "nodejs";

const nano = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 6);

export const doctorSchema = z.object({
  nameEn: z.string().trim().min(2).max(160),
  nameAr: z.string().trim().min(2).max(160),
  titleEn: z.string().trim().max(200).optional().or(z.literal("")),
  titleAr: z.string().trim().max(200).optional().or(z.literal("")),
  bioEn: z.string().trim().max(5000).optional().or(z.literal("")),
  bioAr: z.string().trim().max(5000).optional().or(z.literal("")),
  hospitalEn: z.string().trim().max(200).optional().or(z.literal("")),
  hospitalAr: z.string().trim().max(200).optional().or(z.literal("")),
  photoUrl: z.string().trim().max(500).optional().or(z.literal("")),
  specialtyId: z.string().trim().max(64).optional().or(z.literal("")),
  order: z.coerce.number().int().min(0).max(9999).optional(),
  active: z.boolean().optional(),
});

export async function GET() {
  const authUser = await getCurrentUser();
  if (authUser?.role !== "ADMIN") return unauthorized();

  const doctors = await prisma.doctor.findMany({
    orderBy: [{ order: "asc" }, { nameEn: "asc" }],
    include: { specialty: { select: { id: true, nameEn: true } } },
  });

  return NextResponse.json({ doctors });
}

export async function POST(request: NextRequest) {
  const authUser = await getCurrentUser();
  if (authUser?.role !== "ADMIN") return unauthorized();

  const parsed = doctorSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid data" }, { status: 400 });
  }

  const d = parsed.data;

  const doctor = await prisma.doctor.create({
    data: {
      slug: `dr-${nano()}`,
      nameEn: d.nameEn,
      nameAr: d.nameAr,
      titleEn: d.titleEn || null,
      titleAr: d.titleAr || null,
      bioEn: d.bioEn || null,
      bioAr: d.bioAr || null,
      hospitalEn: d.hospitalEn || null,
      hospitalAr: d.hospitalAr || null,
      photoUrl: d.photoUrl || null,
      specialtyId: d.specialtyId || null,
      order: d.order ?? 0,
      active: d.active ?? true,
    },
  });

  return NextResponse.json({ doctor }, { status: 201 });
}
