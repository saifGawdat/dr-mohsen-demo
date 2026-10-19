import { NextRequest, NextResponse } from "next/server";
import { customAlphabet } from "nanoid";
import prisma from "@/lib/prisma";
import { clientIp, rateLimit } from "@/lib/auth/rate-limit";
import { bookingSchema, firstIssue } from "@/lib/auth/validation";
import { maxUploadBytesFor } from "@/lib/media/config";
import { logError } from "@/lib/media/log";
import { uploadDocument, uploadImage } from "@/lib/media/service";
import { MediaValidationError } from "@/lib/media/validate";
import { getSettings } from "@/lib/settings";
import { sendEmail } from "@/lib/email";

export const runtime = "nodejs";

const nano = customAlphabet("23456789ABCDEFGHJKMNPQRSTUVWXYZ", 6);

/** Five submissions per address per hour — a real patient books a handful a year. */
const LIMIT = 5;
const WINDOW_MS = 60 * 60 * 1000;

/** Largest single file accepted: 20MB for documents, the image ceiling otherwise. */
const MAX_PDF_BYTES = 20 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const limit = rateLimit(`booking:${clientIp(request)}`, LIMIT, WINDOW_MS);
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Too many submissions. Please try again later." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
      );
    }

    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return NextResponse.json({ error: "Could not read the submission." }, { status: 400 });
    }

    const raw = {
      name: form.get("name"),
      phone: form.get("phone"),
      age: form.get("age") || undefined,
      complaint: form.get("complaint") || "",
      preferredDate: form.get("preferredDate") || "",
      doctorId: form.get("doctorId") || "",
      specialtySlug: form.get("specialtySlug") || "",
      notes: form.get("notes") || "",
      // A missing box fails the literal-true check, so consent is enforced.
      consent: form.get("consent") === "true" ? true : form.get("consent"),
    };

    const parsed = bookingSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: firstIssue(parsed.error), field: parsed.error.issues[0]?.path[0] },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Resolve the optional doctor/specialty links. Unknown ids are ignored
    // rather than rejected — the form may have been open while an admin edited
    // the directory.
    const doctorId = data.doctorId
      ? (
          await prisma.doctor.findUnique({
            where: { id: data.doctorId },
            select: { id: true },
          })
        )?.id ?? null
      : null;

    const specialtyId = data.specialtySlug
      ? (
          await prisma.specialty.findUnique({
            where: { slug: data.specialtySlug },
            select: { id: true },
          })
        )?.id ?? null
      : null;

    const files = form
      .getAll("files")
      .filter((f): f is File => f instanceof File && f.size > 0);

    if (files.length > 10) {
      return NextResponse.json({ error: "At most 10 files per booking." }, { status: 400 });
    }

    for (const file of files) {
      const limit = file.type === "application/pdf" ? MAX_PDF_BYTES : maxUploadBytesFor("general");
      if (file.size > limit) {
        return NextResponse.json(
          { error: `"${file.name}" is too large. Maximum is ${Math.round(limit / (1024 * 1024))}MB per file.` },
          { status: 413 }
        );
      }
    }

    // Buffer everything before creating any row, so an unreadable file fails
    // the whole submission rather than half-completing it.
    const buffers = await Promise.all(
      files.map(async (file) => ({
        file,
        buffer: Buffer.from(await file.arrayBuffer()),
      }))
    );

    const booking = await prisma.booking.create({
      data: {
        number: `BK-${new Date().getFullYear()}-${nano()}`,
        name: data.name,
        phone: data.phone,
        age: data.age ?? null,
        complaint: data.complaint || null,
        preferredDate: data.preferredDate ? new Date(data.preferredDate) : null,
        notes: data.notes || null,
        consent: true,
        doctorId,
        specialtyId,
      },
      select: { id: true, number: true },
    });

    try {
      for (const { file, buffer } of buffers) {
        const isPdf = file.type === "application/pdf";

        const stored = isPdf
          ? await uploadDocument(buffer)
          : await uploadImage(buffer, "general");

        await prisma.bookingUpload.create({
          data: {
            bookingId: booking.id,
            mediaId: stored.id,
            filename: file.name,
            mimeType: isPdf ? "application/pdf" : file.type || "image/webp",
          },
        });
      }
    } catch (error) {
      // The booking itself is kept — the patient's request must not vanish
      // because an attachment failed. The error is surfaced so the UI can tell
      // them which part landed.
      logError("booking.uploads.partial", { bookingId: booking.id }, error);
      if (error instanceof MediaValidationError) {
        return NextResponse.json(
          {
            success: true,
            number: booking.number,
            warning: error.message,
          },
          { status: 201 }
        );
      }
      return NextResponse.json(
        {
          success: true,
          number: booking.number,
          warning: "Some files could not be attached. We may ask for them again.",
        },
        { status: 201 }
      );
    }

    // Fire-and-forget notification to the clinic. A failed email must never
    // fail the booking.
    void notifyClinic(booking.number, data.name, data.phone, data.complaint || "");

    return NextResponse.json({ success: true, number: booking.number }, { status: 201 });
  } catch (error) {
    logError("booking.create.failed", {}, error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}

/** Notifies the clinic of a new booking. Best-effort — see the call site. */
async function notifyClinic(
  number: string,
  name: string,
  phone: string,
  complaint: string
): Promise<void> {
  try {
    const settings = await getSettings();
    if (settings.bookingNotifyEmail) {
      await sendEmail({
        to: settings.bookingNotifyEmail,
        subject: `New booking ${number}`,
        html: `<p><b>${escapeHtml(name)}</b> (${escapeHtml(phone)}) booked online.</p><p>${escapeHtml(complaint)}</p>`,
      });
    }
  } catch {
    // logged by sendEmail; nothing else to do
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
