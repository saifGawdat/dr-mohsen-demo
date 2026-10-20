import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { isLocale, type Locale } from "@/i18n/config";
import { getSettings } from "@/lib/settings";
import { Bi } from "@/components/site/bilingual";
import {
  ContactSection,
  FaqSection,
  Hero,
  PainSection,
  ProcessSection,
  TeamSection,
  TrustStrip,
  TwoDoors,
  WhySection,
} from "@/components/site/landing-sections";
import { SpecialtiesSection } from "@/components/site/specialties-section";
import { DoctorsSection, type DoctorCard } from "@/components/site/doctors-section";
import { ProceduresSection } from "@/components/site/procedures-section";
import { BookingForm } from "@/components/site/booking-form";
import { TeamRequestSheet } from "@/components/site/team-request-sheet";
import { SiteBehavior } from "@/components/site/site-behavior";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function LandingPage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;

  const [settings, specialties, doctors, procedures, faqs] = await Promise.all([
    getSettings(),
    prisma.specialty.findMany({
      orderBy: { order: "asc" },
      include: { _count: { select: { doctors: true } } },
    }),
    prisma.doctor.findMany({
      where: { active: true },
      orderBy: [{ featured: "desc" }, { order: "asc" }],
      include: { specialty: { select: { slug: true, nameEn: true, nameAr: true } } },
    }),
    prisma.procedure.findMany({
      where: { active: true },
      orderBy: { order: "asc" },
    }),
    prisma.faq.findMany({
      where: { active: true },
      orderBy: { order: "asc" },
    }),
  ]);

  const doctorCards: DoctorCard[] = doctors.map((doctor) => ({
    id: doctor.id,
    slug: doctor.slug,
    nameEn: doctor.nameEn,
    nameAr: doctor.nameAr,
    titleEn: doctor.titleEn,
    titleAr: doctor.titleAr,
    cityEn: doctor.cityEn,
    cityAr: doctor.cityAr,
    experienceYears: doctor.experienceYears,
    photoUrl: doctor.photoUrl,
    featured: doctor.featured,
    specialty: doctor.specialty,
  }));

  const bookingDoctors = doctors
    .filter((doctor) => doctor.specialty)
    .map((doctor) => ({
      id: doctor.id,
      nameEn: doctor.nameEn,
      nameAr: doctor.nameAr,
      specialtySlug: doctor.specialty!.slug,
    }));

  const whatsapp = settings.whatsappEnabled ? settings.whatsappNumber : null;
  const heroImage = settings.heroImageUrl || "/brand/dr-mohsen-suit.png";
  const aboutImage = settings.aboutImageUrl || "/brand/dr-mohsen-scrubs.png";

  return (
    <>
      <main id="top">
        <Hero heroImage={heroImage} aboutImage={aboutImage} />
        <TrustStrip />
        <TwoDoors />
        <TeamSection aboutImage={aboutImage} heroImage={heroImage} whatsapp={whatsapp} />
        <WhySection />
        <SpecialtiesSection specialties={specialties} />
        <DoctorsSection doctors={doctorCards} />
        <ProceduresSection
          locale={locale}
          procedures={procedures}
          whatsapp={whatsapp}
          phone={settings.contactPhone}
        />

        <section className="m-book sec" id="booking">
          <div className="wrap">
            <div className="sec-head sec-head--split">
              <div>
                <span className="eyebrow">
                  <Bi en="Book online" ar="احجز أونلاين" />
                </span>
                <h2 style={{ marginTop: 14 }}>
                  <Bi
                    en="Six steps: request, specialty, time, details, your file, then confirm."
                    ar="ست خطوات: الطلب، التخصص، الموعد، بياناتك، ملفاتك، وبعدين التأكيد."
                  />
                </h2>
              </div>
              <p className="lead">
                <Bi
                  en="Upload your lab results and scans here. The team reviews the file before the visit, so the appointment starts from where you actually are — not from scratch."
                  ar="ارفع تحاليلك وأشعتك من هنا. الفريق بيراجع الملف قبل الزيارة، فالكشف يبدأ من عند حالتك الحقيقية — مش من الصفر."
                />
              </p>
            </div>

            <BookingForm
              locale={locale}
              doctors={bookingDoctors}
              specialties={specialties.map((specialty) => ({
                slug: specialty.slug,
                nameEn: specialty.nameEn,
                nameAr: specialty.nameAr,
              }))}
              whatsapp={whatsapp}
              phone={settings.contactPhone}
            />
          </div>
        </section>

        <ProcessSection />
        <PainSection whatsapp={whatsapp} />
        <FaqSection faqs={faqs} />
        <ContactSection
          locale={locale}
          phone={settings.contactPhone}
          whatsapp={whatsapp}
        />
      </main>

      <TeamRequestSheet locale={locale} whatsapp={whatsapp} />
      <SiteBehavior />
    </>
  );
}
