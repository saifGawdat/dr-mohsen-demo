import prisma from "@/lib/prisma";
import {
  DEFAULT_PURPOSE,
  DOCUMENT_MIME,
  OUTPUT_MIME,
  type ImagePurpose,
  documentKeyForId,
  mediaUrl,
  storageKeyForId,
} from "./config";
import { logError, logInfo } from "./log";
import { processImage } from "./processing";
import { filesystemStorage, type ImageStorage } from "./storage";
import { MediaValidationError } from "./validate";

export interface StoredImage {
  id: string;
  url: string;
  width: number;
  height: number;
  sizeBytes: number;
}

export interface StoredDocument {
  id: string;
  url: string;
  sizeBytes: number;
}

/**
 * Stores an uploaded image.
 *
 * The order of operations is the point of this function. A row is inserted as
 * PENDING before any bytes are written, and only flips to READY once the file is
 * on disk. So the failure modes are:
 *
 *   crash before the write   -> PENDING row, no file        (swept, harmless)
 *   crash during the write   -> PENDING row, no file        (the write is atomic)
 *   crash after the write    -> PENDING row, file present   (swept, harmless)
 *   crash after the update   -> nothing wrong
 *
 * What cannot happen is a file with no row. That state is invisible: nothing can
 * tell whether such a file is in use, so it can never be safely reclaimed and
 * simply consumes disk forever. Every other inconsistency here is detectable and
 * recoverable, which is why the ordering leans this way.
 *
 * A failed upload deliberately leaves its PENDING row behind rather than
 * deleting it inline — an inline cleanup is just another step that can fail, and
 * the sweep already handles exactly this case.
 */
export async function uploadImage(
  input: Buffer,
  purpose: ImagePurpose = DEFAULT_PURPOSE,
  storage: ImageStorage = filesystemStorage
): Promise<StoredImage> {
  // 1. Reserve the row. Nothing exists on disk yet.
  const record = await prisma.media.create({
    data: { purpose, status: "PENDING" },
    select: { id: true },
  });

  const storageKey = storageKeyForId(record.id);

  try {
    // 2. Decode, shrink and re-encode, entirely in memory.
    const processed = await processImage(input, purpose);

    // 3. Write. Atomic: either the whole file lands or nothing does.
    await storage.write(storageKey, processed.data);

    // 4. Publish. Until this succeeds the row is invisible to the application.
    await prisma.media.update({
      where: { id: record.id },
      data: {
        status: "READY",
        storageKey,
        mimeType: OUTPUT_MIME,
        sizeBytes: processed.data.byteLength,
        width: processed.width,
        height: processed.height,
      },
    });

    logInfo("upload.ok", {
      id: record.id,
      purpose,
      bytes: processed.data.byteLength,
      width: processed.width,
      height: processed.height,
      quality: processed.quality,
      inputBytes: input.byteLength,
    });

    return {
      id: record.id,
      url: mediaUrl(storageKey),
      width: processed.width,
      height: processed.height,
      sizeBytes: processed.data.byteLength,
    };
  } catch (error) {
    // The row stays PENDING on purpose. See the note above.
    logError(
      "upload.failed",
      {
        id: record.id,
        purpose,
        inputBytes: input.byteLength,
        validation: error instanceof MediaValidationError,
      },
      error
    );
    throw error;
  }
}

/**
 * Stores an uploaded PDF document, byte-exact.
 *
 * Same PENDING-before-write ordering as `uploadImage` — the failure modes and
 * the reasoning are identical, and a document is a legal record, so unlike an
 * image there is no decode step at all: the bytes that arrived are the bytes
 * that are stored. An unsupported payload never reaches here; the route
 * validates before calling.
 */
export async function uploadDocument(
  input: Buffer,
  purpose: ImagePurpose = DEFAULT_PURPOSE,
  storage: ImageStorage = filesystemStorage
): Promise<StoredDocument> {
  // 1. Reserve the row. Nothing exists on disk yet.
  const record = await prisma.media.create({
    data: { purpose, status: "PENDING" },
    select: { id: true },
  });

  const storageKey = documentKeyForId(record.id);

  try {
    // 2. Write. Atomic: either the whole file lands or nothing does.
    await storage.write(storageKey, input);

    // 3. Publish. Until this succeeds the row is invisible to the application.
    await prisma.media.update({
      where: { id: record.id },
      data: {
        status: "READY",
        storageKey,
        mimeType: DOCUMENT_MIME,
        sizeBytes: input.byteLength,
        // width/height stay null — there are no pixels.
      },
    });

    logInfo("upload-document.ok", {
      id: record.id,
      purpose,
      bytes: input.byteLength,
    });

    return {
      id: record.id,
      url: mediaUrl(storageKey),
      sizeBytes: input.byteLength,
    };
  } catch (error) {
    // The row stays PENDING on purpose. See `uploadImage`.
    logError(
      "upload-document.failed",
      { id: record.id, purpose, inputBytes: input.byteLength },
      error
    );
    throw error;
  }
}

/**
 * Removes an image and its row.
 *
 * The file goes first, for the same reason the row is created first on upload:
 * if this dies halfway, a row pointing at a missing file is visible and
 * repairable, while a file whose row is gone is not.
 */
export async function deleteImage(
  id: string,
  storage: ImageStorage = filesystemStorage
): Promise<boolean> {
  const record = await prisma.media.findUnique({
    where: { id },
    select: { id: true, storageKey: true },
  });

  if (!record) return false;

  if (record.storageKey) {
    await storage.remove(record.storageKey);
  }

  await prisma.media.delete({ where: { id: record.id } });

  logInfo("delete.ok", { id });
  return true;
}

/** Counts and totals for the maintenance view. Cheap enough to call on demand. */
export async function mediaStats(storage: ImageStorage = filesystemStorage) {
  const [ready, pending, aggregate, filesOnDisk, bytesOnDisk] = await Promise.all([
    prisma.media.count({ where: { status: "READY" } }),
    prisma.media.count({ where: { status: "PENDING" } }),
    prisma.media.aggregate({
      where: { status: "READY" },
      _sum: { sizeBytes: true },
    }),
    storage.list().then((keys) => keys.length),
    storage.totalBytes(),
  ]);

  return {
    ready,
    pending,
    trackedBytes: aggregate._sum.sizeBytes ?? 0,
    filesOnDisk,
    bytesOnDisk,
  };
}
