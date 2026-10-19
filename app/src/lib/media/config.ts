import path from "node:path";

/**
 * Server-side image configuration: filesystem locations and the environment
 * knobs. Everything the browser also needs lives in ./shared and is re-exported
 * here, so server code has a single import.
 */
export * from "./shared";

/**
 * Where processed files live. `UPLOAD_DIR` is the documented name; `UPLOADS_DIR`
 * is still honoured because the previous implementation shipped with it and a
 * deployment may already set it. Point this at a mounted volume in production —
 * anything written inside the container is lost on the next deploy.
 */
export const UPLOAD_DIR =
  process.env.UPLOAD_DIR ||
  process.env.UPLOADS_DIR ||
  path.join(process.cwd(), "uploads");

/** Half-written files live here until they are complete, then are renamed into place. */
export const TEMP_DIR = path.join(UPLOAD_DIR, ".tmp");

function positiveNumberFromEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const DEFAULT_MAX_INPUT_PIXELS = 50_000_000;

/**
 * Refuse to decode anything above this many pixels. A small file can describe an
 * enormous image, and decoding is where the memory is actually spent: 50 MP is
 * roughly 200 MB of raw RGBA. Checked from the header before any decode.
 */
export function maxInputPixels(): number {
  return positiveNumberFromEnv("MEDIA_MAX_INPUT_PIXELS", DEFAULT_MAX_INPUT_PIXELS);
}

/**
 * How long a PENDING row is left alone before it is treated as a crashed upload.
 * Only needs to outlast a single request.
 */
export function pendingTtlHours(): number {
  return positiveNumberFromEnv("MEDIA_PENDING_TTL_HOURS", 1);
}

/**
 * How long a finished-but-unreferenced file survives. This has to comfortably
 * exceed the gap between uploading an image and saving the form that uses it —
 * an admin who uploads, goes to lunch, and comes back must not find a dead link.
 */
export function unreferencedTtlHours(): number {
  return positiveNumberFromEnv("MEDIA_UNREFERENCED_TTL_HOURS", 48);
}

/**
 * Days between automatic cleanup sweeps, for the schedule the server runs
 * itself (see ./cleanup). Kept here with the other media knobs so every tunable
 * in this subsystem is read in one place.
 */
export function cleanupIntervalDays(): number {
  return positiveNumberFromEnv("MEDIA_CLEANUP_INTERVAL_DAYS", 3);
}
