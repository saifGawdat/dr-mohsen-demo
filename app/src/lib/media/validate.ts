import {
  ACCEPTED_INPUT_FORMATS,
  type AcceptedInputFormat,
} from "./shared";

/**
 * Format detection from the bytes themselves. The `Content-Type` header and the
 * filename are both supplied by the client and neither is evidence of anything,
 * so nothing downstream is allowed to depend on them.
 *
 * This runs before the image is handed to the decoder: it is a cheap way to
 * reject a PDF or an executable renamed to `.jpg` without paying for a decode
 * attempt.
 */

function startsWith(buffer: Buffer, bytes: number[], offset = 0): boolean {
  if (buffer.length < offset + bytes.length) return false;
  return bytes.every((byte, index) => buffer[offset + index] === byte);
}

function asciiAt(buffer: Buffer, offset: number, length: number): string {
  if (buffer.length < offset + length) return "";
  return buffer.subarray(offset, offset + length).toString("ascii");
}

/**
 * Returns the format the bytes actually are, or null if it is not something we
 * accept. Deliberately does not recognise SVG — an unrecognised format is
 * refused, which is the behaviour we want for it.
 */
export function sniffImageFormat(buffer: Buffer): AcceptedInputFormat | null {
  // JPEG: SOI marker.
  if (startsWith(buffer, [0xff, 0xd8, 0xff])) return "jpeg";

  // PNG: signature is 8 bytes and includes the CRLF/EOF trap.
  if (startsWith(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return "png";
  }

  // GIF: "GIF87a" or "GIF89a".
  const gifHeader = asciiAt(buffer, 0, 6);
  if (gifHeader === "GIF87a" || gifHeader === "GIF89a") return "gif";

  // WebP is a RIFF container whose form type is "WEBP".
  if (asciiAt(buffer, 0, 4) === "RIFF" && asciiAt(buffer, 8, 4) === "WEBP") {
    return "webp";
  }

  // AVIF is ISO-BMFF: a "ftyp" box whose major brand is avif/avis.
  if (asciiAt(buffer, 4, 4) === "ftyp") {
    const brand = asciiAt(buffer, 8, 4);
    if (brand === "avif" || brand === "avis") return "avif";
  }

  return null;
}

export class MediaValidationError extends Error {
  readonly status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "MediaValidationError";
    this.status = status;
  }
}

/**
 * Confirms the bytes are an image in a format we handle, and hands back what it
 * really is. Throws a client-safe error otherwise — the message is shown to an
 * admin, so it must never leak a filesystem path.
 */
export function assertAcceptedImage(buffer: Buffer): AcceptedInputFormat {
  const format = sniffImageFormat(buffer);

  if (!format) {
    throw new MediaValidationError(
      `Unsupported or corrupted image. Accepted formats: ${ACCEPTED_INPUT_FORMATS.join(", ").toUpperCase()}.`
    );
  }

  return format;
}

/**
 * Confirms the bytes are a PDF. A PDF header is "%PDF-" followed by a version
 * number; the check is on the leading bytes only, and the document is stored
 * byte-exact afterwards — no decoder, no re-encode.
 */
export function assertAcceptedPdf(buffer: Buffer): void {
  if (!startsWith(buffer, [0x25, 0x50, 0x44, 0x46, 0x2d])) {
    throw new MediaValidationError("Unsupported or corrupted document. Only PDF files are accepted.");
  }
}
