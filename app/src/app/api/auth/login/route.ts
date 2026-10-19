import { NextRequest, NextResponse } from "next/server";
import { login } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/auth/rate-limit";
import { loginSchema } from "@/lib/auth/validation";

/** Ten attempts per address per fifteen minutes. */
const LIMIT = 10;
const WINDOW_MS = 15 * 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    const limit = rateLimit(`login:${clientIp(request)}`, LIMIT, WINDOW_MS);
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Too many sign-in attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
      );
    }

    const parsed = loginSchema.safeParse(await request.json());
    if (!parsed.success) {
      // Deliberately generic: a field-level complaint here would confirm
      // whether a given address is registered.
      return NextResponse.json({ error: "Invalid email or password" }, { status: 400 });
    }

    const user = await login(parsed.data.email, parsed.data.password);
    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
