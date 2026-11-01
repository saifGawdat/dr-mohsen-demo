/* eslint-disable @next/next/no-img-element -- Library images are already optimized by the upload pipeline. */
import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { isLocale } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
import { getSettings } from "@/lib/settings";
import { readDoctorProfile } from "@/lib/doctor-profile";
import { phoneDigits } from "@/lib/site-format";
import { Bi } from "@/components/site/bilingual";
import { BookingForm } from "@/components/site/booking-form";
import { TeamRequestSheet } from "@/components/site/team-request-sheet";
import { SiteBehavior } from "@/components/site/site-behavior";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ locale: string; id: string }> };
// Metadata and page share a single read; inactive profiles are never public.
const getDoctor = cache((id: string) => prisma.doctor.findFirst({
  where: { active: true, OR: [{ id }, { slug: id }] },
  include: { specialty: true },
}));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params;
  if (!isLocale(locale)) return {};
  const doctor = await getDoctor(id);
  if (!doctor) return { title: locale === "ar" ? "الملف غير موجود" : "Profile not found", robots: { index: false } };
  const name = locale === "ar" ? doctor.nameAr : doctor.nameEn;
  const description = (locale === "ar" ? doctor.bioAr : doctor.bioEn)?.slice(0, 160) || name;
  return {
    title: `${name} | PCA Clinic`, description,
    alternates: { canonical: `/${locale}/${doctor.id}`, languages: { ar: `/ar/${doctor.id}`, en: `/en/${doctor.id}` } },
    openGraph: { title: `${name} | PCA Clinic`, description, url: `/${locale}/${doctor.id}`, images: [{ url: doctor.photoUrl || "/brand/pca-og.png" }] },
  };
}

export default async function DoctorPage({ params }: Props) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  const [doctor, settings] = await Promise.all([getDoctor(id), getSettings()]);
  if (!doctor) notFound();
  const profile = readDoctorProfile(doctor.profile);
  const name = locale === "ar" ? doctor.nameAr : doctor.nameEn;
  const whatsapp = settings.whatsappEnabled ? settings.whatsappNumber : null;
  const narrativeSections = [
    { id: "case-studies", en: "Case studies", ar: "دراسات الحالات", items: profile.cases },
    { id: "doctor-articles", en: "Articles", ar: "مقالات الدكتور", items: profile.articles },
  ];
  return <>
    <main id="top" className="m-doctor-profile">
      <section className="m-profile-hero sec">
        <div className="wrap m-profile-hero__grid">
          <div>
            <Link href="/#doctors" className="link"><Bi en="All doctors" ar="كل الدكاترة" /></Link>
            {doctor.specialty && <p className="eyebrow"><Bi en={doctor.specialty.nameEn} ar={doctor.specialty.nameAr} /></p>}
            <h1>{name}</h1>
            <p className="lead"><Bi en={doctor.titleEn ?? ""} ar={doctor.titleAr ?? ""} /></p>
            {(doctor.hospitalEn || doctor.hospitalAr) && <p><Bi en={doctor.hospitalEn ?? ""} ar={doctor.hospitalAr ?? ""} /></p>}
            <div className="m-profile-actions">
              <a href="#booking" className="btn btn--light"><Bi en="Request an appointment" ar="اطلب ميعاد" /></a>
              {doctor.phone && <a href={`tel:${phoneDigits(doctor.phone)}`} className="link"><Bi en="Call the doctor" ar="اتصل بالدكتور" /> <span dir="ltr">{doctor.phone}</span></a>}
            </div>
          </div>
          {doctor.photoUrl ? <img className="m-profile-hero__portrait" src={doctor.photoUrl} alt={name} /> : <img className="m-profile-hero__portrait m-profile-hero__mark" src="/brand/pca-logo-mark-white.png" alt="PCA Clinic" />}
        </div>
      </section>
      <nav className="m-profile-nav wrap" aria-label={locale === "ar" ? "أقسام ملف الدكتور" : "Doctor profile sections"}>
        <a href="#about-doctor"><Bi en="About" ar="عن الدكتور" /></a>
        <a href="#clinics"><Bi en="Clinics" ar="العيادات" /></a>
        {profile.images.length > 0 && <a href="#gallery"><Bi en="Photos" ar="الصور" /></a>}
        {profile.comparisons.length > 0 && <a href="#before-after"><Bi en="Before & after" ar="قبل وبعد" /></a>}
        {narrativeSections.filter((section) => section.items.length).map((section) => <a key={section.id} href={`#${section.id}`}><Bi en={section.en} ar={section.ar} /></a>)}
      </nav>
      <section className="sec" id="about-doctor"><div className="wrap m-profile-copy">
        <h2><Bi en="About the doctor" ar="عن الدكتور" /></h2>
        <p className="lead m-profile-text"><Bi en={doctor.bioEn || "Contact the clinic for more information about this doctor."} ar={doctor.bioAr || "كلم العيادة لو محتاج تعرف معلومات أكتر عن الدكتور."} /></p>
      </div></section>
      <section className="sec m-profile-tint" id="clinics"><div className="wrap">
        <div className="sec-head"><span className="eyebrow"><Bi en="Plan your visit" ar="رتّب زيارتك" /></span><h2><Bi en="Clinic locations" ar="أماكن العيادات" /></h2></div>
        {profile.clinics.length > 0 ? <div className="m-profile-grid">{profile.clinics.map((clinic, index) => <article key={index} className="m-profile-card">
          <h3><Bi en={clinic.titleEn} ar={clinic.titleAr} /></h3>
          <p className="m-profile-text"><Bi en={clinic.addressEn} ar={clinic.addressAr} /></p>
        </article>)}</div> : <p><Bi en="Contact the clinic to confirm the location and appointment details before visiting." ar="كلم العيادة لتأكيد المكان وتفاصيل الميعاد قبل الزيارة." /></p>}
      </div></section>
      {profile.images.length > 0 && <section className="sec" id="gallery"><div className="wrap">
        <div className="sec-head"><h2><Bi en="Photo gallery" ar="معرض الصور" /></h2></div>
        <div className="m-profile-grid">{profile.images.map((image, index) => <img key={index} className="m-profile-image" src={image} alt={locale === "ar" ? `صورة ${index + 1} من ملف ${name}` : `${name} profile photo ${index + 1}`} loading="lazy" />)}</div>
      </div></section>}
      {profile.comparisons.length > 0 && <section className="sec m-profile-tint" id="before-after"><div className="wrap">
        <div className="sec-head"><h2><Bi en="Before & after" ar="قبل وبعد" /></h2><p className="note"><Bi en="Published with documented consent. Each case is different; these images do not guarantee an outcome." ar="الصور منشورة بموافقة موثقة. كل حالة مختلفة، والصور دي مش ضمان لنتيجة معينة." /></p></div>
        <div className="m-profile-grid">{profile.comparisons.map((item, index) => <article key={index} className="m-profile-card">
          <h3><Bi en={item.titleEn} ar={item.titleAr} /></h3>
          <div className="m-profile-pair">{(["before", "after"] as const).map((key) => <figure key={key}>
            <img className="m-profile-image" src={item[key]} loading="lazy" alt={`${locale === "ar" ? item.titleAr : item.titleEn} — ${key === "before" ? (locale === "ar" ? "قبل" : "Before") : (locale === "ar" ? "بعد" : "After")}`} />
            <figcaption><Bi en={key === "before" ? "Before" : "After"} ar={key === "before" ? "قبل" : "بعد"} /></figcaption>
          </figure>)}</div>
        </article>)}</div>
      </div></section>}
      {narrativeSections.filter((section) => section.items.length).map((section) => <section className="sec" key={section.id} id={section.id}><div className="wrap">
        <div className="sec-head"><h2><Bi en={section.en} ar={section.ar} /></h2></div>
        <div className="m-profile-grid">{section.items.map((item, index) => <article key={index} className="m-profile-card">
          <h3><Bi en={item.titleEn} ar={item.titleAr} /></h3>
          <p className="m-profile-text"><Bi en={item.bodyEn} ar={item.bodyAr} /></p>
        </article>)}</div>
      </div></section>)}
      <section className="m-book sec" id="booking"><div className="wrap">
        <div className="sec-head"><h2><Bi en="Request an appointment" ar="اطلب ميعاد" /></h2><p className="lead"><Bi en="The clinic confirms availability after reviewing your request." ar="العيادة بتأكد الميعاد بعد مراجعة طلبك." /></p></div>
        {doctor.specialty ? <BookingForm key={doctor.id} clinics={profile.clinics.map((clinic, index) => ({ value: String(index), en: clinic.titleEn.slice(0, 120), ar: clinic.titleAr.slice(0, 120) }))} locale={locale} initialDoctorId={doctor.id} doctors={[{ id: doctor.id, nameEn: doctor.nameEn, nameAr: doctor.nameAr, specialtySlug: doctor.specialty?.slug ?? "" }]} specialties={doctor.specialty ? [{ slug: doctor.specialty.slug, nameEn: doctor.specialty.nameEn, nameAr: doctor.specialty.nameAr }] : []} whatsapp={whatsapp} phone={settings.contactPhone} /> : <p><Bi en="Contact the clinic to arrange an appointment with this doctor." ar="كلم العيادة لترتيب ميعاد مع الدكتور." /> <Link href="/#booking" className="link"><Bi en="Clinic booking" ar="الحجز مع العيادة" /></Link></p>}
      </div></section>
    </main>
    <TeamRequestSheet locale={locale} whatsapp={whatsapp} />
    <SiteBehavior />
  </>;
}
