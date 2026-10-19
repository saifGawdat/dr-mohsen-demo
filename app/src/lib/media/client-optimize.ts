import {
  OUTPUT_MIME,
  type ImagePurpose,
  clientEncodeQualityFor,
  purposeConfig,
} from "./shared";

/**
 * Shrinks and re-encodes an image in the browser before it is uploaded.
 *
 * A phone camera produces 8-15 MB files that this storefront will immediately
 * resize down to at most 1920px anyway. Doing that here saves the upload, the
 * server's memory, and the decode — which matters because the server is small.
 *
 * This is an optimisation and nothing more. It is not a validation step and it
 * is not a security boundary: anyone can bypass it with a direct request, so
 * the server independently decodes, checks and re-encodes whatever arrives.
 *
 * Every failure path returns the original file rather than throwing. A browser
 * that cannot do this should still be able to upload.
 */

export interface OptimizeResult {
  file: File;
  /** True when the browser pass actually produced something smaller. */
  optimized: boolean;
  originalBytes: number;
  finalBytes: number;
}

function unchanged(file: File): OptimizeResult {
  return {
    file,
    optimized: false,
    originalBytes: file.size,
    finalBytes: file.size,
  };
}

/**
 * Decodes to something drawable.
 *
 * `createImageBitmap` is preferred because `imageOrientation: "from-image"`
 * applies the EXIF rotation flag, without which portrait phone photos come out
 * sideways. Where that option is unsupported the `<img>` path is used instead,
 * which browsers have applied EXIF orientation to by default for years.
 */
async function decode(file: File): Promise<
  { source: CanvasImageSource; width: number; height: number; release: () => void } | null
> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        release: () => bitmap.close(),
      };
    } catch {
      // Fall through to the <img> path.
    }
  }

  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("decode failed"));
      element.src = url;
    });

    return {
      source: image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      release: () => URL.revokeObjectURL(url),
    };
  } catch {
    URL.revokeObjectURL(url);
    return null;
  }
}

function encode(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), OUTPUT_MIME, quality);
  });
}

export async function optimizeForUpload(
  file: File,
  purpose: ImagePurpose
): Promise<OptimizeResult> {
  if (typeof document === "undefined") return unchanged(file);

  const decoded = await decode(file);
  if (!decoded) return unchanged(file);

  try {
    const { maxDimension } = purposeConfig(purpose);
    const longestEdge = Math.max(decoded.width, decoded.height);

    // Never upscale. A source already within budget is only re-encoded, which is
    // still usually a large win when it arrived as a JPEG or PNG.
    const scale = longestEdge > maxDimension ? maxDimension / longestEdge : 1;
    const width = Math.max(1, Math.round(decoded.width * scale));
    const height = Math.max(1, Math.round(decoded.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return unchanged(file);

    context.drawImage(decoded.source, 0, 0, width, height);

    const blob = await encode(canvas, clientEncodeQualityFor(purpose));

    // `toBlob` silently falls back to PNG when the requested type is
    // unsupported, which older Safari does for WebP. A PNG re-encode of a
    // photograph is routinely larger than the JPEG it came from, so both the
    // type and the size are checked before the result is trusted.
    if (!blob || blob.type !== OUTPUT_MIME || blob.size >= file.size) {
      return unchanged(file);
    }

    const renamed = file.name.replace(/\.[^.]+$/, "") || "image";

    return {
      file: new File([blob], `${renamed}.webp`, { type: OUTPUT_MIME }),
      optimized: true,
      originalBytes: file.size,
      finalBytes: blob.size,
    };
  } catch {
    // Out of memory on a very large image, a tainted canvas, anything at all —
    // the upload still goes ahead with the original bytes.
    return unchanged(file);
  } finally {
    decoded.release();
  }
}
