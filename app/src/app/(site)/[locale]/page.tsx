import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Stethoscope, HeartPulse, Users, CalendarCheck, Building2 } from "lucide-react";
import prisma from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import type { Locale } from "@/i18n/config";
import { BookingSheet } from "@/components/site/booking-sheet";
import { TeamRequestSheet } from "@/components/site/team-request-sheet";
import { ContactSection } from "@/components/site/contact-section";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function LandingPage({ params }: Props) {
  const { locale: raw } = await params;
  const locale = raw as Locale;
  const t = await getTranslations();
  const tBooking = await getTranslations("booking");
  const tTeam = await getTranslations("teamRequest");
  const tNav = await getTranslations("nav");

  const [settings, specialties, doctors, faqs] = await Promise.all([
    getSettings(),
    prisma.specialty.findMany({ where: { active: true }, orderBy: [{ order: "asc" }], include: { _count: { select: { doctors: true } } } }),
    prisma.doctor.findMany({
      where: { active: true },
      orderBy: [{ order: "asc" }, { nameEn: "asc" }],
      take: 24,
      include: { specialty: { select: { nameEn: true, nameAr: true, slug: true } } },
    }),
    prisma.faq.findMany({ where: { active: true }, orderBy: [{ order: "asc" }] }),
  ]);

  // Hero copy: dashboard overrides first, message-catalog fallbacks second.
  const heroEyebrow = (locale === "ar" ? settings.heroEyebrowAr : settings.heroEyebrowEn) || t("hero.eyebrow");
  const heroTitle = (locale === "ar" ? settings.heroTitleAr : settings.heroTitleEn) || `${t("hero.title1")} ${t("hero.title2")}`;
  const heroLead = (locale === "ar" ? settings.heroLeadAr : settings.heroLeadEn) || t("hero.lead");
  const aboutLead = (locale === "ar" ? settings.aboutLeadAr : settings.aboutLeadEn) || heroLead;
  const aboutImage = settings.aboutImageUrl || "/brand/dr-mohsen-scrubs.png";

  const doctorOptions = doctors.map((d) => ({
    id: d.id,
    name: locale === "ar" ? d.nameAr : d.nameEn,
    specialty: locale === "ar" ? d.specialty?.nameAr ?? "" : d.specialty?.nameEn ?? "",
  }));

  const specialtyOptions = specialties.map((s) => ({ slug: s.slug, name: locale === "ar" ? s.nameAr : s.nameEn }));

  return (
    <div>
      {/* Hero */}
      <section className="bg-blue-ink text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 lg:grid-cols-2 lg:py-24 lg:items-center">
          <div>
            <p className="text-sm text-teal-15 mb-4">{heroEyebrow}</p>
            <h1 className="text-4xl sm:text-5xl font-extrabold leading-[1.15]">{heroTitle}</h1>
            <p className="mt-5 text-white/70 leading-relaxed max-w-xl">{heroLead}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#booking" className="rounded-full bg-teal px-6 py-3 text-sm font-semibold hover:bg-teal-deep transition-colors">
                {tNav("book")}
              </a>
              <a href="#team-request" className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold hover:bg-white/10 transition-colors">
                {tNav("requestTeam")}
              </a>
            </div>
          </div>

          <div className="relative">
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl">
              <Image
                src={settings.heroImageUrl || "/brand/dr-mohsen-suit.png"}
                alt={settings.siteName}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 560px"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Value strip */}
      <section className="border-b border-line bg-teal-08">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:grid-cols-3">
          {[
            { icon: Stethoscope, en: "Anaesthesia specialists", ar: "أخصائيي تخدير" },
            { icon: HeartPulse, en: "Pain management", ar: "علاج الألم" },
            { icon: Users, en: "A doctor for every specialty", ar: "دكتور لكل تخصص" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-15 text-teal-deep">
                <item.icon className="h-5 w-5" />
              </span>
              <p className="font-medium">{locale === "ar" ? item.ar : item.en}</p>
            </div>
          ))}
        </div>
      </section>

      {/* About */}
      <section id="about" className="scroll-mt-24">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 lg:grid-cols-2 lg:items-center">
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl">
            <Image src={aboutImage} alt={settings.siteName} fill sizes="(max-width: 1024px) 100vw, 540px" className="object-cover" />
          </div>
          <div>
            <h2 className="text-3xl font-bold mb-4">{tNav("about")}</h2>
            <p className="text-muted leading-relaxed">{aboutLead}</p>
          </div>
        </div>
      </section>

      {/* Specialties */}
      <section id="specialties" className="scroll-mt-24 border-y border-line bg-blue-08/40">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-3xl font-bold mb-2">{tNav("procedures")}</h2>
          <p className="text-sm text-muted mb-8">
            {locale === "ar" ? "الأقسام التي يغطيها الدكتور وفريقه." : "The departments Dr. Mohsen and his team cover."}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {specialties.length === 0 && (
              <p className="text-sm text-muted">{locale === "ar" ? "لا توجد تخصصات بعد." : "No specialties published yet."}</p>
            )}
            {specialties.map((s) => (
              <div key={s.id} className="rounded-2xl bg-white border border-line p-5 hover:border-teal transition-colors">
                <p className="font-semibold">{locale === "ar" ? s.nameAr : s.nameEn}</p>
                {(locale === "ar" ? s.descriptionAr : s.descriptionEn) && (
                  <p className="mt-2 text-sm text-muted leading-relaxed line-clamp-3">
                    {locale === "ar" ? s.descriptionAr : s.descriptionEn}
                  </p>
                )}
                <p className="mt-3 text-xs text-teal-deep">{s._count.doctors} {locale === "ar" ? "طبيب" : "doctor(s)"}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Doctors */}
      <section id="doctors" className="scroll-mt-24">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-3xl font-bold mb-2">{tNav("team")}</h2>
          <p className="text-sm text-muted mb-8">
            {locale === "ar" ? "شبكة الأطباء المتاحة للحجز." : "The doctor network, bookable online."}
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {doctors.length === 0 && (
              <p className="text-sm text-muted">{locale === "ar" ? "لا يوجد أطباء بعد." : "No doctors published yet."}</p>
            )}
            {doctors.map((d) => (
              <div key={d.id} className="rounded-3xl border border-line bg-white overflow-hidden">
                <div className="relative aspect-[4/5] bg-blue-08">
                  {d.photoUrl && (
                    <Image src={d.photoUrl} alt={locale === "ar" ? d.nameAr : d.nameEn} fill sizes="(max-width: 640px) 90vw, 280px" className="object-cover" />
                  )}
                </div>
                <div className="p-4">
                  <p className="font-semibold">{locale === "ar" ? d.nameAr : d.nameEn}</p>
                  {d.titleEn && <p className="text-xs text-muted mt-0.5">{locale === "ar" ? d.titleAr ?? d.titleEn : d.titleEn}</p>}
                  <p className="mt-2 text-xs text-teal-deep">{locale === "ar" ? d.specialty?.nameAr ?? "" : d.specialty?.nameEn ?? ""}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Booking */}
      <section className="border-y border-line bg-blue-08/40">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-3xl font-bold mb-2">{tBooking("title")}</h2>
          <p className="text-sm text-muted mb-8">
            {locale === "ar"
              ? "من غير حساب: بياناتك ورقم موبايلك بس، وارفع تحاليلك وأشعتك معانا."
              : "No account needed: your name and phone, and upload your labs and scans with the form."}
          </p>
          <div className="flex justify-center">
            <BookingSheet doctors={doctorOptions} specialties={specialtyOptions} />
          </div>
        </div>
      </section>

      {/* Team request */}
      <section>
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="mb-8 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-15 text-teal-deep">
              <Building2 className="h-5 w-5" />
            </span>
            <h2 className="text-3xl font-bold">{tTeam("title")}</h2>
          </div>
          <div className="flex justify-center">
            <TeamRequestSheet />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-24 border-y border-line bg-blue-08/40">
        <div className="mx-auto max-w-3xl px-4 py-16">
          <h2 className="text-3xl font-bold mb-8">{tNav("faq")}</h2>
          <div className="space-y-3">
            {faqs.length === 0 && (
              <p className="text-sm text-muted">{locale === "ar" ? "لا توجد أسئلة بعد." : "No questions published yet."}</p>
            )}
            {faqs.map((f) => (
              <details key={f.id} className="group rounded-2xl border border-line bg-white p-4 open:border-teal-15">
                <summary className="flex cursor-pointer items-center justify-between gap-4 text-sm font-semibold list-none">
                  <span>{locale === "ar" ? f.questionAr : f.questionEn}</span>
                  <span className="text-teal transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm text-muted leading-relaxed">{locale === "ar" ? f.answerAr : f.answerEn}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section>
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-3xl font-bold mb-8">{tNav("contact")}</h2>
          <ContactSection />
        </div>
      </section>
    </div>
  );
}
