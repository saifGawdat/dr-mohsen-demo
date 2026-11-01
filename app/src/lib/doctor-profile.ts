import { z } from "zod";

// Only library images can be published here; arbitrary URLs cannot become markup.
export const doctorImageSchema = z.string().regex(
  /^\/(?:brand\/[A-Za-z0-9_./-]+\.(?:webp|png|jpe?g)|api\/uploads\/[A-Za-z0-9_-]+\.webp)$/,
  "Choose an image from the media library",
);
const bilingual = { titleEn: z.string().trim().min(2).max(200), titleAr: z.string().trim().min(2).max(200) };
const narrative = z.object({ ...bilingual, bodyEn: z.string().trim().min(2).max(10000), bodyAr: z.string().trim().min(2).max(10000) });
export const doctorProfileSchema = z.object({
  clinics: z.array(z.object({ ...bilingual, addressEn: z.string().trim().min(2).max(500), addressAr: z.string().trim().min(2).max(500) })).max(20).default([]),
  images: z.array(doctorImageSchema).max(30).default([]),
  cases: z.array(narrative).max(30).default([]),
  articles: z.array(narrative).max(30).default([]),
  comparisons: z.array(z.object({ ...bilingual, before: doctorImageSchema, after: doctorImageSchema, consentConfirmed: z.literal(true, { error: "Confirm documented consent before publishing case images" }) })).max(20).default([]),
});
export type DoctorProfile = z.infer<typeof doctorProfileSchema>;
export function readDoctorProfile(value: unknown): DoctorProfile {
  const parsed = doctorProfileSchema.safeParse(value);
  return parsed.success ? parsed.data : { clinics: [], images: [], cases: [], articles: [], comparisons: [] };
}
export function doctorProfileImages(profile: DoctorProfile): string[] {
  return [...profile.images, ...profile.comparisons.flatMap((item) => [item.before, item.after])];
}
