import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, unauthorized } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  const authUser = await getCurrentUser();
  if (authUser?.role !== "ADMIN") return unauthorized();

  const messages = await prisma.contactMessage.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const subscribers = await prisma.newsletterSubscriber.findMany({
    orderBy: { subscribedAt: "desc" },
    take: 500,
  });

  return NextResponse.json({ messages, subscribers });
}
