import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, unauthorized } from "@/lib/auth";
import { doctorSchema } from "../route";

export const runtime = "nodejs";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authUser = await getCurrentUser();
  if (authUser?.role !== "ADMIN") return unauthorized();

  const { id } = await params;

  const parsed = doctorSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid data" }, { status: 400 });
  }

  const d = parsed.data;

  const doctor = await prisma.doctor.update({
    where: { id },
    data: {
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

  return NextResponse.json({ doctor });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authUser = await getCurrentUser();
  if (authUser?.role !== "ADMIN") return unauthorized();

  const { id } = await params;

  await prisma.doctor.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
