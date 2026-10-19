import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getCurrentUser, unauthorized } from "@/lib/auth";
import { getSettings } from "@/lib/settings";

export const runtime = "nodejs";

const settingsSchema = z.object({
  siteName: z.string().trim().max(160).optional(),
  tagline: z.string().trim().max(300).optional(),
  logoUrl: z.string().trim().max(500).nullable().optional(),
  siteDescription: z.string().trim().max(2000).nullable().optional(),
  siteKeywords: z.string().trim().max(2000).nullable().optional(),
  ogImage: z.string().trim().max(500).nullable().optional(),
  googleVerification: z.string().trim().max(200).nullable().optional(),

  whatsappEnabled: z.boolean().optional(),
  whatsappNumber: z.string().trim().max(40).nullable().optional(),
  contactEmail: z.string().trim().max(200).nullable().optional(),
  contactPhone: z.string().trim().max(40).nullable().optional(),
  address: z.string().trim().max(1000).nullable().optional(),
  openingHours: z.string().trim().max(200).nullable().optional(),

  facebookUrl: z.string().trim().max(500).nullable().optional(),
  instagramUrl: z.string().trim().max(500).nullable().optional(),

  heroEyebrowEn: z.string().trim().max(300).nullable().optional(),
  heroEyebrowAr: z.string().trim().max(300).nullable().optional(),
  heroTitleEn: z.string().trim().max(300).nullable().optional(),
  heroTitleAr: z.string().trim().max(300).nullable().optional(),
  heroLeadEn: z.string().trim().max(2000).nullable().optional(),
  heroLeadAr: z.string().trim().max(2000).nullable().optional(),
  heroImageUrl: z.string().trim().max(500).nullable().optional(),
  heroImage2Url: z.string().trim().max(500).nullable().optional(),
  heroImage3Url: z.string().trim().max(500).nullable().optional(),
  aboutLeadEn: z.string().trim().max(5000).nullable().optional(),
  aboutLeadAr: z.string().trim().max(5000).nullable().optional(),
  aboutImageUrl: z.string().trim().max(500).nullable().optional(),

  blogEnabled: z.boolean().optional(),
  newsletterEnabled: z.boolean().optional(),
  reviewsEnabled: z.boolean().optional(),

  emailServiceEnabled: z.boolean().optional(),
  emailFrom: z.string().trim().max(200).nullable().optional(),
  resendApiKey: z.string().trim().max(200).nullable().optional(),
  bookingNotifyEmail: z.string().trim().max(200).nullable().optional(),
});

export async function GET() {
  const authUser = await getCurrentUser();
  if (authUser?.role !== "ADMIN") return unauthorized();

  const settings = await getSettings();
  return NextResponse.json({ settings });
}

export async function PATCH(request: NextRequest) {
  const authUser = await getCurrentUser();
  if (authUser?.role !== "ADMIN") return unauthorized();

  const parsed = settingsSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid data" }, { status: 400 });
  }

  const current = await getSettings();

  const settings = await prisma.settings.update({
    where: { id: current.id },
    data: parsed.data,
  });

  return NextResponse.json({ settings });
}
