"use client";

/* eslint-disable @next/next/no-img-element -- Library images are already optimized by the upload pipeline. */

import * as React from "react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Bi } from "@/components/site/bilingual";
import { doctorInitials } from "@/lib/site-format";

export interface DoctorCard {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  titleEn: string | null;
  titleAr: string | null;
  cityEn: string | null;
  cityAr: string | null;
  experienceYears: number | null;
  photoUrl: string | null;
  featured: boolean;
  specialty: { slug: string; nameEn: string; nameAr: string } | null;
}

export function LeadDoctor({ doctor }: { doctor?: DoctorCard }) {
  const locale = useLocale();
  if (!doctor) return null;
  return <section className="m-lead sec" id="lead-doctor">
    <div className="wrap">
      <article className="m-docfeat">
        <div className="m-docfeat__media">
          <img src={doctor.photoUrl || "/brand/dr-mohsen-suit.png"} alt={locale === "ar" ? doctor.nameAr : doctor.nameEn} />
        </div>
        <div className="m-docfeat__body">
          <span className="eyebrow"><Bi en="Dr. Mohsen & the anaesthesia team" ar="د. محسن وفريق التخدير" /></span>
          <h2><Bi en={doctor.nameEn} ar={doctor.nameAr} /></h2>
          <p><Bi en={doctor.titleEn || "Anaesthesia & pain management"} ar={doctor.titleAr || "تخدير وعلاج ألم"} /></p>
          <p><Bi en="From assessment before the procedure to recovery and pain follow-up, the team plans care around each case." ar="من التقييم قبل الإجراء لحد الإفاقة ومتابعة الألم، الفريق بيحط خطة الرعاية حسب كل حالة." /></p>
          <div className="m-docfeat__cta">
            <Link className="btn btn--light btn--sm" href={`/${doctor.id}`}><Bi en="Meet the doctor" ar="اعرف دكتورك" /></Link>
            <a className="link" href="#team"><Bi en="Explore the team" ar="اعرف فريق التخدير" /></a>
          </div>
        </div>
      </article>
    </div>
  </section>;
}

export function DoctorsSection({ doctors }: { doctors: DoctorCard[] }) {
  const locale = useLocale();
  const [filter, setFilter] = React.useState("all");
  const [bounds, setBounds] = React.useState({ start: true, end: true });
  const track = React.useRef<HTMLDivElement>(null);
  const lead = doctors.find((doctor) => doctor.featured);
  const consultants = doctors.filter((doctor) => doctor.id !== lead?.id);
  const specialties = Array.from(new Map(doctors.flatMap((doctor) => doctor.specialty ? [[doctor.specialty.slug, doctor.specialty] as const] : [])).values());
  const visible = consultants.filter((doctor) => filter === "all" || doctor.specialty?.slug === filter);

  React.useEffect(() => {
    const onFilter = (event: Event) => {
      const detail = (event as CustomEvent<{ specialty?: string }>).detail;
      if (detail?.specialty) setFilter(detail.specialty);
    };
    window.addEventListener("mm:filter-doctors", onFilter);
    return () => window.removeEventListener("mm:filter-doctors", onFilter);
  }, []);

  const onScroll = React.useCallback(() => {
    const container = track.current;
    if (!container) return;
    const offset = Math.abs(container.scrollLeft);
    setBounds({ start: offset < 2, end: offset >= container.scrollWidth - container.clientWidth - 2 });
  }, []);
  React.useEffect(() => {
    const container = track.current;
    if (!container) return;
    const observer = new ResizeObserver(onScroll);
    observer.observe(container);
    return () => observer.disconnect();
  }, [filter, visible.length, onScroll]);

  function move(delta: number) {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const container = track.current;
    if (!container) return;
    const width = container.firstElementChild?.getBoundingClientRect().width ?? container.clientWidth;
    container.scrollBy({ left: delta * (width + 24) * (locale === "ar" ? -1 : 1), behavior: reduced ? "instant" : "smooth" });
  }

  return <section className="m-docs sec" id="doctors">
    <div className="wrap">
      <div className="sec-head sec-head--split">
        <div><span className="eyebrow"><Bi en="Our consultants" ar="دكاترة العيادة" /></span>
          <h2 style={{ marginTop: 14 }}><Bi en="Get to know your doctor." ar="اعرف دكتورك قبل ما تحجز." /></h2>
        </div>
        <p className="lead"><Bi en="Browse the doctors, then explore their specialties, clinic locations and published articles." ar="تصفح الدكاترة، واعرف تخصص كل دكتور وأماكن عياداته ومقالاته المنشورة." /></p>
      </div>
      <div className="m-docs__bar" role="group" aria-label={locale === "ar" ? "فلتر التخصصات" : "Filter specialties"}>
        <button type="button" className="chip" aria-pressed={filter === "all"} onClick={() => setFilter("all")}><Bi en="All specialties" ar="كل التخصصات" /></button>
        {specialties.map((specialty) => <button key={specialty.slug} type="button" className="chip" aria-pressed={filter === specialty.slug} onClick={() => setFilter(specialty.slug)}><Bi en={specialty.nameEn} ar={specialty.nameAr} /></button>)}
      </div>
      {visible.length > 0 ? <>
        <div className="m-doctor-slider" ref={track} key={filter} onScroll={onScroll} role="region" aria-roledescription={locale === "ar" ? "عارض شرائح" : "carousel"} aria-label={locale === "ar" ? "صور الأطباء" : "Doctor portraits"} tabIndex={0}>
          {visible.map((doctor) => <article className="m-doctor-card" key={doctor.id}>
            <Link href={`/${doctor.id}`} className="m-doctor-card__link">
              <div className="m-doctor-card__portrait">
                {doctor.photoUrl ? <img src={doctor.photoUrl} alt={locale === "ar" ? doctor.nameAr : doctor.nameEn} loading="lazy" /> : <span aria-hidden="true">{doctorInitials(locale === "ar" ? doctor.nameAr : doctor.nameEn)}</span>}
              </div>
              <div className="m-doctor-card__body">
                {doctor.specialty && <span className="eyebrow"><Bi en={doctor.specialty.nameEn} ar={doctor.specialty.nameAr} /></span>}
                <h3><Bi en={doctor.nameEn} ar={doctor.nameAr} /></h3>
                <p><Bi en={doctor.titleEn ?? ""} ar={doctor.titleAr ?? ""} /></p>
                <span className="link"><Bi en="View doctor profile" ar="شوف ملف الدكتور" /><i className="ph-light ph-arrow-right flip" aria-hidden="true" /></span>
              </div>
            </Link>
          </article>)}
        </div>
        <div className="m-doctor-slider__controls">
          <button type="button" className="btn btn--ghost btn--sm" disabled={bounds.start} onClick={() => move(-1)}><Bi en="Previous" ar="السابق" /></button>
          <span className="small" aria-live="polite">{visible.length} <Bi en="doctors" ar="دكاترة" /></span>
          <button type="button" className="btn btn--ghost btn--sm" disabled={bounds.end} onClick={() => move(1)}><Bi en="Next" ar="التالي" /></button>
        </div>
      </> : <p className="note"><Bi en="No other doctors are listed in this specialty yet. Contact the clinic to discuss your request." ar="لسه مفيش دكاترة تانيين مسجلين في التخصص ده. كلم العيادة علشان نرتب طلبك." /></p>}
      {lead && filter === lead.specialty?.slug && <p className="note"><Link href={`/${lead.id}`}><Bi en={`View ${lead.nameEn}'s profile`} ar={`شوف ملف ${lead.nameAr}`} /></Link></p>}
    </div>
  </section>;
}
