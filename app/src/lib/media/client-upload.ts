import { optimizeForUpload } from "./client-optimize";
import { type ImagePurpose, maxUploadBytesFor, purposeConfig } from "./shared";

/**
 * The one path from a browser file input to a stored image.
 *
 * Shrinks the file locally, then uploads it with progress. Every admin form
 * goes through this, so there is a single place where upload behaviour is
 * defined rather than a slightly different copy on each page.
 */

export interface UploadedImage {
  id: string;
  url: string;
  width: number;
  height: number;
  sizeBytes: number;
}

export class UploadError extends Error {}

function formatMb(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

/**
 * Uses XMLHttpRequest rather than fetch purely because fetch still cannot report
 * upload progress. On a slow connection a large image otherwise looks frozen.
 */
function send(
  file: File,
  purpose: ImagePurpose,
  onProgress?: (percent: number) => void
): Promise<UploadedImage> {
  return new Promise((resolve, reject) => {
    const body = new FormData();
    body.append("file", file);
    body.append("purpose", purpose);

    const request = new XMLHttpRequest();
    request.open("POST", "/api/admin/media/upload");

    request.upload.onprogress = (event) => {
      if (!onProgress || !event.lengthComputable) return;
      onProgress(Math.round((event.loaded / event.total) * 100));
    };

    request.onload = () => {
      let payload: { url?: string; id?: string; error?: string; width?: number; height?: number; sizeBytes?: number } = {};
      try {
        payload = JSON.parse(request.responseText);
      } catch {
        // Falls through to the status check below.
      }

      if (request.status >= 200 && request.status < 300 && payload.id && payload.url) {
        resolve({
          id: payload.id,
          url: payload.url,
          width: payload.width ?? 0,
          height: payload.height ?? 0,
          sizeBytes: payload.sizeBytes ?? 0,
        });
        return;
      }

      reject(new UploadError(payload.error || "Upload failed. Please try again."));
    };

    request.onerror = () =>
      reject(new UploadError("Network error while uploading. Please try again."));
    request.onabort = () => reject(new UploadError("Upload cancelled."));

    request.send(body);
  });
}

export async function uploadImageFile(
  file: File,
  purpose: ImagePurpose,
  onProgress?: (percent: number) => void
): Promise<UploadedImage> {
  if (!file.type.startsWith("image/")) {
    throw new UploadError("That file is not an image.");
  }

  const { file: prepared } = await optimizeForUpload(file, purpose);

  // Checked after the browser pass, because that pass is usually what brings a
  // large camera photo under the limit in the first place. The limit is
  // per-purpose: a hero is encoded larger on purpose and is given room for it.
  const uploadLimit = maxUploadBytesFor(purpose);
  if (prepared.size > uploadLimit) {
    throw new UploadError(
      `Image is too large (${formatMb(prepared.size)}). Maximum is ${formatMb(uploadLimit)}.`
    );
  }

  return send(prepared, purpose, onProgress);
}

export function purposeHint(purpose: ImagePurpose): string {
  const { maxDimension, label } = purposeConfig(purpose);
  return `${label} — resized to ${maxDimension}px and converted to WebP automatically`;
}
