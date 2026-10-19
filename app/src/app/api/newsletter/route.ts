import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { clientIp, rateLimit } from "@/lib/auth/rate-limit";
import { newsletterSchema, firstIssue } from "@/lib/auth/validation";

export const runtime = "nodejs";

/** Ten subscriptions per address per hour. */
const LIMIT = 10;
const WINDOW_MS = 60 * 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    const limit = rateLimit(`newsletter:${clientIp(request)}`, LIMIT, WINDOW_MS);
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Too many submissions. Please try again later." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
      );
    }

    const parsed = newsletterSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 });
    }

    // Re-subscribing an existing address is a success, not an error — the
    // visitor does not care whether they were already on the list.
    await prisma.newsletterSubscriber.upsert({
      where: { email: parsed.data.email },
      update: {},
      create: { email: parsed.data.email },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Newsletter error:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
