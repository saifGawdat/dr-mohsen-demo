import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, unauthorized } from "@/lib/auth";
import { specialtySchema } from "@/lib/admin-schemas";

export const runtime = "nodejs";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authUser = await getCurrentUser();
  if (authUser?.role !== "ADMIN") return unauthorized();

  const { id } = await params;

  const parsed = specialtySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid data" }, { status: 400 });
  }

  const s = parsed.data;

  const specialty = await prisma.specialty.update({
    where: { id },
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

  return NextResponse.json({ specialty });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authUser = await getCurrentUser();
  if (authUser?.role !== "ADMIN") return unauthorized();

  const { id } = await params;

  await prisma.specialty.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
