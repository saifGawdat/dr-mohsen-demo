/**
 * The development seed: one admin from the environment, the settings row, the
 * specialty catalog, a starter set of doctors, and the FAQ entries. Safe to run
 * more than once — every write is an upsert on a natural key.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SPECIALTIES: { slug: string; nameEn: string; nameAr: string; descriptionEn?: string; descriptionAr?: string }[] = [
  {
    slug: "pain-management",
    nameEn: "Pain Management",
    nameAr: "علاج الألم",
    descriptionEn: "Interventional and clinical pain treatment for chronic spine, joint and nerve pain.",
    descriptionAr: "علاج الألم المزمن بكل تدخلاته العصبية والعظمية.",
  },
  { slug: "general-surgery", nameEn: "General Surgery", nameAr: "الجراحة العامة" },
  { slug: "obstetrics", nameEn: "Obstetrics & Gynaecology", nameAr: "النساء والتوليد" },
  { slug: "paediatrics", nameEn: "Paediatrics", nameAr: "طب الأطفال" },
  { slug: "ent", nameEn: "ENT (Ear, Nose & Throat)", nameAr: "أنف وأذن وحنجرة" },
  { slug: "gastro", nameEn: "Gastroenterology & Endoscopy", nameAr: "الجهاز الهضمي والمناظير" },
  { slug: "dental", nameEn: "Dental & Oral Surgery", nameAr: "الأسنان" },
  { slug: "aesthetic", nameEn: "Aesthetic Surgery", nameAr: "تجميل" },
  { slug: "airway", nameEn: "Airway Management", nameAr: "إدارة مجرى التنفس" },
];

const DOCTORS: {
  slug: string;
  nameEn: string;
  nameAr: string;
  titleEn: string;
  titleAr: string;
  specialty: string;
  order: number;
}[] = [
  { slug: "dr-mohsen", nameEn: "Dr. Mohsen Mamdouh", nameAr: "د. محسن ممدوح", titleEn: "Consultant anaesthetist & pain management", titleAr: "استشاري التخدير وعلاج الألم", specialty: "pain-management", order: 1 },
  { slug: "dr-omar", nameEn: "Dr. Omar Khalil", nameAr: "د. عمر خليل", titleEn: "Consultant anaesthetist", titleAr: "استشاري التخدير", specialty: "general-surgery", order: 2 },
  { slug: "dr-sara", nameEn: "Dr. Sara Adel", nameAr: "د. سارة عادل", titleEn: "Consultant anaesthetist", titleAr: "استشاري التخدير", specialty: "obstetrics", order: 3 },
  { slug: "dr-ahmed", nameEn: "Dr. Ahmed Farouk", nameAr: "د. أحمد فاروق", titleEn: "Specialist anaesthetist", titleAr: "أخصائي التخدير", specialty: "paediatrics", order: 4 },
  { slug: "dr-heba", nameEn: "Dr. Heba Nabil", nameAr: "د. هبة نبيل", titleEn: "Specialist anaesthetist", titleAr: "أخصائي التخدير", specialty: "ent", order: 5 },
  { slug: "dr-karim", nameEn: "Dr. Karim Mostafa", nameAr: "د. كريم مصطفى", titleEn: "Specialist anaesthetist", titleAr: "أخصائي التخدير", specialty: "gastro", order: 6 },
  { slug: "dr-mona", nameEn: "Dr. Mona Sherif", nameAr: "د. منى شريف", titleEn: "Consultant anaesthetist", titleAr: "استشاري التخدير", specialty: "dental", order: 7 },
  { slug: "dr-yasser", nameEn: "Dr. Yasser Hodhod", nameAr: "د. ياسر حدود", titleEn: "Specialist anaesthetist", titleAr: "أخصائي التخدير", specialty: "aesthetic", order: 8 },
];

const FAQS: { questionEn: string; questionAr: string; answerEn: string; answerAr: string; order: number }[] = [
  {
    questionEn: "Do I need an account to book?",
    questionAr: "هل أحتاج حساب لحجز موعد؟",
    answerEn:
      "No. A booking needs your name and phone number only. Upload your labs, scans and reports with the form so they are reviewed before the visit.",
    answerAr:
      "لا. الحجز يحتاج اسمك ورقم موبايلك فقط، ويمكنك رفع التحاليل والأشعة مع النموذج لتتم مراجعتها قبل الكشف.",
    order: 1,
  },
  {
    questionEn: "What happens after I book?",
    questionAr: "ماذا يحدث بعد الحجز؟",
    answerEn: "The clinic calls you on the number you gave to confirm the time. Your booking has a reference number you can mention on the call.",
    answerAr: "العيادة تتصل بك على الرقم الذي أدخلته لتأكيد الموعد، وكل حجز له رقم مرجعي تذكره في المكالمة.",
    order: 2,
  },
  {
    questionEn: "Can a hospital request anaesthesia cover?",
    questionAr: "هل يمكن للمستشفيات طلب فريق تخدير؟",
    answerEn:
      "Yes. The anaesthesia team covers operations for hospitals, surgical centres and clinics. Use the team request form with your dates and expected case volume.",
    answerAr:
      "نعم، فريق التخدير غطاء كل العمليات للمستشفيات والمراكز الجراحية والعيادات. استخدم نموذج طلب الفريق مع المواعيد وعدد الحالات.",
    order: 3,
  },
  {
    questionEn: "Which file types can I upload?",
    questionAr: "ما أنواع الملفات التي يمكن رفعها؟",
    answerEn: "Photos (JPG, PNG, WebP) and PDF reports up to 20MB each, up to ten files per booking.",
    answerAr: "الصور (JPG وPNG وWebP) وتقارير PDF، حتى ٢٠ ميجابايت لكل ملف و١٠ ملفات لكل حجز.",
    order: 4,
  },
];

async function main() {
  // Admin account — email and password from the environment, never committed.
  const email = (process.env.ADMIN_EMAIL ?? "admin@drmohsen.example").toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "change-me-now";
  const name = process.env.ADMIN_NAME ?? "Dr. Mohsen Mamdouh";

  await prisma.user.upsert({
    where: { email },
    update: { role: "ADMIN" },
    create: {
      email,
      name,
      role: "ADMIN",
      password: await bcrypt.hash(password, 10),
    },
  });

  // The single settings row.
  if ((await prisma.settings.count()) === 0) {
    await prisma.settings.create({ data: {} });
  }

  // Specialties (natural key: slug).
  for (const s of SPECIALTIES) {
    await prisma.specialty.upsert({
      where: { slug: s.slug },
      update: { nameEn: s.nameEn, nameAr: s.nameAr },
      create: s,
    });
  }

  // Doctors (natural key: slug).
  for (const d of DOCTORS) {
    const specialty = await prisma.specialty.findUnique({ where: { slug: d.specialty } });
    await prisma.doctor.upsert({
      where: { slug: d.slug },
      update: { nameEn: d.nameEn, nameAr: d.nameAr, specialtyId: specialty?.id ?? null },
      create: {
        slug: d.slug,
        nameEn: d.nameEn,
        nameAr: d.nameAr,
        titleEn: d.titleEn,
        titleAr: d.titleAr,
        specialtyId: specialty?.id ?? null,
        order: d.order,
        active: true,
      },
    });
  }

  // FAQs — rebuildable from the static list.
  if ((await prisma.faq.count()) === 0) {
    await prisma.faq.createMany({ data: FAQS });
  }

  console.log("Seed complete: admin, settings, specialties, doctors, FAQs.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => void prisma.$disconnect());
