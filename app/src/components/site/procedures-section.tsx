"use client";

import * as React from "react";
import type { Procedure } from "@prisma/client";
import { Bi } from "@/components/site/bilingual";
import { waLink } from "@/lib/site-format";

const FILTERS = [
  { slug: "all", en: "All procedures", ar: "كل العمليات" },
  { slug: "dental", en: "Dentistry", ar: "أسنان" },
  { slug: "ent", en: "ENT", ar: "أنف وأذن" },
  { slug: "gyn", en: "Gynaecology", ar: "نساء وتوليد" },
  { slug: "aesthetic", en: "Aesthetics", ar: "تجميل" },
  { slug: "general", en: "General surgery", ar: "جراحة عامة" },
  { slug: "gastro", en: "Endoscopy", ar: "مناظير" },
  { slug: "peds", en: "Paediatrics", ar: "أطفال" },
  { slug: "pain", en: "Pain", ar: "علاج الألم" },
] as const;

const TAGS: Record<string, { en: string; ar: string; teal?: boolean }> = {
  dental: { en: "Dentistry", ar: "أسنان" },
  ent: { en: "ENT", ar: "أنف وأذن" },
  gyn: { en: "Gynaecology", ar: "نساء" },
  aesthetic: { en: "Aesthetics", ar: "تجميل" },
  general: { en: "General", ar: "جراحة عامة" },
  gastro: { en: "Endoscopy", ar: "مناظير" },
  peds: { en: "Children", ar: "أطفال" },
  pain: { en: "Pain clinic", ar: "علاج ألم", teal: true },
};

export function ProceduresSection({
  locale,
  procedures,
  whatsapp,
  phone,
}: {
  locale: "ar" | "en";
  procedures: Procedure[];
  whatsapp: string | null;
  phone: string | null;
}) {
  const [filter, setFilter] = React.useState("all");
  const visibleCount = procedures.filter((item) => filter === "all" || item.category === filter).length;
  const waHref = whatsapp
    ? waLink(
        whatsapp,
        locale === "ar"
          ? "السلام عليكم، عايز أعرف تكلفة عملية. ممكن التفاصيل؟"
          : "Hello, I would like to know the price of a procedure. Could we discuss the details?"
      )
    : "#contact";

  return (
    <section className="m-ops sec" id="procedures">
      <div className="wrap">
        <div className="sec-head sec-head--split">
          <div>
            <span className="eyebrow"><Bi en="Procedures" ar="العمليات اللي بنقدمها" /></span>
            <h2 style={{ marginTop: 14 }}>
              <Bi
                en="Every detail explained. Prices from EGP 20,000."
                ar="كل التفاصيل مكتوبة.. والأسعار تبدأ من ٢٠ ألف جنيه."
              />
            </h2>
          </div>
          <p className="lead">
            <Bi
              en="What the procedure involves, how long it takes, the anaesthetic used and how long recovery takes. Procedure prices start from EGP 20,000; the exact cost for your case is confirmed on WhatsApp."
              ar="الإجراء بيمشي إزاي، بياخد وقت قد إيه، نوع التخدير، ومدة التعافي. أسعار العمليات بتبدأ من ٢٠ ألف جنيه، والتكلفة النهائية لحالتك بنأكدها على واتساب."
            />
          </p>
        </div>

        <div className="m-price-banner" data-fade>
          <div className="m-price-banner__text">
            <i className="ph-light ph-tag" aria-hidden="true" />
            <div>
              <b><Bi en="Prices start from EGP 20,000" ar="الأسعار بتبدأ من ٢٠ ألف جنيه" /></b>
              <p>
                <Bi
                  en="That is the starting point for a procedure. The exact price depends on the operation, the anaesthetic, the hospital and your condition — so send us the details on WhatsApp and we will confirm the exact cost before you commit. Nothing is charged online."
                  ar="دي نقطة البداية لأي عملية. السعر النهائي بيتحدد حسب العملية، نوع التخدير، المستشفى، وحالتك — ابعتلنا التفاصيل على واتساب وهنأكدلك التكلفة بالظبط قبل ما تلتزم بأي حاجة. ومفيش أي دفع أونلاين."
                />
              </p>
            </div>
          </div>
          <a
            className="btn btn--wa"
            href={waHref}
            target={whatsapp ? "_blank" : undefined}
            rel={whatsapp ? "noopener" : undefined}
          >
            <i className="ph-fill ph-whatsapp-logo" aria-hidden="true" />
            <Bi en="WhatsApp" ar="واتساب" />
            {phone && <span className="ltr">{phone}</span>}
          </a>
        </div>

        <div
          className="m-docs__bar"
          data-filter-group="ops"
          role="group"
          aria-label="فلتر العمليات"
          style={{ marginTop: 34 }}
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

        <div className="m-ops__list" id="ops-list" data-fade>
          {procedures.map((procedure) => {
            const tag = TAGS[procedure.category] ?? { en: procedure.category, ar: procedure.category };
            return (
              <details
                className="m-op"
                key={procedure.id}
                data-cat={procedure.category}
                hidden={filter !== "all" && procedure.category !== filter}
              >
                <summary>
                  <h3><Bi en={procedure.nameEn} ar={procedure.nameAr} /></h3>
                  <span className={`tag${tag.teal ? "" : " tag--blue"}`}>
                    <Bi en={tag.en} ar={tag.ar} />
                  </span>
                  <span className="m-op__plus">
                    <i className="ph-light ph-plus" aria-hidden="true" />
                  </span>
                </summary>
                <div className="m-op__body">
                  <div>
                    <p><Bi en={procedure.descriptionEn} ar={procedure.descriptionAr} /></p>
                    <dl className="m-op__specs">
                      <div>
                        <dt><Bi en="Duration" ar="المدة" /></dt>
                        <dd><Bi en={procedure.durationEn} ar={procedure.durationAr} /></dd>
                      </div>
                      <div>
                        <dt><Bi en="Anaesthesia" ar="التخدير" /></dt>
                        <dd><Bi en={procedure.anaesthesiaEn} ar={procedure.anaesthesiaAr} /></dd>
                      </div>
                      <div>
                        <dt><Bi en="Stay" ar="الإقامة" /></dt>
                        <dd><Bi en={procedure.stayEn} ar={procedure.stayAr} /></dd>
                      </div>
                    </dl>
                    <div className="m-op__foot">
                      <span className="price-note price-note--from">
                        <i className="ph-light ph-tag" aria-hidden="true" />
                        <Bi en="From EGP 20,000" ar="تبدأ من ٢٠ ألف جنيه" />
                      </span>
                      <a className="link" href="#booking">
                        <Bi en="Book assessment" ar="احجز تقييم" />
                        <i className="ph-light ph-arrow-right flip" aria-hidden="true" />
                      </a>
                    </div>
                  </div>
                  <ul className="includes">
                    {procedure.includesEn.map((item, index) => (
                      <li key={`${item}-${index}`}>
                        <i className="ph-light ph-check" aria-hidden="true" />
                        <span><Bi en={item} ar={procedure.includesAr[index] ?? item} /></span>
                      </li>
                    ))}
                  </ul>
                </div>
              </details>
            );
          })}
        </div>

        <p className={`m-ops__empty${visibleCount === 0 ? " show" : ""}`} id="ops-empty">
          <Bi
            en="No procedures listed in this specialty yet."
            ar="لسه مفيش عمليات مسجلة في التخصص ده."
          />
        </p>
      </div>
    </section>
  );
}
