"use client";

import * as React from "react";
import type { Procedure } from "@prisma/client";
import { Bi } from "@/components/site/bilingual";

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

export function ProceduresSection({ procedures }: { procedures: Procedure[] }) {
  const [filter, setFilter] = React.useState("all");
  const visibleCount = procedures.filter((item) => filter === "all" || item.category === filter).length;

  return (
    <section className="m-ops sec" id="procedures">
      <div className="wrap">
        <div className="sec-head sec-head--split">
          <div>
            <span className="eyebrow"><Bi en="Procedures" ar="العمليات اللي بنقدمها" /></span>
            <h2 style={{ marginTop: 14 }}>
              <Bi en="Every detail explained. No price tags." ar="كل التفاصيل مكتوبة.. ومن غير أسعار." />
            </h2>
          </div>
          <p className="lead">
            <Bi
              en="What the procedure involves, how long it takes, the anaesthetic used and how long recovery takes. Cost is never published — it depends on your case and your hospital."
              ar="الإجراء بيمشي إزاي، بياخد وقت قد إيه، نوع التخدير، ومدة التعافي. والتكلفة مش بننشرها — لأنها بتختلف حسب حالتك والمستشفى."
            />
          </p>
        </div>

        <div className="m-price-banner" data-fade>
          <div className="m-price-banner__text">
            <i className="ph-light ph-tag" aria-hidden="true" />
            <div>
              <b><Bi en="About pricing, honestly" ar="بخصوص الأسعار، وبصراحة" /></b>
              <p>
                <Bi
                  en="Procedures and anaesthesia are priced per case: the operating time, the anaesthetic type, the hospital and your medical condition all change the number. So we review your file first, then tell you the cost — in writing, before you commit to anything."
                  ar="سعر العملية والتخدير بيتحدد لكل حالة لوحدها: مدة العملية، نوع التخدير، المستشفى، وحالتك الصحية كلهم بيغيّروا الرقم. علشان كده بنراجع ملفك الأول، وبعدها نقولك التكلفة — مكتوبة، وقبل ما تلتزم بأي حاجة."
                />
              </p>
            </div>
          </div>
          <a className="btn btn--wa" href="#contact">
            <i className="ph-fill ph-whatsapp-logo" aria-hidden="true" />
            <Bi en="Ask about cost" ar="اعرف التكلفة" />
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
                      <span className="price-note">
                        <i className="ph-light ph-warning-circle" aria-hidden="true" />
                        <Bi en="Price on contact" ar="السعر بالتواصل" />
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
