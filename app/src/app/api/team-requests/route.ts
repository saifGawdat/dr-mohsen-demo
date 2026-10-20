import { NextRequest, NextResponse } from "next/server";
import { customAlphabet } from "nanoid";
import prisma from "@/lib/prisma";
import { clientIp, rateLimit } from "@/lib/auth/rate-limit";
import { teamRequestSchema, firstIssue } from "@/lib/auth/validation";
import { maxUploadBytesFor } from "@/lib/media/config";
import { logError } from "@/lib/media/log";
import { uploadDocument, uploadImage } from "@/lib/media/service";
import { MediaValidationError } from "@/lib/media/validate";
import { getSettings } from "@/lib/settings";
import { sendEmail } from "@/lib/email";

export const runtime = "nodejs";

const nano = customAlphabet("23456789ABCDEFGHJKMNPQRSTUVWXYZ", 6);

/** Five submissions per address per hour. */
const LIMIT = 5;
const WINDOW_MS = 60 * 60 * 1000;

/** Largest single PDF accepted, matching the booking route. */
const MAX_PDF_BYTES = 20 * 1024 * 1024;

/**
 * Accepts both JSON (admin/API clients) and multipart (the public sheet, which
 * can attach the theatre list). Arrays are posted as JSON strings from the
 * multipart form so the shape stays identical either way.
 */
async function readPayload(request: NextRequest): Promise<{
  payload: Record<string, unknown>;
  files: File[];
} | null> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return null;
    }

    return {
      payload: {
        name: form.get("name"),
        phone: form.get("phone"),
        facility: form.get("facility"),
        facilityCity: form.get("facilityCity") || "",
        role: form.get("role") || "",
        coverage: form.get("coverage") || undefined,
        caseMix: parseStringArray(form.get("caseMix")),
        fromDate: form.get("fromDate") || "",
        toDate: form.get("toDate") || "",
        casesPerDay: form.get("casesPerDay") || undefined,
        casesPerWeek: form.get("casesPerWeek") || undefined,
        daysPerWeek: form.get("daysPerWeek") || undefined,
        notes: form.get("notes") || "",
        consent: form.get("consent") === "true" ? true : form.get("consent"),
      },
      files: form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0),
    };
  }

  try {
    return { payload: (await request.json()) as Record<string, unknown>, files: [] };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const limit = rateLimit(`team-request:${clientIp(request)}`, LIMIT, WINDOW_MS);
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Too many submissions. Please try again later." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
      );
    }

    const body = await readPayload(request);
    if (!body) {
      return NextResponse.json({ error: "Could not read the submission." }, { status: 400 });
    }

    const parsed = teamRequestSchema.safeParse(body.payload);
    if (!parsed.success) {
      return NextResponse.json(
        { error: firstIssue(parsed.error), field: parsed.error.issues[0]?.path[0] },
        { status: 400 }
      );
    }

    const { files } = body;
    if (files.length > 10) {
      return NextResponse.json({ error: "At most 10 files per request." }, { status: 400 });
    }

    for (const file of files) {
      const fileLimit = file.type === "application/pdf" ? MAX_PDF_BYTES : maxUploadBytesFor("general");
      if (file.size > fileLimit) {
        return NextResponse.json(
          { error: `"${file.name}" is too large. Maximum is ${Math.round(fileLimit / (1024 * 1024))}MB per file.` },
          { status: 413 }
        );
      }
    }

    // Buffer first so an unreadable attachment cannot half-create the request.
    const buffers = await Promise.all(
      files.map(async (file) => ({ file, buffer: Buffer.from(await file.arrayBuffer()) }))
    );

    const data = parsed.data;

    const created = await prisma.teamRequest.create({
      data: {
        number: `TR-${new Date().getFullYear()}-${nano()}`,
        name: data.name,
        phone: data.phone,
        facility: data.facility,
        facilityCity: data.facilityCity || null,
        role: data.role || null,
        coverage: data.coverage ?? null,
        caseMix: data.caseMix ?? [],
        fromDate: new Date(data.fromDate),
        toDate: data.toDate ? new Date(data.toDate) : null,
        casesPerDay: data.casesPerDay ?? null,
        casesPerWeek: data.casesPerWeek ?? null,
        daysPerWeek: data.daysPerWeek ?? null,
        notes: data.notes || null,
        consent: true,
      },
      select: { id: true, number: true },
    });

    try {
      for (const { file, buffer } of buffers) {
        const isPdf = file.type === "application/pdf";
        const stored = isPdf ? await uploadDocument(buffer) : await uploadImage(buffer, "general");

        await prisma.teamRequestUpload.create({
          data: {
            teamRequestId: created.id,
            mediaId: stored.id,
            filename: file.name,
            mimeType: isPdf ? "application/pdf" : file.type || "image/webp",
          },
        });
      }
    } catch (error) {
      logError("team-request.uploads.partial", { teamRequestId: created.id }, error);
      return NextResponse.json(
        {
          success: true,
          number: created.number,
          warning:
            error instanceof MediaValidationError
              ? error.message
              : "Some files could not be attached. We may ask for them again.",
        },
        { status: 201 }
      );
    }

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

function parseStringArray(value: FormDataEntryValue | null): string[] | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : undefined;
  } catch {
    return undefined;
  }
}
