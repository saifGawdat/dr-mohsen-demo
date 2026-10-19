import { NextRequest, NextResponse } from "next/server";
import { customAlphabet } from "nanoid";
import prisma from "@/lib/prisma";
import { clientIp, rateLimit } from "@/lib/auth/rate-limit";
import { teamRequestSchema, firstIssue } from "@/lib/auth/validation";
import { getSettings } from "@/lib/settings";
import { sendEmail } from "@/lib/email";

export const runtime = "nodejs";

const nano = customAlphabet("23456789ABCDEFGHJKMNPQRSTUVWXYZ", 6);

/** Five submissions per address per hour. */
const LIMIT = 5;
const WINDOW_MS = 60 * 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    const limit = rateLimit(`team-request:${clientIp(request)}`, LIMIT, WINDOW_MS);
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Too many submissions. Please try again later." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
      );
    }

    const parsed = teamRequestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: firstIssue(parsed.error), field: parsed.error.issues[0]?.path[0] },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const created = await prisma.teamRequest.create({
      data: {
        number: `TR-${new Date().getFullYear()}-${nano()}`,
        name: data.name,
        phone: data.phone,
        facility: data.facility,
        facilityCity: data.facilityCity || null,
        role: data.role || null,
        fromDate: new Date(data.fromDate),
        toDate: data.toDate ? new Date(data.toDate) : null,
        casesPerDay: data.casesPerDay ?? null,
        daysPerWeek: data.daysPerWeek ?? null,
        notes: data.notes || null,
        consent: true,
      },
      select: { number: true },
    });

    // Best-effort notification, same policy as bookings.
    void (async () => {
      try {
        const settings = await getSettings();
        if (settings.bookingNotifyEmail) {
          await sendEmail({
            to: settings.bookingNotifyEmail,
            subject: `New team request ${created.number}`,
            html: `<p><b>${data.facility}</b> (${data.facilityCity || "—"}) requested anaesthesia cover from <b>${data.fromDate}</b>.</p><p>${data.name} — ${data.phone}</p>`,
          });
        }
      } catch {
        /* logged by sendEmail */
      }
    })();

    return NextResponse.json({ success: true, number: created.number }, { status: 201 });
  } catch (error) {
    console.error("Team request error:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
