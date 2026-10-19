import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  DEFAULT_PURPOSE,
  MAX_ANY_UPLOAD_BYTES,
  MAX_DOCUMENT_BYTES,
  isImagePurpose,
  maxUploadBytesFor,
} from "@/lib/media/config";
import { logError } from "@/lib/media/log";
import { uploadDocument, uploadImage } from "@/lib/media/service";
import { MediaValidationError, assertAcceptedPdf } from "@/lib/media/validate";

/** Node APIs and Sharp are both required here, so this cannot run on the edge. */
export const runtime = "nodejs";

function tooLarge(limit: number): NextResponse {
  return NextResponse.json(
    {
      error: `File too large. Maximum upload size is ${Math.round(
        limit / (1024 * 1024)
      )}MB.`,
    },
    { status: 413 }
  );
}

export async function POST(request: NextRequest) {
  const authUser = await getCurrentUser();

  if (authUser?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Checked before the body is read so an obviously oversized upload is refused
  // without buffering it. The purpose is inside the body and so is not known
  // yet, which is why this compares against the most generous limit any purpose
  // allows and the purpose's own limit is applied once the body is parsed. This
  // is only a courtesy either way: the header is absent under chunked encoding
  // and is client-supplied regardless, so the real ceiling has to be configured
  // on the reverse proxy in front of this app.
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_ANY_UPLOAD_BYTES) return tooLarge(MAX_ANY_UPLOAD_BYTES);

  let file: File | null;
  let purposeInput: string | null;

  try {
    const formData = await request.formData();
    file = formData.get("file") as File | null;
    purposeInput = formData.get("purpose") as string | null;
  } catch (error) {
    logError("upload.body.unreadable", {}, error);
    return NextResponse.json({ error: "Could not read the upload." }, { status: 400 });
  }

  if (!file || typeof file.arrayBuffer !== "function") {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // An unknown purpose falls back to the general profile rather than failing, so
  // a caller that has not been updated still gets a sensibly sized image.
  const purpose = isImagePurpose(purposeInput) ? purposeInput : DEFAULT_PURPOSE;

  // Resolved after the purpose, because a hero is allowed to be considerably
  // larger than anything else.
  const uploadLimit = maxUploadBytesFor(purpose);
  if (file.size > uploadLimit) return tooLarge(uploadLimit);

  try {
    const buffer = Buffer.from(await file.arrayBuffer());

    // PDFs ride the same Media registry as images but skip the encode
    // pipeline — a lab report is a legal record and is stored byte-exact.
    const isPdf = file.type === "application/pdf";

    if (isPdf) {
      if (buffer.byteLength > MAX_DOCUMENT_BYTES) return tooLarge(MAX_DOCUMENT_BYTES);
      assertAcceptedPdf(buffer);
      const stored = await uploadDocument(buffer, purpose);
      return NextResponse.json({
        success: true,
        id: stored.id,
        url: stored.url,
        sizeBytes: stored.sizeBytes,
      });
    }

    const stored = await uploadImage(buffer, purpose);

    return NextResponse.json({
      success: true,
      id: stored.id,
      url: stored.url,
      width: stored.width,
      height: stored.height,
      sizeBytes: stored.sizeBytes,
    });
  } catch (error) {
    if (error instanceof MediaValidationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    // Anything else is ours, not the caller's. The detail goes to the log; the
    // response says nothing about paths, disk state or stack traces.
    logError("upload.unhandled", { purpose }, error);
    return NextResponse.json(
      { error: "Failed to process the image. Please try again." },
      { status: 500 }
    );
  }
}
