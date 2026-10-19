import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getCurrentUser, unauthorized } from "@/lib/auth";

export const runtime = "nodejs";

const patchSchema = z.object({
  status: z.enum(["NEW", "CONFIRMED", "DONE", "CANCELLED"]).optional(),
  adminNotes: z.string().trim().max(5000).optional(),
});

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

  const teamRequest = await prisma.teamRequest.update({
    where: { id },
    data: parsed.data,
    select: { id: true, status: true, adminNotes: true },
  });

  return NextResponse.json({ teamRequest });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authUser = await getCurrentUser();
  if (authUser?.role !== "ADMIN") return unauthorized();

  const { id } = await params;

  await prisma.teamRequest.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
