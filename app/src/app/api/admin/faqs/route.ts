import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, unauthorized } from "@/lib/auth";
import { faqSchema } from "@/lib/admin-schemas";

export const runtime = "nodejs";

export async function GET() {
  const authUser = await getCurrentUser();
  if (authUser?.role !== "ADMIN") return unauthorized();

  const faqs = await prisma.faq.findMany({
    orderBy: [{ order: "asc" }, { questionEn: "asc" }],
  });

  return NextResponse.json({ faqs });
}

export async function POST(request: NextRequest) {
  const authUser = await getCurrentUser();
  if (authUser?.role !== "ADMIN") return unauthorized();

  const parsed = faqSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid data" }, { status: 400 });
  }

  const f = parsed.data;

  const faq = await prisma.faq.create({
    data: {
      questionEn: f.questionEn,
      questionAr: f.questionAr,
      answerEn: f.answerEn,
      answerAr: f.answerAr,
      order: f.order ?? 0,
      active: f.active ?? true,
    },
  });

  return NextResponse.json({ faq }, { status: 201 });
}
