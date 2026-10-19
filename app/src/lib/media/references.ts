import prisma from "@/lib/prisma";
import { OUTPUT_EXT } from "./config";

/**
 * Every column in the schema that can hold the URL of a file we store, plus
 * the tables that hold media ids directly (BookingUpload).
 *
 * IMPORTANT — Any new column that can hold a media URL must be added here, or
 * the files it points at will be treated as unreferenced and deleted by the
 * cleanup sweep. This is the registry that stands in for a foreign key: images
 * are referenced by URL string rather than by relation, so the database cannot
 * enforce this for us.
 *
 * Each entry reads one column through the typed Prisma client on purpose. If a
 * column is renamed or removed, this file stops compiling — which is the only
 * automatic warning available without a foreign key.
 *
 * BookingUpload rows point at media ids directly, so they are read as ids
 * rather than URLs.
 */
const REFERENCE_URL_SOURCES: {
  label: string;
  load: () => Promise<(string | null)[]>;
}[] = [
  {
    label: "Settings.logoUrl",
    load: () => prisma.settings.findMany({ select: { logoUrl: true } }).then((r) => r.map((x) => x.logoUrl)),
  },
  {
    label: "Settings.ogImage",
    load: () => prisma.settings.findMany({ select: { ogImage: true } }).then((r) => r.map((x) => x.ogImage)),
  },
  {
    label: "Settings.heroImageUrl",
    load: () => prisma.settings.findMany({ select: { heroImageUrl: true } }).then((r) => r.map((x) => x.heroImageUrl)),
  },
  {
    label: "Settings.heroImage2Url",
    load: () => prisma.settings.findMany({ select: { heroImage2Url: true } }).then((r) => r.map((x) => x.heroImage2Url)),
  },
  {
    label: "Settings.heroImage3Url",
    load: () => prisma.settings.findMany({ select: { heroImage3Url: true } }).then((r) => r.map((x) => x.heroImage3Url)),
  },
  {
    label: "Settings.aboutImageUrl",
    load: () => prisma.settings.findMany({ select: { aboutImageUrl: true } }).then((r) => r.map((x) => x.aboutImageUrl)),
  },
  {
    label: "User.image",
    load: () => prisma.user.findMany({ where: { image: { not: null } }, select: { image: true } }).then((r) => r.map((x) => x.image)),
  },
  {
    label: "Doctor.photoUrl",
    load: () => prisma.doctor.findMany({ where: { photoUrl: { not: null } }, select: { photoUrl: true } }).then((r) => r.map((x) => x.photoUrl)),
  },
  {
    label: "PageSeo.ogImage",
    load: () => prisma.pageSeo.findMany({ where: { ogImage: { not: null } }, select: { ogImage: true } }).then((r) => r.map((x) => x.ogImage)),
  },
  {
    label: "BlogPost.featuredImage",
    load: () => prisma.blogPost.findMany({ where: { featuredImage: { not: null } }, select: { featuredImage: true } }).then((r) => r.map((x) => x.featuredImage)),
  },
  {
    label: "BlogPost.ogImage",
    load: () => prisma.blogPost.findMany({ where: { ogImage: { not: null } }, select: { ogImage: true } }).then((r) => r.map((x) => x.ogImage)),
  },
  {
    label: "Testimonial.photoUrl",
    load: () => prisma.testimonial.findMany({ where: { photoUrl: { not: null } }, select: { photoUrl: true } }).then((r) => r.map((x) => x.photoUrl)),
  },
];

/**
 * Tables that reference media by id rather than by URL. Read as ids directly.
 */
const REFERENCE_ID_SOURCES: {
  label: string;
  load: () => Promise<string[]>;
}[] = [
  {
    label: "BookingUpload.mediaId",
    load: () => prisma.bookingUpload.findMany({ select: { mediaId: true } }).then((r) => r.map((x) => x.mediaId)),
  },
];

/** How many sources the sweep inspects. Surfaced in the maintenance report. */
export const REFERENCE_SOURCE_COUNT =
  REFERENCE_URL_SOURCES.length + REFERENCE_ID_SOURCES.length;

export const REFERENCE_SOURCE_LABELS = [
  ...REFERENCE_URL_SOURCES.map((s) => s.label),
  ...REFERENCE_ID_SOURCES.map((s) => s.label),
];

/**
 * Pulls the media id out of a stored value, or null if the value points at
 * something we do not own — a static asset under `/brand/`, or an external URL.
 * Those are left strictly alone.
 *
 * Both stored formats are matched: `.webp` (re-encoded images) and `.pdf`
 * (byte-exact documents).
 */
export function mediaIdFromValue(value: string | null): string | null {
  if (!value) return null;

  const match =
    /^\/api\/uploads\/([A-Za-z0-9_-]+)\.(?:webp|pdf)(?:[?#]|$)/.exec(value.trim());
  return match ? match[1] : null;
}

/**
 * Every media id referenced anywhere in the database.
 *
 * Reads all sources before the caller compares against anything, so a row that
 * is referenced by a table read late in the list is never briefly considered
 * unreferenced.
 */
export async function collectReferencedMediaIds(): Promise<Set<string>> {
  const referenced = new Set<string>();

  for (const source of REFERENCE_URL_SOURCES) {
    const values = await source.load();
    for (const value of values) {
      const id = mediaIdFromValue(value);
      if (id) referenced.add(id);
    }
  }

  for (const source of REFERENCE_ID_SOURCES) {
    for (const id of await source.load()) {
      referenced.add(id);
    }
  }

  return referenced;
}

/**
 * Filename a media id maps to on disk. The sweep tries both stored formats, so
 * a document orphaned by a crashed upload is found as readily as an image.
 * Kept here so the sweep and the service agree.
 */
export function filenamesForId(id: string): string[] {
  return [`${id}${OUTPUT_EXT}`, `${id}.pdf`];
}
