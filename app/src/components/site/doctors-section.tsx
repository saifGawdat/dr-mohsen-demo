"use client";

import * as React from "react";
import { Bi } from "@/components/site/bilingual";
import { doctorInitials, experienceLabel } from "@/lib/site-format";

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

const FILTERS = [
  { slug: "all", en: "All specialties", ar: "كل التخصصات" },
  { slug: "dental", en: "Dentistry", ar: "أسنان" },
  { slug: "gyn", en: "Gynaecology", ar: "نساء وتوليد" },
  { slug: "aesthetic", en: "Aesthetics", ar: "تجميل" },
  { slug: "ent", en: "ENT", ar: "أنف وأذن" },
  { slug: "general", en: "General surgery", ar: "جراحة عامة" },
  { slug: "gastro", en: "Endoscopy", ar: "مناظير" },
  { slug: "peds", en: "Paediatrics", ar: "أطفال" },
  { slug: "pain", en: "Pain clinic", ar: "علاج الألم" },
] as const;

export function DoctorsSection({ doctors }: { doctors: DoctorCard[] }) {
  const [filter, setFilter] = React.useState<string>("all");

  // A specialty row (or footer link) asks this directory to narrow down.
  React.useEffect(() => {
    const onFilter = (event: Event) => {
      const detail = (event as CustomEvent<{ specialty?: string }>).detail;
      if (detail?.specialty) setFilter(detail.specialty);
    };
    window.addEventListener("mm:filter-doctors", onFilter);
    return () => window.removeEventListener("mm:filter-doctors", onFilter);
  }, []);

  const featured = doctors.find((doctor) => doctor.featured);
  const rows = doctors.filter((doctor) => !doctor.featured);

  const matches = (doctor: DoctorCard) => filter === "all" || doctor.specialty?.slug === filter;
  const visibleCount = doctors.filter(matches).length;

  return (
    <section className="m-docs sec" id="doctors">
      <div className="wrap">
        <div className="sec-head sec-head--split">
          <div>
            <span className="eyebrow"><Bi en="The doctors" ar="الأطباء" /></span>
            <h2 style={{ marginTop: 14 }}>
              <Bi en="Filter by specialty and book." ar="فلتر بالتخصص واحجز." />
            </h2>
          </div>
          <p className="lead">
            <Bi
              en="More than one doctor in the same specialty, so you get the earliest slot rather than the only one available."
              ar="أكثر من دكتور في نفس التخصص، يعني بتاخد أقرب ميعاد مش الميعاد الوحيد المتاح."
            />
          </p>
        </div>

        <div
          className="m-docs__bar"
          data-filter-group="docs"
          role="group"
          aria-label="فلتر التخصصات"
        >
          {FILTERS.map((item) => (
            <button
              className="chip"
              type="button"
              key={item.slug}
              data-filter={item.slug}
              aria-pressed={filter === item.slug}
              onClick={() => setFilter(item.slug)}
            >
              <Bi en={item.en} ar={item.ar} />
            </button>
          ))}
        </div>

        <div className="m-docs__grid" id="docs-list" data-stagger>
          {featured && (
            <article className="m-docfeat" data-cat={featured.specialty?.slug ?? "pain"} hidden={!matches(featured)}>
              <div className="m-docfeat__media">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={featured.photoUrl || "/brand/dr-mohsen-suit.png"} alt={featured.nameAr} />
              </div>
              <div className="m-docfeat__body">
                <span className="m-docfeat__role">
                  <Bi
                    en={featured.titleEn || "Team lead · Anaesthesia & pain management"}
                    ar={featured.titleAr || "قائد الفريق · تخدير وعلاج ألم"}
                  />
                </span>
                <h3><Bi en={featured.nameEn} ar={featured.nameAr} /></h3>
                <p>
                  <Bi
                    en="Leads the team, and runs the pain clinic himself — chronic pain, back pain and post-surgical pain."
                    ar="قائد الفريق، وبيشرف على عيادة علاج الألم بنفسه — الألم المزمن، الظهر، وألم بعد الجراحة."
                  />
                </p>
                <div className="m-docfeat__cta">
                  <button
                    className="btn btn--light btn--sm"
                    type="button"
                    data-book-doc
                    data-doc-spec={featured.specialty?.slug ?? "pain"}
                    data-doc-id={featured.id}
                  >
                    <Bi en="Book online" ar="احجز أونلاين" />
                    <i className="ph-light ph-arrow-right flip" aria-hidden="true" />
                  </button>
                  <a className="link" href="#team" style={{ color: "#fff" }}>
                    <Bi en="The anaesthesia team" ar="فريق التخدير" />
                  </a>
                </div>
              </div>
            </article>
          )}

          {rows.map((doctor) => (
            <article
              className="m-docrow"
              key={doctor.id}
              data-cat={doctor.specialty?.slug ?? ""}
              hidden={!matches(doctor)}
            >
              <span className="m-docrow__ava">
                {doctor.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={doctor.photoUrl} alt="" />
                ) : (
                  doctorInitials(doctor.nameAr)
                )}
              </span>
              <span className="m-docrow__id">
                <b><Bi en={doctor.nameEn} ar={doctor.nameAr} /></b>
                <span><Bi en={doctor.titleEn ?? ""} ar={doctor.titleAr ?? ""} /></span>
              </span>
              <span className="m-docrow__meta">
                <b><Bi en={doctor.cityEn ?? ""} ar={doctor.cityAr ?? ""} /></b>
                <span>
                  <Bi
                    en={experienceLabel("en", doctor.experienceYears)}
                    ar={experienceLabel("ar", doctor.experienceYears)}
                  />
                </span>
              </span>
              <span className="m-docrow__foot">
                <button
                  className="link"
                  type="button"
                  data-book-doc
                  data-doc-spec={doctor.specialty?.slug ?? ""}
                  data-doc-id={doctor.id}
                >
                  <Bi en="Book online" ar="احجز أونلاين" />
                  <i className="ph-light ph-arrow-right flip" aria-hidden="true" />
                </button>
              </span>
            </article>
          ))}
        </div>

        <p className={`m-docs__empty${visibleCount === 0 ? " show" : ""}`} id="docs-empty">
          <Bi
            en="No doctors listed in this specialty yet — message us and we will arrange it."
            ar="لسه مفيش أطباء مسجلين في التخصص ده — كلمنا ونرتبها."
          />
        </p>
        <p className="note m-flag" style={{ marginTop: 22 }}>
          <i className="ph-light ph-info" aria-hidden="true" />
          <Bi
            en="Sample data for this review round: doctor names, cities and availability are placeholders and will be replaced with the real team."
            ar="بيانات توضيحية للمراجعة: أسماء الأطباء والمدن والمواعيد مبدئية، وبينتحدّث ببيانات الفريق الفعلي."
          />
        </p>
      </div>
    </section>
  );
}
