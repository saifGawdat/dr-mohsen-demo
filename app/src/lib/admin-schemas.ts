import { z } from "zod";

/**
 * Shared admin form schemas. They live here — not in the route files —
 * because App Router route modules may only export handlers and segment
 * config; anything else breaks the generated-route type checks (and is a
 * footgun for accidental public exports anyway).
 */

export const doctorSchema = z.object({
  nameEn: z.string().trim().min(2).max(160),
  nameAr: z.string().trim().min(2).max(160),
  titleEn: z.string().trim().max(200).optional().or(z.literal("")),
  titleAr: z.string().trim().max(200).optional().or(z.literal("")),
  bioEn: z.string().trim().max(5000).optional().or(z.literal("")),
  bioAr: z.string().trim().max(5000).optional().or(z.literal("")),
  hospitalEn: z.string().trim().max(200).optional().or(z.literal("")),
  hospitalAr: z.string().trim().max(200).optional().or(z.literal("")),
  photoUrl: z.string().trim().max(500).optional().or(z.literal("")),
  specialtyId: z.string().trim().max(64).optional().or(z.literal("")),
  order: z.coerce.number().int().min(0).max(9999).optional(),
  active: z.boolean().optional(),
});

export const faqSchema = z.object({
  questionEn: z.string().trim().min(2).max(500),
  questionAr: z.string().trim().min(2).max(500),
  answerEn: z.string().trim().min(2).max(5000),
  answerAr: z.string().trim().min(2).max(5000),
  order: z.coerce.number().int().min(0).max(9999).optional(),
  active: z.boolean().optional(),
});

export const specialtySchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2)
    .max(64)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers and dashes"),
  nameEn: z.string().trim().min(2).max(160),
  nameAr: z.string().trim().min(2).max(160),
  descriptionEn: z.string().trim().max(2000).optional().or(z.literal("")),
  descriptionAr: z.string().trim().max(2000).optional().or(z.literal("")),
  order: z.coerce.number().int().min(0).max(9999).optional(),
  active: z.boolean().optional(),
});

export const postSchema = z.object({
  slug: z
    .string()
    .trim()
    .max(200)
    .regex(/^[a-z0-9-]*$/, "Slug must be lowercase letters, numbers and dashes")
    .optional(),
  titleEn: z.string().trim().min(2).max(300),
  titleAr: z.string().trim().min(2).max(300),
  excerptEn: z.string().trim().max(1000).optional().or(z.literal("")),
  excerptAr: z.string().trim().max(1000).optional().or(z.literal("")),
  bodyEn: z.string().trim().max(100000).optional().or(z.literal("")),
  bodyAr: z.string().trim().max(100000).optional().or(z.literal("")),
  featuredImage: z.string().trim().max(500).optional().or(z.literal("")),
  ogImage: z.string().trim().max(500).optional().or(z.literal("")),
  categoryId: z.string().trim().max(64).optional().or(z.literal("")),
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
});
