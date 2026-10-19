/**
 * The parts of the image configuration that both the browser and the server
 * need. Kept free of Node imports so a client component can read the same
 * dimensions the server will enforce, instead of hardcoding its own copy that
 * drifts.
 */

/**
 * Input formats we are willing to decode. SVG is deliberately absent: it is a
 * document format that can carry script, and serving it from the app's own
 * origin would make every uploaded SVG a stored-XSS vector against an admin
 * session.
 *
 * Animated GIFs are accepted but flattened to their first frame, because
 * everything here is re-encoded to still WebP.
 */
export const ACCEPTED_INPUT_FORMATS = ["jpeg", "png", "webp", "avif", "gif"] as const;
export type AcceptedInputFormat = (typeof ACCEPTED_INPUT_FORMATS)[number];

/** What the file picker offers for images. Mirrors ACCEPTED_INPUT_FORMATS. */
export const ACCEPTED_INPUT_MIME = "image/jpeg,image/png,image/webp,image/avif,image/gif";

/** Everything is stored as WebP: one format, alpha preserved, universally supported. */
export const OUTPUT_FORMAT = "webp" as const;
export const OUTPUT_MIME = "image/webp";
export const OUTPUT_EXT = ".webp";

/**
 * Medical documents (labs, scans, reports) are stored as PDFs, byte-exact.
 * They are never re-encoded — a report is a legal record of what was issued —
 * and the PDF is sniffed from the header before anything is stored.
 */
export const DOCUMENT_MIME = "application/pdf";
export const DOCUMENT_EXT = ".pdf";
export const MAX_DOCUMENT_BYTES = 20 * 1024 * 1024;

/**
 * Quality ladder. Encoding starts at the first value and steps down only if the
 * result exceeds the purpose's size ceiling, so an image that fits keeps its
 * detail and only the oversized ones pay. Stopping at 70 is deliberate — below
 * that, gradients and skin tones visibly band.
 */
export const QUALITY_LADDER = [90, 85, 80, 75, 70] as const;

/**
 * The ladder used for hero images. Heroes are the one place a visitor sees an
 * image at full viewport width, at the top of the page, before anything else —
 * so they get their own floor.
 */
export const HERO_QUALITY_LADDER = [95, 93, 90, 88, 85] as const;

/**
 * libwebp's speed/size trade-off, 0-6. Four is the middle ground the encoder is
 * usually run at: most of the size win, a fraction of the CPU of a full search.
 */
export const DEFAULT_ENCODE_EFFORT = 4;

/**
 * Quality alone cannot always reach the ceiling — a very detailed image stays
 * large even at the bottom of the ladder. When that happens the longest edge is
 * shrunk by these factors and the ladder is retried, because a slightly smaller
 * image that fits beats a correctly sized one that blows the budget.
 */
export const DIMENSION_FALLBACKS = [1, 0.8, 0.65] as const;

/**
 * Quality the browser encodes at before uploading. Deliberately higher than
 * anything the server will settle on: this pass exists to cut upload size, not
 * to make quality decisions. The server is the authority and re-encodes from
 * whatever arrives, so being generous here costs a little bandwidth and protects
 * against compounding two lossy passes.
 */
export const CLIENT_ENCODE_QUALITY = 0.92;

/**
 * The browser pass for heroes. Higher again, for the same reason the server
 * ladder is: this pass is only meant to cut upload size, and whatever detail it
 * throws away here the server can never get back.
 */
export const HERO_CLIENT_ENCODE_QUALITY = 0.97;

/**
 * Largest request body the upload route will look at. The browser resizes and
 * re-encodes before sending, so a normal upload is a fraction of this; the
 * headroom exists for the cases where that did not happen — a client with
 * scripting disabled, or a direct API call.
 */
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

export interface ImagePurposeConfig {
  /** Longest edge, in pixels. Chosen from what the UI actually renders. */
  maxDimension: number;
  /** Stored file must come in under this, or quality steps down until it does. */
  maxStoredBytes: number;
  /** Human-facing note used in error messages. */
  label: string;
  /**
   * How many images one entity may hold, where it holds more than one. Absent
   * for the single-image purposes, which are capped by the field itself.
   */
  maxPerEntity?: number;
  /** Overrides QUALITY_LADDER for this purpose. Absent means the default ladder. */
  qualityLadder?: readonly number[];
  /** Overrides CLIENT_ENCODE_QUALITY for this purpose, 0-1. */
  clientEncodeQuality?: number;
  /**
   * libwebp encoder effort, 0-6. Higher spends more CPU to find a smaller file
   * at the same visual quality. Absent means the default.
   */
  encodeEffort?: number;
  /** Overrides MAX_UPLOAD_BYTES for this purpose. Absent means the default. */
  maxUploadBytes?: number;
}

const KB = 1024;

/**
 * Dimensions come from the widths the storefront actually requests (the `sizes`
 * prop on each `next/image`), doubled for high-DPR screens and rounded up.
 */
export const IMAGE_CONFIG = {
  /**
   * Full-bleed at 100vw. This is the first thing a visitor sees and the only
   * image shown edge to edge, so it is the one purpose that is allowed to cost
   * more: a 2560px longest edge covers a 1280px-wide laptop at 2x.
   */
  hero: {
    maxDimension: 2560,
    maxStoredBytes: 3 * 1024 * KB,
    label: "Hero image",
    qualityLadder: HERO_QUALITY_LADDER,
    clientEncodeQuality: HERO_CLIENT_ENCODE_QUALITY,
    encodeEffort: 6,
    maxUploadBytes: 24 * 1024 * KB,
  },
  /** Split-layout editorial images — about, pain clinic. */
  content: { maxDimension: 1200, maxStoredBytes: 512 * KB, label: "Content image" },
  /** Doctor portraits render as tall frames, up to ~470px wide. */
  doctor: { maxDimension: 1200, maxStoredBytes: 512 * KB, label: "Doctor photo" },
  category: { maxDimension: 1200, maxStoredBytes: 512 * KB, label: "Specialty image" },
  blog: { maxDimension: 1200, maxStoredBytes: 512 * KB, label: "Blog image" },
  /** Open Graph wants 1200x630; the longest edge is what we cap. */
  og: { maxDimension: 1200, maxStoredBytes: 512 * KB, label: "Social share image" },
  /** Header logo renders small; 600 is already generous. */
  logo: { maxDimension: 600, maxStoredBytes: 256 * KB, label: "Logo" },
  /** Media-library uploads with no declared purpose. */
  general: { maxDimension: 1600, maxStoredBytes: 512 * KB, label: "Image" },
} as const satisfies Record<string, ImagePurposeConfig>;

export type ImagePurpose = keyof typeof IMAGE_CONFIG;

export const DEFAULT_PURPOSE: ImagePurpose = "general";

export function isImagePurpose(value: unknown): value is ImagePurpose {
  return typeof value === "string" && value in IMAGE_CONFIG;
}

export function purposeConfig(purpose: ImagePurpose): ImagePurposeConfig {
  return IMAGE_CONFIG[purpose];
}

/** The ladder the server encodes this purpose with, override or default. */
export function qualityLadderFor(purpose: ImagePurpose): readonly number[] {
  return purposeConfig(purpose).qualityLadder ?? QUALITY_LADDER;
}

/** The quality the browser pre-encodes this purpose at, override or default. */
export function clientEncodeQualityFor(purpose: ImagePurpose): number {
  return purposeConfig(purpose).clientEncodeQuality ?? CLIENT_ENCODE_QUALITY;
}

/** Encoder effort for this purpose, override or default. */
export function encodeEffortFor(purpose: ImagePurpose): number {
  return purposeConfig(purpose).encodeEffort ?? DEFAULT_ENCODE_EFFORT;
}

/** Largest body accepted for this purpose, override or default. */
export function maxUploadBytesFor(purpose: ImagePurpose): number {
  return purposeConfig(purpose).maxUploadBytes ?? MAX_UPLOAD_BYTES;
}

/**
 * The most generous limit any purpose allows. The upload route only learns the
 * purpose after it has parsed the body, so its pre-parse Content-Length check
 * has to use this; the purpose's own limit is applied straight after. The
 * document ceiling is folded in because documents are bigger than any image.
 */
export const MAX_ANY_UPLOAD_BYTES = Math.max(
  (
    Object.values(IMAGE_CONFIG) as ImagePurposeConfig[]
  ).reduce(
    (largest, config) => Math.max(largest, config.maxUploadBytes ?? MAX_UPLOAD_BYTES),
    MAX_UPLOAD_BYTES
  ),
  MAX_DOCUMENT_BYTES
);

/** Public URL for a stored file. Content never changes under a given id. */
export function mediaUrl(storageKey: string): string {
  return `/api/uploads/${storageKey}`;
}

/** The image filename a row's file will have. Derived from the id so the sweep can find orphans. */
export function storageKeyForId(id: string): string {
  return `${id}${OUTPUT_EXT}`;
}

/** The document filename a row's file will have. */
export function documentKeyForId(id: string): string {
  return `${id}${DOCUMENT_EXT}`;
}
