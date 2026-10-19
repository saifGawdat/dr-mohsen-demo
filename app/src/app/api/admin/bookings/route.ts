import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, unauthorized } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const authUser = await getCurrentUser();
  if (authUser?.role !== "ADMIN") return unauthorized();

  const status = request.nextUrl.searchParams.get("status");
  const q = request.nextUrl.searchParams.get("q");

  const rows = await prisma.booking.findMany({
    where: {
      ...(status && ["NEW", "CONFIRMED", "DONE", "CANCELLED"].includes(status)
        ? { status: status as "NEW" | "CONFIRMED" | "DONE" | "CANCELLED" }
        : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { phone: { contains: q } },
              { number: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      number: true,
      name: true,
      phone: true,
      age: true,
      complaint: true,
      preferredDate: true,
      status: true,
      createdAt: true,
      specialty: { select: { nameEn: true } },
      doctor: { select: { nameEn: true } },
      _count: { select: { uploads: true } },
    },
  });

  return NextResponse.json({ bookings: rows });
}
