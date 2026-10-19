import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, unauthorized } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const authUser = await getCurrentUser();
  if (authUser?.role !== "ADMIN") return unauthorized();

  const status = request.nextUrl.searchParams.get("status");
  const q = request.nextUrl.searchParams.get("q");

  const rows = await prisma.teamRequest.findMany({
    where: {
      ...(status && ["NEW", "CONFIRMED", "DONE", "CANCELLED"].includes(status)
        ? { status: status as "NEW" | "CONFIRMED" | "DONE" | "CANCELLED" }
        : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { phone: { contains: q } },
              { facility: { contains: q, mode: "insensitive" } },
              { number: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json({ teamRequests: rows });
}
