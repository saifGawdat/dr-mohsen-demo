import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { PrismaClient } from "@prisma/client";
import { seedProduction } from "./seed-production.mjs";

const databaseUrl = process.env.TEST_DATABASE_URL;
if (databaseUrl) {
  const url = new URL(databaseUrl);
  if (!["localhost", "127.0.0.1"].includes(url.hostname) ||
      !url.pathname.endsWith("_seed_verification")) {
    throw new Error("Use a separate local database ending in _seed_verification");
  }
}

test("production seeds preserve records across repeated and concurrent runs", {
  skip: !databaseUrl,
}, async () => {
  const prisma = new PrismaClient({ datasourceUrl: databaseUrl });
  const key = `seed-test-${randomUUID()}`;
  const specialty = { slug: key, nameAr: "تخصص للاختبار", nameEn: "Test specialty" };
  const doctor = {
    slug: key, nameAr: "طبيب للاختبار", nameEn: "Test doctor",
    titleAr: "تخصص للاختبار", titleEn: "Test specialty",
    photoUrl: "/brand/dr-ahmed-mleha-suit.webp", order: 2,
    active: true, featured: false, profile: { images: [] },
  };
  const entries = [{ specialty, doctor }];
  try {
    await seedProduction(prisma, entries);
    const original = await prisma.doctor.findUniqueOrThrow({ where: { slug: key } });
    const category = await prisma.specialty.findUniqueOrThrow({ where: { slug: key } });
    assert.equal(original.specialtyId, category.id);
    await seedProduction(prisma, entries);
    assert.deepEqual(await prisma.doctor.findUnique({ where: { slug: key } }), original);

    await prisma.doctor.update({ where: { slug: key }, data: {
      nameAr: "تعديل من لوحة التحكم", active: false, photoUrl: null,
      profile: { images: [], clinics: [], cases: [], articles: [] },
    } });
    const edited = await prisma.doctor.findUniqueOrThrow({ where: { slug: key } });
    await Promise.all([seedProduction(prisma, entries), seedProduction(prisma, entries)]);
    assert.deepEqual(await prisma.doctor.findUnique({ where: { slug: key } }), edited);
    assert.equal(await prisma.doctor.count({ where: { slug: key } }), 1);
    assert.equal(await prisma.specialty.count({ where: { slug: key } }), 1);

    // A new batch must leave doctors no longer listed in that batch intact.
    await seedProduction(prisma, []);
    assert.deepEqual(await prisma.doctor.findUnique({ where: { slug: key } }), edited);
    await assert.rejects(seedProduction(prisma, [...entries, ...entries]));
    await assert.rejects(seedProduction(prisma, [{ specialty, doctor: {
      ...doctor, slug: `${key}-missing`, photoUrl: "/brand/missing-seed-image.webp",
    } }]));
    assert.equal(await prisma.doctor.count({ where: { slug: `${key}-missing` } }), 0);

    // Exercise the packaged manifest as it grows, including its real assets.
    const manifest = JSON.parse(await readFile(
      new URL("../prisma/seed-content/doctors.json", import.meta.url), "utf8",
    ));
    await seedProduction(prisma);
    for (const { doctor: seeded } of manifest) {
      const row = await prisma.doctor.findUniqueOrThrow({ where: { slug: seeded.slug } });
      assert.equal(row.photoUrl, seeded.photoUrl);
      assert.deepEqual(row.profile, seeded.profile);
    }
    const before = await prisma.doctor.findMany({ orderBy: { slug: "asc" } });
    await Promise.all([seedProduction(prisma), seedProduction(prisma)]);
    assert.deepEqual(await prisma.doctor.findMany({ orderBy: { slug: "asc" } }), before);
  } finally {
    await prisma.doctor.deleteMany({ where: { slug: { in: [key, `${key}-missing`] } } });
    await prisma.specialty.deleteMany({ where: { slug: key } });
    await prisma.$disconnect();
  }
});
