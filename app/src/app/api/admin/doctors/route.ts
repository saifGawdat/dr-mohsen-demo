import { NextRequest, NextResponse } from "next/server";
import { customAlphabet } from "nanoid";
import prisma from "@/lib/prisma";
import { getCurrentUser, unauthorized } from "@/lib/auth";
import { doctorSchema } from "@/lib/admin-schemas";

export const runtime = "nodejs";

const nano = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 6);

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
