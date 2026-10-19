import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, unauthorized } from "@/lib/auth";
import { faqSchema } from "../route";

export const runtime = "nodejs";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authUser = await getCurrentUser();
  if (authUser?.role !== "ADMIN") return unauthorized();

  const { id } = await params;

  const parsed = faqSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid data" }, { status: 400 });
  }

  const f = parsed.data;

  const faq = await prisma.faq.update({
    where: { id },
    data: {
      questionEn: f.questionEn,
      questionAr: f.questionAr,
      answerEn: f.answerEn,
      answerAr: f.answerAr,
      order: f.order ?? 0,
      active: f.active ?? true,
    },
  });

  return NextResponse.json({ faq });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authUser = await getCurrentUser();
  if (authUser?.role !== "ADMIN") return unauthorized();

  const { id } = await params;

  await prisma.faq.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
