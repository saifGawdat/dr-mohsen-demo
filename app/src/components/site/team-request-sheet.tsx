"use client";

import * as React from "react";
import { Bi } from "@/components/site/bilingual";
import { arabicDigits, waLink } from "@/lib/site-format";

interface Props {
  locale: "ar" | "en";
  whatsapp: string | null;
}

interface TeamState {
  coverage?: string;
  facility?: string;
  facilityCity?: string;
  mix?: string[];
  cases?: string;
  from?: string;
  to?: string;
  daysPerWeek?: string;
  role?: string;
  name?: string;
  phone?: string;
  notes?: string;
  consent?: boolean;
  files: File[];
}

const COVERAGE = [
  {
    value: "full",
    icon: "ph-clock",
    en: "Full cover",
    ar: "تغطية كاملة",
    enBody: "Scheduled lists through the week, plus on-call for emergencies.",
    arBody: "عمليات مجدولة خلال الأسبوع، مع على النداء للطوارئ.",
  },
  {
    value: "scheduled",
    icon: "ph-calendar-check",
    en: "Scheduled lists only",
    ar: "عمليات مجدولة بس",
    enBody: "Fixed days per week, a member per operating room.",
    arBody: "أيام محددة في الأسبوع، وفرد لكل غرفة عمليات.",
  },
  {
    value: "oncall",
    icon: "ph-siren",
    en: "On-call cover",
    ar: "تغطية على النداء",
    enBody: "For emergencies outside a fixed list.",
    arBody: "للطوارئ بره الجدول الثابت.",
  },
  {
    value: "single",
    icon: "ph-user-focus",
    en: "A one-off case",
    ar: "حالة لمرة واحدة",
    enBody: "A single procedure that needs an anaesthetist.",
    arBody: "عملية واحدة محتاجة طبيب تخدير.",
  },
] as const;

const MIX = [
  { value: "dental", en: "Dental", ar: "أسنان" },
  { value: "gyn", en: "Gynaecology", ar: "نساء وتوليد" },
  { value: "aesthetic", en: "Aesthetics", ar: "تجميل" },
  { value: "ent", en: "ENT", ar: "أنف وأذن" },
  { value: "general", en: "General surgery", ar: "جراحة عامة" },
  { value: "gastro", en: "Endoscopy", ar: "مناظير" },
  { value: "peds", en: "Paediatrics", ar: "أطفال" },
  { value: "pain", en: "Pain procedures", ar: "إجراءات علاج ألم" },
] as const;

const PHONE_RE = /^(?:\+?20)?01[0125]\d{8}$/;

function westernDigits(value: string): string {
  return value
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/[^\d+]/g, "");
}

export function TeamRequestSheet({ locale, whatsapp }: Props) {
  const [open, setOpen] = React.useState(false);
  const [step, setStep] = React.useState(1);
  const [state, setState] = React.useState<TeamState>({ files: [] });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [stepError, setStepError] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [reference, setReference] = React.useState("");
  const [dragOver, setDragOver] = React.useState(false);
  const fileInput = React.useRef<HTMLInputElement>(null);
  const closeButton = React.useRef<HTMLButtonElement>(null);

  const t = React.useCallback(
    (en: string, ar: string) => (locale === "ar" ? ar : en),
    [locale]
  );

  const close = React.useCallback(() => {
    setOpen(false);
    document.body.style.overflow = "";
  }, []);

  React.useEffect(() => {
    const onOpen = () => {
      setOpen(true);
      document.body.style.overflow = "hidden";
      window.setTimeout(() => closeButton.current?.focus(), 120);
    };
    window.addEventListener("mm:open-team", onOpen);
    return () => window.removeEventListener("mm:open-team", onOpen);
  }, []);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  const set = (patch: Partial<TeamState>) => {
    setState((previous) => ({ ...previous, ...patch }));
    setErrors({});
    setStepError("");
  };

  const toggle = (value: string) => {
    setState((previous) => {
      const list = previous.mix ? [...previous.mix] : [];
      const index = list.indexOf(value);
      if (index > -1) list.splice(index, 1);
      else list.push(value);
      return { ...previous, mix: list };
    });
  };

  const coverageLabel = (value?: string) => {
    const found = COVERAGE.find((item) => item.value === value);
    return found ? t(found.en, found.ar) : "";
  };

  const rows = React.useMemo(() => {
    const out: [string, string][] = [
      [t("Coverage", "نوع التغطية"), coverageLabel(state.coverage)],
      [t("Facility", "المنشأة"), (state.facility ?? "").trim()],
      [t("City", "المدينة"), (state.facilityCity ?? "").trim()],
      [
        t("Case mix", "نوع العمليات"),
        (state.mix ?? [])
          .map((value) => {
            const found = MIX.find((item) => item.value === value);
            return found ? t(found.en, found.ar) : value;
          })
          .join(locale === "ar" ? "، " : ", "),
      ],
      [t("Expected cases", "عدد الحالات"), (state.cases ?? "").trim()],
      [t("From", "من تاريخ"), state.from ?? ""],
      [t("To", "إلى تاريخ"), state.to ?? ""],
      [t("Days per week", "أيام في الأسبوع"), (state.daysPerWeek ?? "").trim()],
      [t("Contact person", "مسؤول التواصل"), (state.name ?? "").trim()],
      [t("Role", "الوظيفة"), (state.role ?? "").trim()],
      [t("Mobile", "الموبايل"), (state.phone ?? "").trim()],
      [t("Uploaded schedule", "الجدول / الحالات المرفوعة"), state.files.length ? String(state.files.length) : ""],
      [t("Notes", "ملاحظات"), (state.notes ?? "").trim()],
    ];
    return out;
  }, [state, locale, t]); // eslint-disable-line react-hooks/exhaustive-deps

  const notSet = t("Not set yet", "لم يتحدد بعد");

  const addFiles = (list: FileList | File[]) => {
    const incoming = Array.from(list);
    let added = 0;
    let message = "";
    const next = [...state.files];

    for (const file of incoming) {
      if (next.length >= 10) break;
      if (!/^(image\/(jpeg|png|jpg|webp|heic|heif)|application\/pdf)/i.test(file.type || "")) {
        message = t("Only PDF or image files are accepted.", "نقبل ملفات PDF أو صور فقط.");
        continue;
      }
      if (file.size > 15 * 1024 * 1024) {
        message = t("Each file must stay under 15 MB.", "حجم الملف لا يزيد عن ١٥ ميجا.");
        continue;
      }
      next.push(file);
      added += 1;
    }

    setState((previous) => ({ ...previous, files: next }));
    if (added) setErrors((previous) => ({ ...previous, files: "" }));
    if (message) setErrors((previous) => ({ ...previous, files: message }));
  };

  const checkStep = (current: number): boolean => {
    const nextErrors: Record<string, string> = {};
    let message = "";

    if (current === 1 && !state.coverage) {
      message = t("Please choose: What kind of cover?", "من فضلك اختر: نوع التغطية");
    }
    if (current === 2 && !(state.facility ?? "").trim()) {
      nextErrors.facility = t("This field is required.", "الحقل ده مطلوب.");
    }
    if (current === 3) {
      if (!state.from) nextErrors.from = t("This field is required.", "الحقل ده مطلوب.");
      if (!(state.name ?? "").trim()) nextErrors.name = t("This field is required.", "الحقل ده مطلوب.");
      const phone = westernDigits(state.phone ?? "");
      if (!phone) nextErrors.phone = t("This field is required.", "الحقل ده مطلوب.");
      else if (!PHONE_RE.test(phone)) {
        nextErrors.phone = t(
          "Enter an Egyptian mobile number, e.g. 010 1234 5678.",
          "اكتب رقم موبايل مصري صحيح، مثال: ٠١٠ ١٢٣٤ ٥٦٧٨."
        );
      }
    }
    if (current === 4 && !state.consent) {
      nextErrors.consent = t("Please accept to continue.", "من فضلك وافق على الشروط للمتابعة.");
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length && !message) {
      message = t("Please complete the highlighted items.", "من فضلك استكمل البيانات المطلوبة.");
    }
    setStepError(message);
    return !message && Object.keys(nextErrors).length === 0;
  };

  const next = () => {
    if (checkStep(step)) setStep((current) => Math.min(4, current + 1));
  };

  const back = () => {
    setErrors({});
    setStepError("");
    setStep((current) => Math.max(1, current - 1));
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!checkStep(4)) return;

    setSubmitting(true);
    setStepError("");
    const body = new FormData();
    body.set("name", (state.name ?? "").trim());
    body.set("phone", (state.phone ?? "").trim());
    body.set("facility", (state.facility ?? "").trim());
    body.set("facilityCity", (state.facilityCity ?? "").trim());
    body.set("role", (state.role ?? "").trim());
    body.set("coverage", state.coverage ?? "");
    body.set("caseMix", JSON.stringify(state.mix ?? []));
    body.set("fromDate", state.from ?? "");
    body.set("toDate", state.to ?? "");
    body.set("daysPerWeek", (state.daysPerWeek ?? "").trim());
    body.set("casesPerWeek", (state.cases ?? "").trim());
    body.set("notes", (state.notes ?? "").trim());
    body.set("consent", "true");
    state.files.forEach((file) => body.append("files", file));

    try {
      const response = await fetch("/api/team-requests", { method: "POST", body });
      const payload = (await response.json()) as { number?: string; error?: string };
      if (!response.ok || !payload.number) {
        setStepError(payload.error || t("Something went wrong. Please try again.", "حدث خطأ. جرّب تاني."));
        setSubmitting(false);
        return;
      }
      setReference(payload.number);
      setDone(true);
      setSubmitting(false);
    } catch {
      setStepError(t("Could not reach the server. Check your connection and try again.", "مش قادرين نوصل للسيرفر. اتأكد من الاتصال وجرّب تاني."));
      setSubmitting(false);
    }
  };

  const reset = () => {
    setState({ files: [] });
    setStep(1);
    setDone(false);
    setReference("");
    setErrors({});
    setStepError("");
    if (fileInput.current) fileInput.current.value = "";
  };

  const whatsappSummary = () => {
    if (!whatsapp) return "#contact";
    const lines = [
      t("New team request", "طلب فريق تخدير"),
      "—",
      ...rows.filter(([, value]) => value).map(([label, value]) => `• ${label}: ${value}`),
    ];
    if (state.files.length) lines.push(`• ${t("Files", "الملفات")}: ${state.files.length}`);
    if (reference) lines.push(`• ${t("Reference", "رقم الطلب")}: ${reference}`);
    return waLink(whatsapp, lines.join("\n"));
  };

  return (
    <div className={`m-sheet${open ? " is-open" : ""}`} data-sheet role="dialog" aria-modal="true" aria-labelledby="sheet-title">
      <div className="m-sheet__scrim" onClick={close} />
      <div className="m-sheet__box">
        <aside className="m-sheet__aside">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="bg" src="/brand/dr-mohsen-scrubs.png" alt="" />
          <span className="eyebrow" style={{ color: "#9FD8D3" }}>
            <Bi en="For facilities" ar="للمنشآت الطبية" />
          </span>
          <h3 id="sheet-title">
            <Bi en="Request anaesthesia cover" ar="اطلب تغطية تخدير" />
          </h3>
          <p>
            <Bi
              en="Four short steps: the cover you need, the facility, the dates, then confirm."
              ar="أربع خطوات قصيرة: التغطية المطلوبة، المنشأة، التواريخ، وبعدين التأكيد."
            />
          </p>
          <ul>
            <li>
              <i className="ph-light ph-check" aria-hidden="true" />
              <span><Bi en="Scheduled lists and 24/7 emergencies" ar="عمليات مجدولة وطوارئ ٢٤/٧" /></span>
            </li>
            <li>
              <i className="ph-light ph-check" aria-hidden="true" />
              <span><Bi en="A dedicated member per operating room" ar="فرد مخصص لكل غرفة عمليات" /></span>
            </li>
            <li>
              <i className="ph-light ph-check" aria-hidden="true" />
              <span><Bi en="A written anaesthesia record per case" ar="تقرير تخدير مكتوب لكل حالة" /></span>
            </li>
          </ul>
        </aside>

        <div className="m-sheet__main">
          <button ref={closeButton} className="m-sheet__close" type="button" onClick={close} aria-label="إغلاق">
            <i className="ph-light ph-x" aria-hidden="true" />
          </button>

          <div className={done ? "is-done" : ""} data-booking="team">
              <div className="m-book__prog" data-hide-on-done>
                <ol className="m-book__steps">
                  {[
                    [t("Cover", "التغطية")],
                    [t("Facility", "المنشأة")],
                    [t("Schedule", "الجدول")],
                    [t("Confirm", "التأكيد")],
                  ].map(([label], index) => (
                    <li
                      key={label}
                      className={index + 1 === step ? "is-on" : index + 1 < step ? "is-done" : ""}
                    >
                      <span>{label}</span>
                    </li>
                  ))}
                </ol>
                <span className="m-book__count">
                  {locale === "ar"
                    ? `الخطوة ${arabicDigits(step)} من ${arabicDigits(4)}`
                    : `Step ${step} of 4`}
                </span>
              </div>
              <div className="m-book__err" role="alert">{stepError}</div>

              <form className="m-book__body" noValidate onSubmit={submit} data-hide-on-done>
                <div className={`m-book__panel${step === 1 ? " is-current" : ""}`} data-step="1">
                  <h3><Bi en="What kind of cover?" ar="نوع التغطية إيه؟" /></h3>
                  <p className="hint">
                    <Bi
                      en="Pick the closest one — the details get agreed later with the team."
                      ar="اختار الأقرب — والتفاصيل بتتفق عليها بعدين مع الفريق."
                    />
                  </p>
                  <div className="m-picks m-picks--2">
                    {COVERAGE.map((item) => (
                      <button
                        className="m-pick"
                        type="button"
                        key={item.value}
                        aria-pressed={state.coverage === item.value}
                        onClick={() => set({ coverage: item.value })}
                      >
                        <b>
                          <i className={`ph-light ${item.icon}`} aria-hidden="true" />
                          <Bi en={item.en} ar={item.ar} />
                        </b>
                        <span><Bi en={item.enBody} ar={item.arBody} /></span>
                      </button>
                    ))}
                  </div>
                  <div className="m-book__nav">
                    <span className="spacer" />
                    <button className="btn" type="button" onClick={next}>
                      <Bi en="Continue" ar="متابعة" />
                      <i className="ph-light ph-arrow-right flip" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <div className={`m-book__panel${step === 2 ? " is-current" : ""}`} data-step="2">
                  <h3><Bi en="Which facility?" ar="المنشأة إيه؟" /></h3>
                  <p className="hint">
                    <Bi
                      en="Enough for the team to know where the cover is needed and what you operate on."
                      ar="اللي يكفي الفريق يعرف التغطية فين ونوع العمليات اللي بتتعمل."
                    />
                  </p>
                  <div className="m-form-grid">
                    <div className="m-field">
                      <label htmlFor="tm-facility"><Bi en="Facility name" ar="اسم المنشأة" /></label>
                      <input
                        id="tm-facility"
                        name="facility"
                        type="text"
                        autoComplete="organization"
                        value={state.facility ?? ""}
                        onChange={(event) => set({ facility: event.target.value })}
                      />
                      <span data-err="facility">{errors.facility}</span>
                    </div>
                    <div className="m-field">
                      <label htmlFor="tm-city"><Bi en="City" ar="المدينة" /></label>
                      <input
                        id="tm-city"
                        name="facilityCity"
                        type="text"
                        autoComplete="address-level2"
                        value={state.facilityCity ?? ""}
                        onChange={(event) => set({ facilityCity: event.target.value })}
                      />
                      <span data-err="facilityCity">{errors.facilityCity}</span>
                    </div>
                  </div>
                  <div className="m-sub">
                    <span className="m-sub__label"><Bi en="Case mix to be covered" ar="نوع العمليات المطلوب تغطيتها" /></span>
                    <div className="m-chips">
                      {MIX.map((item) => (
                        <button
                          className="m-chip"
                          type="button"
                          key={item.value}
                          aria-pressed={(state.mix ?? []).includes(item.value)}
                          onClick={() => toggle(item.value)}
                        >
                          <Bi en={item.en} ar={item.ar} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="m-form-grid">
                    <div className="m-field">
                      <label htmlFor="tm-cases"><Bi en="Expected cases per week" ar="عدد الحالات في الأسبوع" /></label>
                      <input
                        id="tm-cases"
                        name="cases"
                        type="text"
                        inputMode="numeric"
                        placeholder="10"
                        value={state.cases ?? ""}
                        onChange={(event) => set({ cases: event.target.value })}
                      />
                      <span data-err="cases">{errors.cases}</span>
                    </div>
                  </div>
                  <div className="m-book__nav">
                    <button className="m-back" type="button" onClick={back}>
                      <i className="ph-light ph-arrow-left flip" aria-hidden="true" />
                      <Bi en="Back" ar="رجوع" />
                    </button>
                    <span className="spacer" />
                    <button className="btn" type="button" onClick={next}>
                      <Bi en="Continue" ar="متابعة" />
                      <i className="ph-light ph-arrow-right flip" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <div className={`m-book__panel${step === 3 ? " is-current" : ""}`} data-step="3">
                  <h3><Bi en="Dates and contact" ar="التواريخ والتواصل" /></h3>
                  <p className="hint">
                    <Bi
                      en="When the cover should start, for how long, and who the team should speak to."
                      ar="التغطية تبدأ إمتى، لمدة قد إيه، والفريق يتكلم مع مين."
                    />
                  </p>
                  <div className="m-form-grid">
                    <div className="m-field">
                      <label htmlFor="tm-from"><Bi en="Cover needed from" ar="التغطية من تاريخ" /></label>
                      <input
                        id="tm-from"
                        name="from"
                        type="date"
                        value={state.from ?? ""}
                        onChange={(event) => set({ from: event.target.value })}
                      />
                      <span data-err="from">{errors.from}</span>
                    </div>
                    <div className="m-field">
                      <label htmlFor="tm-to"><Bi en="Until" ar="إلى تاريخ" /></label>
                      <input
                        id="tm-to"
                        name="to"
                        type="date"
                        value={state.to ?? ""}
                        onChange={(event) => set({ to: event.target.value })}
                      />
                      <span data-err="to">{errors.to}</span>
                    </div>
                    <div className="m-field">
                      <label htmlFor="tm-dpw"><Bi en="Days per week" ar="أيام في الأسبوع" /></label>
                      <input
                        id="tm-dpw"
                        name="daysPerWeek"
                        type="text"
                        inputMode="numeric"
                        placeholder="3"
                        value={state.daysPerWeek ?? ""}
                        onChange={(event) => set({ daysPerWeek: event.target.value })}
                      />
                      <span data-err="daysPerWeek">{errors.daysPerWeek}</span>
                    </div>
                    <div className="m-field">
                      <label htmlFor="tm-role"><Bi en="Your role" ar="وظيفتك" /></label>
                      <input
                        id="tm-role"
                        name="role"
                        type="text"
                        placeholder="المدير الطبي / التشغيل"
                        value={state.role ?? ""}
                        onChange={(event) => set({ role: event.target.value })}
                      />
                      <span data-err="role">{errors.role}</span>
                    </div>
                    <div className="m-field">
                      <label htmlFor="tm-name"><Bi en="Contact person" ar="مسؤول التواصل" /></label>
                      <input
                        id="tm-name"
                        name="name"
                        type="text"
                        autoComplete="name"
                        value={state.name ?? ""}
                        onChange={(event) => set({ name: event.target.value })}
                      />
                      <span data-err="name">{errors.name}</span>
                    </div>
                    <div className="m-field">
                      <label htmlFor="tm-phone"><Bi en="Mobile" ar="الموبايل" /></label>
                      <input
                        id="tm-phone"
                        name="phone"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        placeholder="010 1234 5678"
                        value={state.phone ?? ""}
                        onChange={(event) => set({ phone: event.target.value })}
                      />
                      <span data-err="phone">{errors.phone}</span>
                    </div>
                    <div className="m-field full">
                      <label htmlFor="tm-notes"><Bi en="Notes" ar="ملاحظات" /></label>
                      <textarea
                        id="tm-notes"
                        name="notes"
                        rows={2}
                        value={state.notes ?? ""}
                        onChange={(event) => set({ notes: event.target.value })}
                      />
                      <span data-err="notes">{errors.notes}</span>
                    </div>
                  </div>

                  <div
                    className={`m-up${dragOver ? " is-drag" : ""}`}
                    onClick={() => fileInput.current?.click()}
                    onDragEnter={(event) => {
                      event.preventDefault();
                      setDragOver(true);
                    }}
                    onDragOver={(event) => {
                      event.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={(event) => {
                      event.preventDefault();
                      setDragOver(false);
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      setDragOver(false);
                      if (event.dataTransfer?.files) addFiles(event.dataTransfer.files);
                    }}
                  >
                    <i className="ph-light ph-cloud-arrow-up" aria-hidden="true" />
                    <b><Bi en="Upload the list or case mix (optional)" ar="ارفع الجدول أو قائمة الحالات (اختياري)" /></b>
                    <span><Bi en="PDF or image · up to 10 files" ar="PDF أو صورة · لحد ١٠ ملفات" /></span>
                    <span className="btn btn--ghost btn--sm">
                      <i className="ph-light ph-upload-simple" aria-hidden="true" />
                      <Bi en="Choose files" ar="اختار الملفات" />
                    </span>
                    <input
                      ref={fileInput}
                      className="sr-only"
                      type="file"
                      multiple
                      accept="image/*,application/pdf"
                      onChange={(event) => {
                        if (event.target.files) addFiles(event.target.files);
                        event.target.value = "";
                      }}
                    />
                  </div>
                  <p className="note" style={{ color: "var(--err)", marginTop: 10 }}>{errors.files}</p>
                  <div className="m-files">
                    {state.files.map((file, index) => (
                      <div className="m-file" key={`${file.name}-${index}`}>
                        <i
                          className={`ph-light ${/pdf/i.test(file.type) ? "ph-file-pdf" : "ph-file-image"}`}
                          aria-hidden="true"
                        />
                        <span className="m-file__meta">
                          <b>{file.name}</b>
                          <span>{Math.max(1, Math.round(file.size / 1024))} KB</span>
                        </span>
                        <button
                          className="m-file__x"
                          type="button"
                          aria-label={t("Remove", "حذف")}
                          onClick={(event) => {
                            event.stopPropagation();
                            setState((previous) => ({
                              ...previous,
                              files: previous.files.filter((_, position) => position !== index),
                            }));
                          }}
                        >
                          <i className="ph-light ph-x" aria-hidden="true" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="m-book__nav">
                    <button className="m-back" type="button" onClick={back}>
                      <i className="ph-light ph-arrow-left flip" aria-hidden="true" />
                      <Bi en="Back" ar="رجوع" />
                    </button>
                    <span className="spacer" />
                    <button className="btn" type="button" onClick={next}>
                      <Bi en="Continue" ar="متابعة" />
                      <i className="ph-light ph-arrow-right flip" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <div className={`m-book__panel${step === 4 ? " is-current" : ""}`} data-step="4">
                  <h3><Bi en="Review and send" ar="راجع وابعت" /></h3>
                  <p className="hint">
                    <Bi
                      en="The team replies with cover options and a quote for the facility — never a price per case on this page."
                      ar="الفريق يرد بخيارات التغطية وعرض سعر للمنشأة — ومفيش سعر لكل حالة في الصفحة دي."
                    />
                  </p>
                  <dl className="m-review">
                    {rows.map(([label, value]) => (
                      <div key={label}>
                        <dt>{label}</dt>
                        <dd className={value ? undefined : "empty"}>{value || notSet}</dd>
                      </div>
                    ))}
                  </dl>
                  <label className="m-consent">
                    <input
                      type="checkbox"
                      name="consent"
                      checked={!!state.consent}
                      onChange={(event) => set({ consent: event.target.checked })}
                    />
                    <span>
                      <Bi
                        en="I agree that the team may contact me on this number about the cover request."
                        ar="أوافق إن الفريق يتواصل معايا على الرقم ده بخصوص طلب التغطية."
                      />
                    </span>
                  </label>
                  <p className="note" style={{ color: "var(--err)" }}>{errors.consent}</p>
                  <div className="m-book__nav">
                    <button className="m-back" type="button" onClick={back}>
                      <i className="ph-light ph-arrow-left flip" aria-hidden="true" />
                      <Bi en="Back" ar="رجوع" />
                    </button>
                    <span className="spacer" />
                    <button className={`btn${submitting ? " is-loading" : ""}`} type="submit" disabled={submitting}>
                      <i className="ph-light ph-paper-plane-tilt flip" aria-hidden="true" />
                      <Bi en="Send the request" ar="ابعت الطلب" />
                    </button>
                  </div>
                </div>
              </form>

              <div className="m-book__body m-success" data-success>
                <span className="m-success__ico">
                  <i className="ph-light ph-check-circle" aria-hidden="true" />
                </span>
                <h3><Bi en="Request received" ar="تم استلام الطلب" /></h3>
                <p>
                  <Bi
                    en="The team will come back to you with cover options and the facility quote during working hours."
                    ar="الفريق هيرجعلك بخيارات التغطية وعرض السعر للمنشأة خلال ساعات العمل."
                  />
                </p>
                <div className="m-success__ref">
                  <span><Bi en="Your reference" ar="رقم الطلب" /></span> <b>{reference || "—"}</b>
                </div>
                <div className="m-success__actions">
                  <a className="btn btn--wa" href={whatsappSummary()} target="_blank" rel="noopener">
                    <i className="ph-fill ph-whatsapp-logo" aria-hidden="true" />
                    <Bi en="Send on WhatsApp" ar="ابعت على واتساب" />
                  </a>
                  <button className="btn btn--ghost" type="button" onClick={reset}>
                    <i className="ph-light ph-arrow-counter-clockwise" aria-hidden="true" />
                    <Bi en="New request" ar="طلب جديد" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
}
