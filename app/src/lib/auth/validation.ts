import { z } from "zod";

/** Shared shape for the credential endpoints, so the rules cannot drift apart. */
export const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required")
  .max(254)
  .email("Please enter a valid email address")
  .transform((value) => value.toLowerCase());

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  // bcrypt silently ignores input past 72 bytes, so refuse it rather than
  // accepting a password whose tail never contributes to the hash.
  .max(72, "Password must be at most 72 characters");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

/**
 * Egyptian phone numbers, in anything close to how a person types them:
 * 01xxxxxxxxx / 01 xxxx xxxxx / +20 1x xxxx xxxx / 201xxxxxxxxx. Normalised
 * (digits only, local form) by `normaliseEgyptianPhone` before storage.
 */
const EGYPTIAN_PHONE = /^(?:\+?20|0)?1[0125]\d{8}$/;

export const phoneSchema = z
  .string()
  .trim()
  .max(30)
  .transform((v) => v.replace(/[\s\-().]/g, ""))
  .refine((v) => EGYPTIAN_PHONE.test(v.replace(/^\+/, "")), {
    message: "Please enter a valid Egyptian phone number",
  });

export const bookingSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(120),
  phone: phoneSchema,
  age: z.coerce.number().int().min(0).max(120).optional(),
  complaint: z.string().trim().max(2000).optional().or(z.literal("")),
  preferredDate: z.string().trim().max(40).optional().or(z.literal("")),
  doctorId: z.string().trim().max(64).optional().or(z.literal("")),
  specialtySlug: z.string().trim().max(64).optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
  consent: z.literal(true, { message: "Consent is required" }),
});

export const teamRequestSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(120),
  phone: phoneSchema,
  facility: z.string().trim().min(2, "Facility is required").max(200),
  facilityCity: z.string().trim().max(120).optional().or(z.literal("")),
  role: z.string().trim().max(120).optional().or(z.literal("")),
  fromDate: z.string().min(1, "Start date is required"),
  toDate: z.string().trim().max(40).optional().or(z.literal("")),
  casesPerDay: z.coerce.number().int().min(0).max(500).optional(),
  daysPerWeek: z.coerce.number().int().min(0).max(7).optional(),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
  consent: z.literal(true, { message: "Consent is required" }),
});

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(120),
  email: emailSchema.optional().or(z.literal("")),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  message: z.string().trim().min(5, "Message is required").max(5000),
});

export const newsletterSchema = z.object({
  email: emailSchema,
});

/** Turns a Zod failure into the `{ error }` shape the storefront already renders. */
export function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Invalid request";
}
