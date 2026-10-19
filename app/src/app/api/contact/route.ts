import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { clientIp, rateLimit } from "@/lib/auth/rate-limit";
import { contactSchema, firstIssue } from "@/lib/auth/validation";

export const runtime = "nodejs";

/** Five messages per address per hour. */
const LIMIT = 5;
const WINDOW_MS = 60 * 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    const limit = rateLimit(`contact:${clientIp(request)}`, LIMIT, WINDOW_MS);
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Too many submissions. Please try again later." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
      );
    }

    const parsed = contactSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: firstIssue(parsed.error), field: parsed.error.issues[0]?.path[0] },
        { status: 400 }
      );
    }

    await prisma.contactMessage.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email || null,
        phone: parsed.data.phone || null,
        message: parsed.data.message,
      },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Contact error:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
