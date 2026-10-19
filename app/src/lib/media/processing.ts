import sharp from "sharp";
import {
  DIMENSION_FALLBACKS,
  OUTPUT_FORMAT,
  type ImagePurpose,
  encodeEffortFor,
  maxInputPixels,
  purposeConfig,
  qualityLadderFor,
} from "./config";
import { logInfo } from "./log";
import { MediaValidationError, assertAcceptedImage } from "./validate";

/**
 * Sharp keeps decoded images in a process-wide cache by default. That is a good
 * trade on a machine with spare memory and the wrong one here: uploads are rare,
 * the images are large, and holding them serves nobody. Concurrency is pinned to
 * one for the same reason — the libvips thread pool would otherwise decode
 * several full-size images at once and spike resident memory.
 */
sharp.cache(false);
sharp.concurrency(1);

export interface ProcessedImage {
  data: Buffer;
  width: number;
  height: number;
  /** Quality the encoder settled on, for logging when it had to step down. */
  quality: number;
  /** True when the result is still over the purpose's ceiling. */
  overCeiling: boolean;
}

/**
 * Decodes, shrinks and re-encodes an upload into the one format we store.
 *
 * Runs entirely in memory and returns a buffer — writing is somebody else's job,
 * so a failure here cannot leave anything on disk.
 */
export async function processImage(
  input: Buffer,
  purpose: ImagePurpose
): Promise<ProcessedImage> {
  // Confirms the bytes are an image we handle before the decoder sees them.
  assertAcceptedImage(input);

  const config = purposeConfig(purpose);
  const pixelLimit = maxInputPixels();
  // Both are per-purpose: heroes are encoded higher and harder than everything
  // else, so the ladder and the effort are read from the config, not fixed here.
  const qualityLadder = qualityLadderFor(purpose);
  const effort = encodeEffortFor(purpose);

  // The probe deliberately does NOT set `limitInputPixels`. Reading metadata only
  // parses the header and decodes nothing, so it is cheap at any declared size —
  // and letting it succeed is what allows an oversized image to be reported as
  // "too large" instead of being lumped in with genuinely corrupt files.
  const probe = sharp(input, {
    limitInputPixels: false,
    // Multi-frame inputs are flattened to their first frame — everything stored
    // here is a still image.
    animated: false,
    failOn: "error",
  });

  // `null` rather than a throw so an unreadable header and a malformed file are
  // reported to the admin the same way.
  const metadata = await probe.metadata().catch(() => null);

  if (!metadata) {
    throw new MediaValidationError("Image could not be read. It may be corrupted.");
  }

  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;

  if (width < 1 || height < 1) {
    throw new MediaValidationError("Image reports no usable dimensions.");
  }

  if (width * height > pixelLimit) {
    throw new MediaValidationError(
      `Image is too large to process (${width}x${height}). Maximum is ${Math.floor(
        pixelLimit / 1_000_000
      )} megapixels.`
    );
  }

  let best: { data: Buffer; width: number; height: number; quality: number } | null = null;

  // Two nested levers, cheapest first: drop quality at full size, and only if
  // that is not enough, shrink and try again. Most images settle on the very
  // first attempt and pay for exactly one encode.
  for (const scale of DIMENSION_FALLBACKS) {
    const targetEdge = Math.max(1, Math.round(config.maxDimension * scale));

    for (const quality of qualityLadder) {
      const encoded = await sharp(input, {
        limitInputPixels: pixelLimit,
        animated: false,
        failOn: "error",
      })
        // Applies the EXIF orientation flag before resizing. Without this, phone
        // photos are stored rotated.
        .rotate()
        .resize({
          width: targetEdge,
          height: targetEdge,
          fit: "inside",
          // Never upscale: a small source stays small rather than being padded
          // out into a bigger file with no more detail in it.
          withoutEnlargement: true,
        })
        // Metadata is dropped on encode unless explicitly kept, which is what we
        // want — camera files carry the GPS coordinates they were taken at, and
        // those must not ship to the storefront.
        .toFormat(OUTPUT_FORMAT, { quality, effort })
        .toBuffer({ resolveWithObject: true });

      best = {
        data: encoded.data,
        width: encoded.info.width,
        height: encoded.info.height,
        quality,
      };

      if (encoded.data.byteLength <= config.maxStoredBytes) {
        return { ...best, overCeiling: false };
      }
    }
  }

  if (!best) {
    throw new MediaValidationError("Image could not be encoded.", 500);
  }

  // Every lever exhausted and it still does not fit. The image is stored rather
  // than rejected — refusing an admin's photograph outright is worse than an
  // oversized file — but this is logged so it is visible rather than silent.
  logInfo("process.over_ceiling", {
    purpose,
    bytes: best.data.byteLength,
    ceiling: config.maxStoredBytes,
    width: best.width,
    height: best.height,
    quality: best.quality,
  });

  return { ...best, overCeiling: true };
}
