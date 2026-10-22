import type { Faq } from "@prisma/client";
import type { Locale } from "@/i18n/config";
import { Bi } from "@/components/site/bilingual";
import { phoneDigits, waLink } from "@/lib/site-format";

interface MediaProps {
  heroImage: string;
  aboutImage: string;
}

const WA_TEXT: Record<Locale, string> = {
  ar: "السلام عليكم، مع فريق د. محسن ممدوح. عايز أحجز موعد أو أستفسر عن حالة.",
  en: "Hello Dr. Mohsen's team, I would like to book an appointment.",
};

export function Hero({ heroImage }: MediaProps) {
  return (
    <section className="m-hero">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="m-hero__mark" src="/brand/logo-mark-white.png" alt="" aria-hidden="true" />
      <div className="wrap m-hero__inner">
        <div className="m-hero__text">
          <span className="eyebrow m-hero__eyebrow">
            <Bi
              en="Dr. Mohsen Mamdouh — Anaesthetist &amp; pain management"
              ar="د. محسن ممدوح — أخصائي تخدير وعلاج ألم"
            />
          </span>
          <h1>
            <span><Bi en="Details make" ar="التفاصيل.." /></span>
            <span>
              <Bi
                en={<>the difference in <em>anaesthesia</em></>}
                ar={<>بتفرق في <em>التخدير</em></>}
              />
            </span>
          </h1>
          <p className="m-hero__lead">
            <Bi
              en="A complete anaesthesia team for any hospital, surgical centre or clinic that needs one at the highest level — plus a network of doctors across every specialty: dentistry, gynaecology, aesthetics, ENT and more. Book online and upload your labs and scans before the visit."
              ar="فريق تخدير متكامل لأي مستشفى أو مركز جراحي أو عيادة محتاجة فريق بأعلى مستوى — ومعاه شبكة أطباء في كل التخصصات: أسنان، نساء وتوليد، تجميل، أنف وأذن وغيرها. احجز أونلاين وارفع تحاليلك وأشعتك قبل الكشف."
            />
          </p>
          <div className="m-hero__cta" data-fade>
            <a className="btn btn--light" href="#booking">
              <Bi en="Book online" ar="احجز أونلاين" />
              <i className="ph-light ph-arrow-right flip" aria-hidden="true" />
            </a>
            <button className="link" type="button" data-team-request>
              <Bi en="Request an anaesthesia team" ar="اطلب فريق تخدير" />
              <i className="ph-light ph-arrow-right flip" aria-hidden="true" />
            </button>
          </div>
        </div>
        <div className="m-hero__media">
          <figure className="m-hero__frame" data-parallax>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={heroImage} alt="د. محسن ممدوح — أخصائي تخدير وعلاج ألم" />
            {/* The name card rides on the photo it describes: keeping it inside
                the frame stops it drifting off the picture when the frame is
                narrower than its column. */}
            <div className="m-hero__card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/dr-mohsen-headshot.png" alt="" />
              <span>
                <b><Bi en="Dr. Mohsen Mamdouh" ar="د. محسن ممدوح" /></b>
                <small>
                  <Bi
                    en="Anaesthetist · pain management · 57357 Children's Cancer Hospital"
                    ar="تخدير وعلاج ألم · مستشفى 57357 لسرطان الأطفال"
                  />
                </small>
              </span>
            </div>
          </figure>
        </div>
      </div>
    </section>
  );
}

export function TrustStrip() {
  const items = [
    {
      icon: "ph-first-aid-kit",
      en: "A full team",
      ar: "فريق كامل",
      enBody: "Coverage for hospitals, centres and clinics.",
      arBody: "تغطية للمستشفيات والمراكز والعيادات.",
    },
    {
      icon: "ph-clipboard-text",
      en: "Assessed before",
      ar: "تقييم قبل التخدير",
      enBody: "Labs and scans reviewed before the visit.",
      arBody: "مراجعة التحاليل والأشعة قبل الكشف.",
    },
    {
      icon: "ph-calendar-check",
      en: "Online in minutes",
      ar: "حجز أونلاين",
      enBody: "Pick a slot and upload your file.",
      arBody: "اختار الميعاد وارفع ملفاتك.",
    },
    {
      icon: "ph-heartbeat",
      en: "Pain follow-up",
      ar: "متابعة الألم",
      enBody: "A plan for pain after the procedure.",
      arBody: "خطة للألم بعد العملية.",
    },
  ];

  return (
    <section className="m-strip" aria-label="لمحة سريعة">
      <div className="wrap">
        <ul data-stagger>
          {items.map((item) => (
            <li key={item.icon}>
              <i className={`ph-light ${item.icon}`} aria-hidden="true" />
              <span>
                <b><Bi en={item.en} ar={item.ar} /></b>
                <span><Bi en={item.enBody} ar={item.arBody} /></span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function TwoDoors() {
  return (
    <section className="m-doors" id="services">
      <div className="m-doors__grid">
        <div className="m-door" data-fade>
          <span className="m-door__n">01</span>
          <h2>
            <Bi en="An anaesthesia team for your hospital or centre." ar="فريق تخدير لمستشفاك أو مركزك." />
          </h2>
          <p>
            <Bi
              en="If you run a hospital, a surgical centre or a clinic that needs anaesthesia cover at the highest level, the team is ready — equipment, protocols and full monitoring."
              ar="لو عندك مستشفى أو مركز جراحي أو عيادة ومحتاج تغطية تخدير بأعلى مستوى، الفريق جاهز — بتجهيزات وبروتوكولات ومراقبة كاملة."
            />
          </p>
          <ul>
            <li>
              <i className="ph-light ph-clock" aria-hidden="true" />
              <span><Bi en="Scheduled cases and 24/7 emergencies" ar="عمليات مجدولة وطوارئ ٢٤/٧" /></span>
            </li>
            <li>
              <i className="ph-light ph-pulse" aria-hidden="true" />
              <span><Bi en="General, regional and local anaesthesia; paediatric cases" ar="تخدير عام ونصفي وموضعي، وتخدير أطفال" /></span>
            </li>
            <li>
              <i className="ph-light ph-clipboard-text" aria-hidden="true" />
              <span><Bi en="Pre-anaesthetic assessment and a record for every case" ar="تقييم قبل التخدير وتقرير لكل حالة" /></span>
            </li>
            <li>
              <i className="ph-light ph-users-three" aria-hidden="true" />
              <span><Bi en="A dedicated team member per operating room" ar="فرد مخصص لكل غرفة عمليات" /></span>
            </li>
          </ul>
          <div className="m-door__foot">
            <button className="btn btn--light" type="button" data-team-request>
              <Bi en="Request a team" ar="اطلب فريق تخدير" />
              <i className="ph-light ph-arrow-right flip" aria-hidden="true" />
            </button>
            <a className="link" href="#team" style={{ color: "#fff" }}>
              <Bi en="What the team covers" ar="شوف تفاصيل التغطية" />
              <i className="ph-light ph-arrow-right flip" aria-hidden="true" />
            </a>
          </div>
        </div>

        <div className="m-door" data-fade>
          <span className="m-door__n">02</span>
          <h2><Bi en="Doctors across every specialty." ar="أطباء في كل التخصصات." /></h2>
          <p>
            <Bi
              en="Working with the same team: dentistry, gynaecology and obstetrics, aesthetics, ENT — and the rest of the specialties you need, in one place."
              ar="شغالين مع نفس الفريق: أسنان، نساء وتوليد، تجميل، أنف وأذن — وباقي التخصصات اللي تحتاجها، في مكان واحد."
            />
          </p>
          <ul>
            <li>
              <i className="ph-light ph-tooth" aria-hidden="true" />
              <span><Bi en="Dentistry, dental surgery and implants" ar="أسنان وجراحة فم وزراعة" /></span>
            </li>
            <li>
              <i className="ph-light ph-baby" aria-hidden="true" />
              <span><Bi en="Gynaecology, obstetrics and fertility" ar="نساء وتوليد وحقن مجهري" /></span>
            </li>
            <li>
              <i className="ph-light ph-sparkle" aria-hidden="true" />
              <span><Bi en="Aesthetics, skin and body contouring" ar="تجميل وجلدية ونحت الجسم" /></span>
            </li>
            <li>
              <i className="ph-light ph-ear" aria-hidden="true" />
              <span><Bi en="ENT, nose and sinus surgery" ar="أنف وأذن وحنجرة وجيوب أنفية" /></span>
            </li>
          </ul>
          <div className="m-door__foot">
            <a className="btn btn--light" href="#doctors">
              <Bi en="Browse doctors" ar="تصفح الأطباء" />
              <i className="ph-light ph-arrow-right flip" aria-hidden="true" />
            </a>
            <a className="link" href="#specialties" style={{ color: "#fff" }}>
              <Bi en="All specialties" ar="كل التخصصات" />
              <i className="ph-light ph-arrow-right flip" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export function TeamSection({ aboutImage, whatsapp }: MediaProps & { whatsapp: string | null }) {
  const services = [
    ["ph-syringe", "General anaesthesia", "تخدير عام", "Full preparation, airway management and moment-to-moment vital monitoring.", "تحضير كامل، إدارة مجرى الهواء، ومتابعة لحظية للعلامات الحيوية."],
    ["ph-wave-sine", "Regional & local", "تخدير نصفي وموضعي", "Spinal, epidural, nerve blocks and limb procedures.", "سبينال، إيبيدورال، بلوكات أعصاب، وعمليات الأطراف."],
    ["ph-baby", "Paediatric anaesthesia", "تخدير الأطفال", "Protocols written around weight and age, from infancy upwards.", "بروتوكولات مبنية على الوزن والسن، من الرضع وفوق."],
    ["ph-sun-horizon", "Day-case surgery", "عمليات اليوم الواحد", "Fast, comfortable wake-up so the patient can go home the same day.", "فايقان سريع ومريح بحيث المريض يخرج في نفس اليوم."],
    ["ph-monitor", "Endoscopy & catheterisation", "المناظير والقسطرة", "Sedation with full control of breathing throughout the procedure.", "تخدير خفيف مع تحكم كامل في التنفس خلال الإجراء."],
    ["ph-heartbeat", "Post-operative pain", "ألم ما بعد العملية", "Multimodal analgesia that reduces the need for strong opioids.", "تسكين متعدد الوسائط يقلل الحاجة للمسكنات القوية."],
    ["ph-bed", "Recovery room follow-up", "متابعة في الإفاقة", "The team stays with the case until vitals are stable.", "الفريق بيفضل مع الحالة لحد ما العلامات الحيوية تستقر."],
    ["ph-siren", "Emergency readiness", "جاهزية للطوارئ", "On-call cover, and a plan for the cases nobody schedules.", "تغطية على النداء، وخطة للحالات اللي محدش بيجدولها."],
  ] as const;

  const safety = [
    ["ph-activity", "Advanced monitoring", "أجهزة مراقبة متقدمة", "ECG, oxygen, blood pressure, gases and modern ventilators.", "رسم قلب، أكسجين، ضغط، غازات، وأجهزة تنفس حديثة."],
    ["ph-clipboard-text", "A written plan per case", "خطة تخدير لكل حالة", "Built from the labs, the scans and the medical history.", "مبنية على التحاليل والأشعة والتاريخ المرضي."],
    ["ph-shield-check", "Safety protocols", "بروتوكولات أمان", "An escalation plan, and resuscitation drugs always drawn up.", "خطة للطوارئ، وأدوية إنعاش جاهزة دائمًا."],
    ["ph-file-text", "Full documentation", "توثيق كامل", "A detailed anaesthesia record is handed over after each procedure.", "تقرير تخدير مفصل بيتسلّم بعد كل عملية."],
  ] as const;

  return (
    <section className="m-team sec" id="team">
      <div className="wrap">
        <div className="sec-head">
          <span className="eyebrow"><Bi en="The anaesthesia team" ar="فريق التخدير" /></span>
          <h2>
            <Bi
              en="Anaesthesia at the highest level — from assessment to a safe recovery."
              ar="تخدير بأعلى مستوى، من التقييم لحد ما المريض يفوق بأمان."
            />
          </h2>
          <p className="lead">
            <Bi
              en="The team covers your operating list: pre-anaesthetic assessment, the anaesthetic itself, intra-operative monitoring and post-operative pain control — with a written record for every case."
              ar="الفريق بيغطي جدول العمليات بالكامل: تقييم قبل التخدير، التخدير نفسه، مراقبة داخل العمليات، وتسكين الألم بعد العملية — مع تقرير مكتوب لكل حالة."
            />
          </p>
        </div>

        <div className="m-team__grid">
          <div className="m-team__media" data-fade>
            <figure className="m-team__frame">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={aboutImage} alt="د. محسن ممدوح بالزي الجراحي داخل غرفة العمليات" />
              <figcaption className="m-team__badge">
                <b className="ltr">24/7</b>
                <span>
                  <Bi en="On-call cover for emergencies, alongside the scheduled list." ar="تغطية على النداء للطوارئ، جنب العمليات المجدولة." />
                </span>
              </figcaption>
            </figure>
            <div className="m-team__stat">
              <b><Bi en="Every case, assessed first" ar="كل حالة ليها تقييم قبل التخدير" /></b>
              <span className="small muted">
                <Bi
                  en="Lab results and scans are reviewed before the anaesthetic plan is written — not on the operating table."
                  ar="بنراجع التحاليل والأشعة قبل ما تتكتب خطة التخدير — مش على طاولة العمليات."
                />
              </span>
            </div>
          </div>

          <div>
            <ul className="m-services" data-stagger>
              {services.map(([icon, en, ar, enBody, arBody]) => (
                <li key={icon}>
                  <i className={`ph-light ${icon}`} aria-hidden="true" />
                  <b><Bi en={en} ar={ar} /></b>
                  <span><Bi en={enBody} ar={arBody} /></span>
                </li>
              ))}
            </ul>

            <div className="m-team__where">
              <span><Bi en="Where we work:" ar="بنشتغل في:" /></span>
              <span className="tag"><Bi en="Hospitals" ar="مستشفيات" /></span>
              <span className="tag"><Bi en="Surgical centres" ar="مراكز جراحية" /></span>
              <span className="tag"><Bi en="Dental & aesthetic clinics" ar="عيادات أسنان وتجميل" /></span>
              <span className="tag"><Bi en="Endoscopy units" ar="وحدات مناظير" /></span>
              <span className="tag"><Bi en="IVF & fertility centres" ar="مراكز خصوبة وأطفال أنابيب" /></span>
            </div>
          </div>
        </div>

        <ul className="m-safety" data-stagger>
          {safety.map(([icon, en, ar, enBody, arBody]) => (
            <li key={icon}>
              <i className={`ph-light ${icon}`} aria-hidden="true" />
              <b><Bi en={en} ar={ar} /></b>
              <span><Bi en={enBody} ar={arBody} /></span>
            </li>
          ))}
        </ul>

        <div className="m-team__cta" data-fade>
          <button className="btn" type="button" data-team-request>
            <Bi en="Request an anaesthesia team" ar="اطلب فريق تخدير" />
            <i className="ph-light ph-arrow-right flip" aria-hidden="true" />
          </button>
          {whatsapp && (
            <a
              className="link link--teal"
              href={waLink(whatsapp, WA_TEXT.ar)}
              target="_blank"
              rel="noopener"
            >
              <i className="ph-fill ph-whatsapp-logo" aria-hidden="true" />
              <Bi en="Talk to the team on WhatsApp" ar="كلّم الفريق على واتساب" />
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

export function WhySection() {
  const old = [
    ["Cases postponed because cover is not available.", "عمليات بتتأجل لأن التغطية مش متاحة."],
    ["The anaesthetic plan decided at the last minute.", "خطة التخدير بتتحدد في آخر لحظة."],
    ["Responsibility spread across whoever is on shift.", "المسؤولية موزعة على اللي موجود في الشيفت."],
    ["Pain relief depends on what happens to be available.", "تسكين الألم بيعتمد على المتاح ساعتها."],
    ["A short or missing anaesthesia record.", "تقرير تخدير مختصر أو مش موجود."],
  ];
  const next = [
    ["Scheduled cover plus 24/7 on-call.", "تغطية مجدولة وطوارئ ٢٤/٧."],
    ["Assessment and preparation before the surgery day.", "تقييم وتحضير قبل يوم العملية."],
    ["One named team member per operating room.", "فرد مسؤول بالاسم لكل غرفة عمليات."],
    ["A multimodal pain plan, written in advance.", "خطة تسكين متعددة الوسائط، مكتوبة مقدمًا."],
    ["Documented record for every case, kept for follow-up.", "تقرير موثق لكل حالة، محفوظ للمتابعة."],
  ];

  return (
    <section className="m-why sec">
      <div className="wrap">
        <div className="sec-head">
          <span className="eyebrow"><Bi en="Why a full team" ar="ليه فريق كامل" /></span>
          <h2>
            <Bi
              en="The difference between coverage and control of the details."
              ar='الفرق بين تخدير "بيغطي الفترة"، وفريق بيتحكم في التفاصيل.'
            />
          </h2>
        </div>
        <div className="m-compare" data-stagger>
          <div className="m-compare__col m-compare__col--old">
            <h3><Bi en="Without a dedicated team" ar="من غير فريق تخدير متخصص" /></h3>
            <ul>
              {old.map(([en, ar]) => (
                <li key={en}>
                  <i className="ph-light ph-x" aria-hidden="true" />
                  <span><Bi en={en} ar={ar} /></span>
                </li>
              ))}
            </ul>
          </div>
          <div className="m-compare__col m-compare__col--new">
            <h3><Bi en="With Dr. Mohsen's team" ar="مع فريق د. محسن ممدوح" /></h3>
            <ul>
              {next.map(([en, ar]) => (
                <li key={en}>
                  <i className="ph-light ph-check" aria-hidden="true" />
                  <span><Bi en={en} ar={ar} /></span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ProcessSection() {
  const steps = [
    {
      n: "01",
      en: "You send the request online",
      ar: "تبعت الطلب أونلاين",
      enBody: "Pick the specialty, the doctor and the time that suits you — or ask for the whole team to cover your facility. It takes a couple of minutes.",
      arBody: "اختار التخصص والطبيب والوقت اللي يناسبك — أو اطلب الفريق كامل يغطي منشأتك. الموضوع دقيقتين.",
      points: [["Clinic, procedure or team cover", "كشف، عملية، أو تغطية فريق"], ["Available times only", "مواعيد متاحة فعليًا"]],
    },
    {
      n: "02",
      en: "You upload your labs and scans",
      ar: "ترفع تحاليلك وأشعتك",
      enBody: "Attach whatever you already have as a PDF or a photo. The team works from the real numbers, not from a description on the phone.",
      arBody: "ارفع اللي عندك PDF أو صورة. الفريق بيشتغل على الأرقام الحقيقية، مش على وصف في التليفون.",
      points: [["Up to 10 files", "لحد ١٠ ملفات"], ["Read only by the treating team", "بيقرأه الفريق المعالج بس"]],
    },
    {
      n: "03",
      en: "The file is reviewed before the visit",
      ar: "الملف بيتراجع قبل الزيارة",
      enBody: "The team reads the file first and comes back with the slot confirmation — and, for a procedure, an anaesthetic plan built around your history.",
      arBody: "الفريق يقرأ الملف الأول ويرجعلك بتأكيد الموعد — وللعمليات، خطة تخدير مبنية على تاريخك المرضي.",
      points: [["Confirmation on WhatsApp", "تأكيد على واتساب"], ["A written plan per case", "خطة مكتوبة لكل حالة"]],
    },
    {
      n: "04",
      en: "The examination, or the anaesthetic",
      ar: "الكشف، أو التخدير",
      enBody: "For a clinic visit, the doctor examines you. For a procedure, the team gives the anaesthetic with full monitoring — at your facility or ours.",
      arBody: "في الكشف، الطبيب بيكشف عليك. وفي العمليات، الفريق يدّي التخدير بمراقبة كاملة — في منشأتك أو عندنا.",
      points: [["Moment-to-moment monitoring", "مراقبة لحظية"], ["Escalation plan ready", "خطة طوارئ جاهزة"]],
    },
    {
      n: "05",
      en: "Follow-up and a pain plan",
      ar: "متابعة وخطة تسكين",
      enBody: "After the procedure the team stays until you are stable, hands over a written record, and leaves a plan that keeps the pain under control at home.",
      arBody: "بعد العملية الفريق يفضل معاك لحد ما تستقر، ويسلّم تقرير مكتوب، ويسيب خطة تخلي الألم تحت السيطرة في البيت.",
      points: [["Multimodal analgesia", "تسكين متعدد الوسائط"], ["A follow-up visit to measure response", "زيارة متابعة لقياس الاستجابة"]],
    },
  ];

  return (
    <section className="m-process sec" id="process">
      <div className="wrap">
        <div className="m-process__grid">
          <div className="m-process__aside">
            <span className="eyebrow"><Bi en="How it works" ar="بيحصل إزاي؟" /></span>
            <h2 style={{ marginTop: 14 }}><Bi en="From the request to the follow-up." ar="من الطلب لحد المتابعة." /></h2>
            <p className="lead">
              <Bi
                en="The same path whether you are booking a clinic visit or asking a hospital to be covered — nothing important happens on the day itself."
                ar="نفس الطريق سواء بتحجز كشف في العيادة أو بتطلب تغطية لمستشفى — مفيش حاجة مهمة بتتحصل في يوم الزيارة نفسه."
              />
            </p>
            <a className="btn" href="#booking">
              <Bi en="Start the request" ar="ابدأ الطلب" />
              <i className="ph-light ph-arrow-right flip" aria-hidden="true" />
            </a>
          </div>

          <div className="m-steps" data-stagger>
            {steps.map((step) => (
              <div className="m-step" key={step.n}>
                <span className="m-step__n ltr">{step.n}</span>
                <div>
                  <h3><Bi en={step.en} ar={step.ar} /></h3>
                  <p><Bi en={step.enBody} ar={step.arBody} /></p>
                  <ul>
                    {step.points.map(([en, ar]) => (
                      <li key={en}><Bi en={en} ar={ar} /></li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function PainSection({ whatsapp }: { whatsapp: string | null }) {
  const points = [
    ["A full assessment before any injection", "تقييم كامل قبل أي حقن"],
    ["Image-guided, so the needle goes where it should", "موجهة بالأشعة، فالإبرة تروح لمكانها الصح"],
    ["A plan that reduces strong painkillers, not adds to them", "خطة تقلل المسكنات القوية، مش تزيدها"],
    ["Follow-up to measure the response honestly", "متابعة لقياس الاستجابة بصراحة"],
  ];

  return (
    <section className="m-pain sec">
      <div className="wrap">
        <div>
          <span className="eyebrow" style={{ color: "#CFF0EC" }}>
            <Bi en="Chronic pain" ar="الألم المزمن" />
          </span>
          <h2 style={{ marginTop: 14 }}>
            <Bi
              en="When the pain has outlasted the injury, that is its own specialty."
              ar="لما الألم يفضل بعد ما الإصابة خفت، ده تخصص لوحده."
            />
          </h2>
          <p>
            <Bi
              en="Back, neck and nerve pain that has not settled with ordinary treatment is assessed properly, treated with targeted injections where they help, and reviewed until the numbers move."
              ar="ألم الظهر والرقبة والأعصاب اللي مجابش نتيجة مع العلاج العادي، بيتقيّم بجدية، ويتعالج بحقن موجهة لو هي اللي هتفيد، ويتابع لحد ما النتيجة تتحسن."
            />
          </p>
          <ul>
            {points.map(([en, ar]) => (
              <li key={en}>
                <i className="ph-light ph-check" aria-hidden="true" />
                <span><Bi en={en} ar={ar} /></span>
              </li>
            ))}
          </ul>
          <div className="m-pain__cta">
            <a className="btn btn--light" href="#booking">
              <Bi en="Book a pain assessment" ar="احجز تقييم ألم" />
              <i className="ph-light ph-arrow-right flip" aria-hidden="true" />
            </a>
            {whatsapp && (
              <a className="link" href={waLink(whatsapp, WA_TEXT.ar)} target="_blank" rel="noopener">
                <Bi en="Ask a question first" ar="اسأل الأول" />
                <i className="ph-light ph-arrow-right flip" aria-hidden="true" />
              </a>
            )}
          </div>
        </div>
        <figure className="m-pain__fig">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/dr-mohsen-headshot.png" alt="د. محسن ممدوح — عيادة علاج الألم" />
        </figure>
      </div>
    </section>
  );
}

export function FaqSection({ faqs }: { faqs: Faq[] }) {
  return (
    <section className="m-faq sec" id="faq">
      <div className="wrap">
        <div className="m-faq__grid">
          <div>
            <span className="eyebrow"><Bi en="Questions" ar="أسئلة" /></span>
            <h2 style={{ marginTop: 14 }}>
              <Bi en="The things people ask before they book." ar="الحاجات اللي بتتسأل قبل الحجز." />
            </h2>
            <p className="lead">
              <Bi
                en="If your question is not here, message the team on WhatsApp — a real person answers during working hours."
                ar="لو سؤالك مش هنا، كلّم الفريق على واتساب — حد حقيقي بيرد خلال ساعات العمل."
              />
            </p>
          </div>

          <div data-stagger>
            {faqs.map((faq, index) => (
              <details key={faq.id} open={index === 0}>
                <summary>
                  <span><Bi en={faq.questionEn} ar={faq.questionAr} /></span>
                  <i className="ph-light ph-plus" aria-hidden="true" />
                </summary>
                <div>
                  <p><Bi en={faq.answerEn} ar={faq.answerAr} /></p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function ContactSection({
  locale,
  phone,
  whatsapp,
}: {
  locale: Locale;
  phone: string | null;
  whatsapp: string | null;
}) {
  return (
    <section className="m-contact sec" id="contact">
      <div className="wrap">
        <div className="sec-head sec-head--split">
          <div>
            <span className="eyebrow"><Bi en="Get in touch" ar="تواصل معانا" /></span>
            <h2 style={{ marginTop: 14 }}><Bi en="Book online, or just call." ar="احجز أونلاين، أو اتصل ببساطة." /></h2>
          </div>
          <p className="lead">
            <Bi
              en="The fastest route is the online request above, because the file arrives with it. For anything urgent, the phone is always answered first."
              ar="أسرع طريق هو الطلب الأونلاين اللي فوق، لأن الملف بيوصل معاه. ولو في حاجة مستعجلة، التليفون دايمًا بيترد عليه الأول."
            />
          </p>
        </div>

        <div className="m-contact__grid" data-stagger>
          <div className="m-contact__card">
            <i className="ph-light ph-phone-call" aria-hidden="true" />
            <b><Bi en="Phone" ar="التليفون" /></b>
            <p><Bi en="Urgent cases and same-day questions." ar="الحالات المستعجلة وأسئلة نفس اليوم." /></p>
            {phone && (
              <a className="link ltr" href={`tel:${phoneDigits(phone)}`}>
                <Bi en={phone} ar={phone} />
              </a>
            )}
          </div>
          <div className="m-contact__card">
            <i className="ph-fill ph-whatsapp-logo" aria-hidden="true" />
            <b><Bi en="WhatsApp" ar="واتساب" /></b>
            <p><Bi en="Send a photo of your labs and get a reply." ar="ابعت صورة تحاليلك واستلم الرد." /></p>
            {whatsapp && (
              <a className="link" href={waLink(whatsapp, WA_TEXT[locale])} target="_blank" rel="noopener">
                <Bi en="Open WhatsApp" ar="افتح واتساب" />
              </a>
            )}
          </div>
          <div className="m-contact__card">
            <i className="ph-light ph-map-pin" aria-hidden="true" />
            <b><Bi en="Where we work" ar="أماكن العمل" /></b>
            <p>
              <Bi
                en="Mansoura, Tanta, Cairo and Alexandria — plus anaesthesia cover at your own facility."
                ar="المنصورة وطنطا والقاهرة والإسكندرية — وتغطية تخدير في منشأتك."
              />
            </p>
            <a className="link" href="#doctors"><Bi en="See doctors & cities" ar="شوف الأطباء والمدن" /></a>
          </div>
          <div className="m-contact__card">
            <i className="ph-light ph-clock" aria-hidden="true" />
            <b><Bi en="Hours" ar="المواعيد" /></b>
            <p>
              <Bi
                en="Saturday to Thursday, 10:00–20:00. Emergency anaesthesia cover runs 24/7."
                ar="السبت للخميس، ١٠ صباحًا – ٨ مساءً. وتغطية التخدير للطوارئ ٢٤/٧."
              />
            </p>
            <a className="link" href="#booking"><Bi en="Book a slot" ar="احجز ميعاد" /></a>
          </div>
        </div>
      </div>
    </section>
  );
}
