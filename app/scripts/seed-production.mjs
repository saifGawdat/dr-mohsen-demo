import { PrismaClient } from "@prisma/client";
import { readFile, access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { z } from "zod";

const appDir = fileURLToPath(new URL("../", import.meta.url));
const text = z.string().trim().min(1);
const slug = text.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const image = text.regex(/^\/brand\/[a-zA-Z0-9_-]+\.webp$/);
const manifestSchema = z.array(z.object({
  specialty: z.object({ slug, nameAr: text, nameEn: text }).strict(),
  doctor: z.object({
    slug, nameAr: text, nameEn: text, titleAr: text, titleEn: text,
    bioAr: text.optional(), bioEn: text.optional(), photoUrl: image,
    order: z.number().int().nonnegative(),
    active: z.boolean(), featured: z.boolean(),
    profile: z.object({ images: z.array(image).max(30) }).strict(),
  }).strict(),
}).strict()).superRefine((entries, context) => {
  const slugs = entries.map(({ doctor }) => doctor.slug);
  if (new Set(slugs).size !== slugs.length) {
    context.addIssue({ code: "custom", message: "Duplicate doctor slugs in seed content" });
  }
});

/** Add approved profiles once; later deploys must preserve dashboard edits. */
export async function seedProduction(prisma, content) {
  const entries = manifestSchema.parse(content ?? JSON.parse(await readFile(
    new URL("../prisma/seed-content/doctors.json", import.meta.url), "utf8",
  )));

  // Fail before writing if an image was omitted from the deployed release.
  for (const { doctor } of entries) {
    for (const url of [doctor.photoUrl, ...doctor.profile.images]) {
      await access(path.join(appDir, "public", url));
    }
  }

  await prisma.$transaction(async (tx) => {
    // Serialize simultaneous starts as well as repeated runs on one server.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(782031149)`;
    for (const { specialty, doctor } of entries) {
      const category = await tx.specialty.upsert({
        where: { slug: specialty.slug }, update: {}, create: specialty,
      });
      await tx.doctor.upsert({
        where: { slug: doctor.slug }, update: {},
        create: { ...doctor, specialtyId: category.id },
      });
    }
  }, { timeout: 30000 });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const prisma = new PrismaClient();
  try {
    await seedProduction(prisma);
    console.log("Production doctor seed complete; existing records preserved.");
  } catch {
    // Connection errors can contain credentials; never print raw DB errors.
    console.error("Production doctor seed failed. Check database access and packaged seed content/assets.");
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}
