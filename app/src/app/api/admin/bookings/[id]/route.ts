import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getCurrentUser, unauthorized } from "@/lib/auth";
import { mediaUrl } from "@/lib/media/config";

export const runtime = "nodejs";

const patchSchema = z.object({
  status: z.enum(["NEW", "CONFIRMED", "DONE", "CANCELLED"]).optional(),
  adminNotes: z.string().trim().max(5000).optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authUser = await getCurrentUser();
  if (authUser?.role !== "ADMIN") return unauthorized();

  const { id } = await params;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      doctor: { select: { nameEn: true, nameAr: true } },
      specialty: { select: { nameEn: true, nameAr: true } },
      uploads: {
        select: {
          id: true,
          filename: true,
          mimeType: true,
          media: { select: { id: true, storageKey: true, mimeType: true } },
        },
      },
    },
  });

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  return NextResponse.json({
    booking: {
      ...booking,
      uploads: booking.uploads.map((u) => ({
        id: u.id,
        filename: u.filename,
        mimeType: u.mimeType,
        url: u.media.storageKey ? mediaUrl(u.media.storageKey) : null,
      })),
    },
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authUser = await getCurrentUser();
  if (authUser?.role !== "ADMIN") return unauthorized();

  const { id } = await params;

  const parsed = patchSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid update" }, { status: 400 });
  }

  const booking = await prisma.booking.update({
    where: { id },
    data: parsed.data,
    select: { id: true, status: true, adminNotes: true },
  });

  return NextResponse.json({ booking });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authUser = await getCurrentUser();
  if (authUser?.role !== "ADMIN") return unauthorized();

  const { id } = await params;

  await prisma.booking.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
