import type { Specialty } from "@prisma/client";
import { Bi } from "@/components/site/bilingual";
import { arabicDigits, countLabel } from "@/lib/site-format";

interface SpecialtyWithCount extends Specialty {
  _count: { doctors: number };
}

export function SpecialtiesSection({ specialties }: { specialties: SpecialtyWithCount[] }) {
  return (
    <section className="m-specs sec" id="specialties">
      <div className="wrap">
        <div className="sec-head sec-head--split">
          <div>
            <span className="eyebrow"><Bi en="Specialties" ar="التخصصات" /></span>
            <h2 style={{ marginTop: 14 }}>
              <Bi en="Pick the specialty. We have doctors in it." ar="اختار التخصص.. وعندنا دكاترة فيه." />
            </h2>
          </div>
          <p className="lead">
            <Bi
              en="The team works together, so the anaesthetist and the surgeon already know each other's protocol before your case starts."
              ar="الفريق شغال مع بعض، يعني طبيب التخدير والجراح عارفين بروتوكول بعض قبل ما حالتك تبدأ."
            />
          </p>
        </div>

        <div className="m-specs__grid" data-fade>
          {specialties.map((specialty, index) => (
            <button
              className="m-spec"
              type="button"
              key={specialty.id}
              data-goto-spec={specialty.slug}
            >
              <span className="m-spec__n">{arabicDigits(String(index + 1).padStart(2, "0"))}</span>
              <span className="m-spec__name">
                <b><Bi en={specialty.nameEn} ar={specialty.nameAr} /></b>
                <span className="en-name ltr">{specialty.descriptionEn || specialty.nameEn}</span>
              </span>
              <span className="m-spec__count">
                {specialty.slug === "pain" ? (
                  <Bi en="Dr. Mohsen" ar="د. محسن ممدوح" />
                ) : (
                  <Bi
                    en={countLabel("en", specialty._count.doctors)}
                    ar={countLabel("ar", specialty._count.doctors)}
                  />
                )}
              </span>
              <i className="ph-light ph-arrow-left" aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
