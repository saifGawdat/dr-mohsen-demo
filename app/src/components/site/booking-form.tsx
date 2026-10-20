"use client";

import * as React from "react";
import { Bi } from "@/components/site/bilingual";
import {
  arabicDigits,
  dayParts,
  isoDate,
  longDate,
  phoneDigits,
  timeLabel,
  waLink,
} from "@/lib/site-format";

export interface BookingDoctor {
  id: string;
  nameEn: string;
  nameAr: string;
  specialtySlug: string;
}

export interface BookingSpecialty {
  slug: string;
  nameEn: string;
  nameAr: string;
}

interface Props {
  locale: "ar" | "en";
  doctors: BookingDoctor[];
  specialties: BookingSpecialty[];
  whatsapp: string | null;
  phone: string | null;
}

type Service = "clinic" | "surgery" | "team";

interface BookingState {
  service?: Service;
  specialty?: string;
  doctor?: string;
  clinic?: string;
  date?: string;
  time?: string;
  name?: string;
  phone?: string;
  age?: string;
  city?: string;
  complaint?: string;
  conds?: string[];
  notes?: string;
  facility?: string;
  facilityCity?: string;
  mix?: string[];
  from?: string;
  to?: string;
  daysPerWeek?: string;
  cases?: string;
  role?: string;
  consent?: boolean;
  files: File[];
}

const CLINICS = [
  { value: "mansoura", en: "Mansoura", ar: "المنصورة" },
  { value: "tanta", en: "Tanta", ar: "طنطا" },
  { value: "cairo", en: "Cairo", ar: "القاهرة" },
  { value: "giza", en: "Giza", ar: "الجيزة" },
  { value: "alex", en: "Alexandria", ar: "الإسكندرية" },
  { value: "other", en: "Another place", ar: "مكان تاني" },
] as const;

const SERVICES = [
  {
    value: "clinic",
    icon: "ph-stethoscope",
    en: "Clinic visit",
    ar: "كشف في العيادة",
    enBody: "See one of the doctors, with your file reviewed beforehand.",
    arBody: "كشف مع أحد الأطباء، وملفك بيتراجع قبله.",
  },
  {
    value: "surgery",
    icon: "ph-scissors",
    en: "A procedure",
    ar: "عملية أو إجراء",
    enBody: "Planning a procedure or need an anaesthetic assessment before it.",
    arBody: "بتخطط لعملية أو محتاج تقييم تخدير قبلها.",
  },
  {
    value: "team",
    icon: "ph-buildings",
    en: "A team for my facility",
    ar: "فريق لمنشأتي",
    enBody: "A hospital, centre or clinic that needs anaesthesia cover.",
    arBody: "مستشفى أو مركز أو عيادة محتاجة تغطية تخدير.",
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

const CONDITIONS = [
  { value: "diabetes", en: "Diabetes", ar: "سكر" },
  { value: "hypertension", en: "Blood pressure", ar: "ضغط" },
  { value: "heart", en: "Heart", ar: "قلب" },
  { value: "asthma", en: "Chest / asthma", ar: "صدر / حساسية" },
  { value: "kidney", en: "Kidney or liver", ar: "كلى أو كبد" },
  { value: "bloodthinners", en: "Blood thinners", ar: "مسيلات دم" },
  { value: "pregnancy", en: "Pregnancy", ar: "حمل" },
  { value: "allergy", en: "Drug allergy", ar: "حساسية من دواء" },
] as const;

const MAX_FILES = 10;
const MAX_MB = 15;
const OK_TYPES = /^(image\/(jpeg|png|jpg|webp|heic|heif)|application\/pdf)/i;
const PHONE_RE = /^(?:\+?20)?01[0125]\d{8}$/;

function westernDigits(value: string): string {
  return value
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/[^\d+]/g, "");
}

function fileSize(bytes: number): string {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function BookingForm({ locale, doctors, specialties, whatsapp, phone }: Props) {
  const [state, setState] = React.useState<BookingState>({ files: [] });
  const [step, setStep] = React.useState(1);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [stepError, setStepError] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [reference, setReference] = React.useState("");
  const [days, setDays] = React.useState<Date[]>([]);
  const [dragOver, setDragOver] = React.useState(false);
  const fileInput = React.useRef<HTMLInputElement>(null);
  const rootRef = React.useRef<HTMLDivElement>(null);

  const t = React.useCallback(
    (en: string, ar: string) => (locale === "ar" ? ar : en),
    [locale]
  );

  // The prototype generates ten days ahead, skipping Friday. Do it after mount
  // so the server and client never disagree about "today".
  React.useEffect(() => {
    const out: Date[] = [];
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);
    while (out.length < 10) {
      cursor.setDate(cursor.getDate() + 1);
      if (cursor.getDay() !== 5) out.push(new Date(cursor));
    }
    // Deliberately client-only: "today" must come from the visitor's clock, not
    // from the server's timezone, or the two renders would disagree.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDays(out);
  }, []);

  // A doctor card prefilled the form and jumped to step two.
  React.useEffect(() => {
    const onBookDoctor = (event: Event) => {
      const detail = (event as CustomEvent<{ doctorId?: string; specialty?: string }>).detail;
      if (!detail?.doctorId) return;
      setState((previous) => ({
        ...previous,
        service: "clinic",
        specialty: detail.specialty,
        doctor: detail.doctorId,
        clinic: undefined,
        date: undefined,
        time: undefined,
      }));
      setErrors({});
      setStepError("");
      setDone(false);
      setStep(2);
    };
    window.addEventListener("mm:book-doctor", onBookDoctor);
    return () => window.removeEventListener("mm:book-doctor", onBookDoctor);
  }, []);

  const set = (patch: Partial<BookingState>) => {
    setState((previous) => ({ ...previous, ...patch }));
    setErrors({});
    setStepError("");
  };

  const setService = (service: Service) => {
    setState((previous) => ({
      ...previous,
      service,
      specialty: undefined,
      doctor: undefined,
      clinic: undefined,
      date: undefined,
      time: undefined,
      facility: undefined,
      facilityCity: undefined,
      mix: [],
      from: undefined,
      to: undefined,
      daysPerWeek: undefined,
      cases: undefined,
      role: undefined,
    }));
    setErrors({});
    setStepError("");
  };

  const toggle = (key: "conds" | "mix", value: string) => {
    setState((previous) => {
      const list = previous[key] ? [...previous[key]!] : [];
      const index = list.indexOf(value);
      if (index > -1) list.splice(index, 1);
      else list.push(value);
      return { ...previous, [key]: list };
    });
  };

  const labelFor = (key: "service" | "specialty" | "doctor" | "clinic" | "coverage", value?: string) => {
    if (!value) return "";
    if (key === "service") {
      const found = SERVICES.find((item) => item.value === value);
      return found ? t(found.en, found.ar) : value;
    }
    if (key === "specialty") {
      const found = specialties.find((item) => item.slug === value);
      return found ? t(found.nameEn, found.nameAr) : value;
    }
    if (key === "doctor") {
      if (value === "any") return t("Any available doctor", "أي طبيب متاح");
      const found = doctors.find((item) => item.id === value);
      return found ? t(found.nameEn, found.nameAr) : "";
    }
    if (key === "clinic") {
      const found = CLINICS.find((item) => item.value === value);
      return found ? t(found.en, found.ar) : value;
    }
    return value;
  };

  const rows = React.useMemo(() => {
    const out: [string, string][] = [];
    out.push([t("Request type", "نوع الطلب"), labelFor("service", state.service)]);
    if (state.service === "team") {
      out.push([t("Facility", "المنشأة"), (state.facility ?? "").trim()]);
      out.push([t("City", "المدينة"), (state.facilityCity ?? "").trim()]);
      out.push([
        t("Case mix", "نوع العمليات"),
        (state.mix ?? [])
          .map((value) => {
            const found = MIX.find((item) => item.value === value);
            return found ? t(found.en, found.ar) : value;
          })
          .join(locale === "ar" ? "، " : ", "),
      ]);
      out.push([t("Expected cases", "عدد الحالات"), (state.cases ?? "").trim()]);
      out.push([t("From", "من تاريخ"), state.from ?? ""]);
      out.push([t("To", "إلى تاريخ"), state.to ?? ""]);
      out.push([t("Days per week", "أيام في الأسبوع"), (state.daysPerWeek ?? "").trim()]);
      out.push([t("Contact person", "مسؤول التواصل"), (state.name ?? "").trim()]);
      out.push([t("Role", "الوظيفة"), (state.role ?? "").trim()]);
      out.push([t("Mobile", "الموبايل"), (state.phone ?? "").trim()]);
    } else {
      out.push([t("Specialty", "التخصص"), labelFor("specialty", state.specialty)]);
      out.push([
        t("Doctor", "الطبيب"),
        state.doctor
          ? labelFor("doctor", state.doctor)
          : state.specialty
            ? t("Team will assign", "يحدده الفريق")
            : "",
      ]);
      out.push([t("Clinic / hospital", "العيادة / المستشفى"), labelFor("clinic", state.clinic)]);
      out.push([
        t("Preferred time", "الموعد المفضل"),
        state.date
          ? `${longDate(state.date, locale)}${state.time ? ` — ${timeLabel(state.time, locale)}` : ""}`
          : "",
      ]);
      out.push([t("Name", "الاسم"), (state.name ?? "").trim()]);
      out.push([t("Mobile", "الموبايل"), (state.phone ?? "").trim()]);
      out.push([t("Age", "السن"), (state.age ?? "").trim()]);
      out.push([t("City", "المدينة"), (state.city ?? "").trim()]);
      out.push([t("Chief complaint", "الشكوى الحالية"), (state.complaint ?? "").trim()]);
      out.push([
        t("Chronic conditions", "أمراض مزمنة"),
        (state.conds ?? [])
          .map((value) => {
            const found = CONDITIONS.find((item) => item.value === value);
            return found ? t(found.en, found.ar) : value;
          })
          .join(locale === "ar" ? "، " : ", "),
      ]);
      out.push([t("Uploaded files", "الملفات المرفوعة"), state.files.length ? String(state.files.length) : ""]);
    }
    out.push([t("Notes", "ملاحظات"), (state.notes ?? "").trim()]);
    return out;
  }, [state, locale, t, doctors, specialties]); // eslint-disable-line react-hooks/exhaustive-deps

  const notSet = t("Not set yet", "لم يتحدد بعد");

  const addFiles = (list: FileList | File[]) => {
    const incoming = Array.from(list);
    let added = 0;
    let message = "";
    const next = [...state.files];

    for (const file of incoming) {
      if (next.length >= MAX_FILES) break;
      if (!OK_TYPES.test(file.type || "")) {
        message = t("Only PDF or image files are accepted.", "نقبل ملفات PDF أو صور فقط.");
        continue;
      }
      if (file.size > MAX_MB * 1024 * 1024) {
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

  const slots = state.service === "surgery"
    ? ["10:00", "11:30", "13:00", "16:00", "17:30"]
    : ["11:00", "12:30", "14:00", "15:30", "17:00", "18:30", "20:00"];

  const busy = (iso: string, index: number) => (iso.charCodeAt(9) + index * 3) % 5 === 0;

  const checkStep = (current: number): boolean => {
    const nextErrors: Record<string, string> = {};
    let message = "";

    if (current === 1 && !state.service) {
      message = t("Please choose: What do you need?", "من فضلك اختر: محتاج إيه؟");
    }

    if (current === 2) {
      if (state.service === "team") {
        if (!(state.facility ?? "").trim()) nextErrors.facility = t("This field is required.", "الحقل ده مطلوب.");
      } else if (!state.specialty) {
        message = t("Please choose: Specialty", "من فضلك اختر: التخصص");
      }
    }

    if (current === 3) {
      if (state.service === "team") {
        if (!state.from) nextErrors.from = t("This field is required.", "الحقل ده مطلوب.");
      } else {
        if (!state.date) message = t("Please choose: Preferred day", "من فضلك اختر: اليوم المفضل");
        else if (!state.time) message = t("Please choose: Preferred time", "من فضلك اختر: الوقت المفضل");
      }
    }

    if (current === 4) {
      if (!(state.name ?? "").trim()) nextErrors.name = t("This field is required.", "الحقل ده مطلوب.");
      const phone = westernDigits(state.phone ?? "");
      if (!phone) nextErrors.phone = t("This field is required.", "الحقل ده مطلوب.");
      else if (!PHONE_RE.test(phone)) {
        nextErrors.phone = t(
          "Enter an Egyptian mobile number, e.g. 010 1234 5678.",
          "اكتب رقم موبايل مصري صحيح، مثال: ٠١٠ ١٢٣٤ ٥٦٧٨."
        );
      }
      if (state.age && Number.isNaN(Number(westernDigits(state.age)))) {
        nextErrors.age = t("Enter a number.", "اكتب رقمًا.");
      }
    }

    if (current === 6 && !state.consent) {
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
    if (checkStep(step)) setStep((current) => Math.min(6, current + 1));
  };

  const back = () => {
    setErrors({});
    setStepError("");
    setStep((current) => Math.max(1, current - 1));
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!checkStep(6)) return;

    setSubmitting(true);
    setStepError("");
    const body = new FormData();
    body.set("name", (state.name ?? "").trim());
    body.set("phone", (state.phone ?? "").trim());
    body.set("notes", (state.notes ?? "").trim());
    body.set("consent", "true");
    state.files.forEach((file) => body.append("files", file));

    const endpoint = state.service === "team" ? "/api/team-requests" : "/api/bookings";

    if (state.service === "team") {
      body.set("facility", (state.facility ?? "").trim());
      body.set("facilityCity", (state.facilityCity ?? "").trim());
      body.set("role", (state.role ?? "").trim());
      body.set("caseMix", JSON.stringify(state.mix ?? []));
      body.set("fromDate", state.from ?? "");
      body.set("toDate", state.to ?? "");
      body.set("daysPerWeek", (state.daysPerWeek ?? "").trim());
      body.set("casesPerWeek", (state.cases ?? "").trim());
    } else {
      body.set("serviceType", state.service ?? "clinic");
      body.set("specialtySlug", state.specialty ?? "");
      body.set("doctorId", state.doctor && state.doctor !== "any" ? state.doctor : "");
      body.set("clinic", labelFor("clinic", state.clinic));
      body.set("city", (state.city ?? "").trim());
      body.set("age", (state.age ?? "").trim());
      body.set("complaint", (state.complaint ?? "").trim());
      body.set("preferredDate", state.date ?? "");
      body.set("preferredTime", state.time ?? "");
      body.set("conditions", JSON.stringify(state.conds ?? []));
    }

    try {
      const response = await fetch(endpoint, { method: "POST", body });
      const payload = (await response.json()) as { number?: string; error?: string };
      if (!response.ok || !payload.number) {
        setStepError(payload.error || t("Something went wrong. Please try again.", "حدث خطأ. جرّب تاني."));
        setSubmitting(false);
        return;
      }
      setReference(payload.number);
      setDone(true);
      setSubmitting(false);
      setStep(6);
      rootRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch {
      setStepError(t("Could not reach the server. Check your connection and try again.", "مش قادرين نوصل للسيرفر. اتأكد من الاتصال وجرّب تاني."));
      setSubmitting(false);
    }
  };

  const reset = () => {
    setState({ files: [] });
    setStep(1);
    setErrors({});
    setStepError("");
    setDone(false);
    setReference("");
    if (fileInput.current) fileInput.current.value = "";
  };

  const whatsappSummary = () => {
    if (!whatsapp) return "#contact";
    const heading = state.service === "team"
      ? t("New team request", "طلب فريق تخدير")
      : t("New booking request", "طلب حجز جديد");
    const lines = [
      heading,
      "-",
      ...rows.filter(([, value]) => value).map(([label, value]) => `• ${label}: ${value}`),
    ];
    if (state.files.length) lines.push(`• ${t("Files", "الملفات")}: ${state.files.length}`);
    if (reference) lines.push(`• ${t("Reference", "رقم الطلب")}: ${reference}`);
    return waLink(whatsapp, lines.join("\n"));
  };

  const doctorOptions = state.specialty
    ? doctors.filter((doctor) => doctor.specialtySlug === state.specialty)
    : [];

  return (
    <div className={`m-book__layout${done ? " is-done" : ""}`} data-booking="main" ref={rootRef}>
      <div className="m-card" data-fade>
        <div className="m-book__prog" data-hide-on-done>
          <ol className="m-book__steps" data-step-list>
            {[
              [t("Request", "الطلب")],
              [t("Specialty", "التخصص")],
              [t("Time", "الموعد")],
              [t("Details", "بياناتك")],
              [t("Files", "الملفات")],
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
              ? `الخطوة ${arabicDigits(step)} من ${arabicDigits(6)}`
              : `Step ${step} of 6`}
          </span>
        </div>

        <div className="m-book__err" role="alert">{stepError}</div>

        <form className="m-book__body" noValidate onSubmit={submit} data-hide-on-done>
          {/* Step 1 */}
          <div className={`m-book__panel${step === 1 ? " is-current" : ""}`} data-step="1">
            <h3><Bi en="What do you need?" ar="محتاج إيه؟" /></h3>
            <p className="hint">
              <Bi
                en="Pick one — you can change it at any point before you confirm."
                ar="اختار واحد — وتقدر تغيّره في أي وقت قبل التأكيد."
              />
            </p>
            <div className="m-picks m-picks--3">
              {SERVICES.map((item) => (
                <button
                  className="m-pick"
                  type="button"
                  key={item.value}
                  aria-pressed={state.service === item.value}
                  onClick={() => setService(item.value)}
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

          {/* Step 2 */}
          <div className={`m-book__panel${step === 2 ? " is-current" : ""}`} data-step="2">
            <h3><Bi en="Which specialty?" ar="التخصص إيه؟" /></h3>
            <p className="hint">
              <Bi
                en="Pick a specialty, then a doctor — or leave the doctor to the team and we will bring you the earliest slot."
                ar="اختار التخصص، وبعدين الطبيب — أو سيب الطبيب للفريق ونجيبلك أقرب ميعاد."
              />
            </p>

            {state.service !== "team" && (
              <>
                <div className="m-sub">
                  <span className="m-sub__label"><Bi en="Specialty" ar="التخصص" /></span>
                  <div className="m-chips">
                    {specialties.map((specialty) => (
                      <button
                        className="m-chip"
                        type="button"
                        key={specialty.slug}
                        aria-pressed={state.specialty === specialty.slug}
                        onClick={() => set({ specialty: specialty.slug, doctor: undefined })}
                      >
                        <Bi en={specialty.nameEn} ar={specialty.nameAr} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="m-sub">
                  <span className="m-sub__label"><Bi en="Doctor — optional" ar="الطبيب — اختياري" /></span>
                  <div className="m-chips">
                    <button
                      className="m-chip"
                      type="button"
                      aria-pressed={state.doctor === "any"}
                      onClick={() => set({ doctor: "any" })}
                    >
                      <Bi en="Any available doctor" ar="أي طبيب متاح" />
                    </button>
                    {doctorOptions.map((doctor) => (
                      <button
                        className="m-chip"
                        type="button"
                        key={doctor.id}
                        aria-pressed={state.doctor === doctor.id}
                        onClick={() => set({ doctor: doctor.id })}
                      >
                        <Bi en={doctor.nameEn} ar={doctor.nameAr} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="m-sub">
                  <span className="m-sub__label"><Bi en="Preferred clinic or hospital" ar="العيادة أو المستشفى المفضل" /></span>
                  <div className="m-chips">
                    {CLINICS.map((clinic) => (
                      <button
                        className="m-chip"
                        type="button"
                        key={clinic.value}
                        aria-pressed={state.clinic === clinic.value}
                        onClick={() => set({ clinic: clinic.value, date: undefined, time: undefined })}
                      >
                        <Bi en={clinic.en} ar={clinic.ar} />
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {state.service === "team" && (
              <>
                <div className="m-form-grid">
                  <div className="m-field">
                    <label htmlFor="bk-facility"><Bi en="Facility name" ar="اسم المنشأة" /></label>
                    <input
                      id="bk-facility"
                      name="facility"
                      type="text"
                      autoComplete="organization"
                      value={state.facility ?? ""}
                      onChange={(event) => set({ facility: event.target.value })}
                    />
                    <span data-err="facility">{errors.facility}</span>
                  </div>
                  <div className="m-field">
                    <label htmlFor="bk-facility-city"><Bi en="City" ar="المدينة" /></label>
                    <input
                      id="bk-facility-city"
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
                  <span className="m-sub__label"><Bi en="Case mix you need covered" ar="نوع العمليات المطلوب تغطيتها" /></span>
                  <div className="m-chips">
                    {MIX.map((item) => (
                      <button
                        className="m-chip"
                        type="button"
                        key={item.value}
                        aria-pressed={(state.mix ?? []).includes(item.value)}
                        onClick={() => toggle("mix", item.value)}
                      >
                        <Bi en={item.en} ar={item.ar} />
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

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

          {/* Step 3 */}
          <div className={`m-book__panel${step === 3 ? " is-current" : ""}`} data-step="3">
            <h3><Bi en="When suits you?" ar="الموعد اللي يناسبك؟" /></h3>
            <p className="hint">
              <Bi
                en="Pick a day and a time. The team confirms the final slot — this is a preference, not a locked appointment."
                ar="اختار اليوم والساعة. الفريق يأكد الموعد النهائي — دي رغبة مبدئية، مش موعد نهائي."
              />
            </p>

            {state.service !== "team" && (
              <>
                <div className="m-sub">
                  <span className="m-sub__label"><Bi en="Preferred day" ar="اليوم المفضل" /></span>
                  <div className="m-days">
                    {days.map((day) => {
                      const iso = isoDate(day);
                      const parts = dayParts(day, locale);
                      return (
                        <button
                          className="m-day"
                          type="button"
                          key={iso}
                          aria-pressed={state.date === iso}
                          onClick={() => set({ date: iso, time: undefined })}
                        >
                          <small>{parts.weekday}</small>
                          <b>{parts.day}</b>
                          <small>{parts.month}</small>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="m-sub">
                  <span className="m-sub__label"><Bi en="Preferred time" ar="الوقت المفضل" /></span>
                  {state.date ? (
                    <div className="m-times">
                      {slots.map((slot, index) => (
                        <button
                          className="m-time"
                          type="button"
                          key={slot}
                          aria-pressed={state.time === slot}
                          disabled={busy(state.date!, index)}
                          onClick={() => set({ time: slot })}
                        >
                          {timeLabel(slot, locale)}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="small" style={{ color: "var(--muted)" }}>
                      <Bi
                        en="Pick a day to see the available times."
                        ar="اختر اليوم الأول لتظهر المواعيد المتاحة."
                      />
                    </p>
                  )}
                </div>
              </>
            )}

            {state.service === "team" && (
              <div className="m-form-grid">
                <div className="m-field">
                  <label htmlFor="bk-from"><Bi en="Cover needed from" ar="التغطية من تاريخ" /></label>
                  <input
                    id="bk-from"
                    name="from"
                    type="date"
                    value={state.from ?? ""}
                    onChange={(event) => set({ from: event.target.value })}
                  />
                  <span data-err="from">{errors.from}</span>
                </div>
                <div className="m-field">
                  <label htmlFor="bk-to"><Bi en="Until" ar="إلى تاريخ" /></label>
                  <input
                    id="bk-to"
                    name="to"
                    type="date"
                    value={state.to ?? ""}
                    onChange={(event) => set({ to: event.target.value })}
                  />
                  <span data-err="to">{errors.to}</span>
                </div>
                <div className="m-field">
                  <label htmlFor="bk-dpw"><Bi en="Days per week" ar="أيام في الأسبوع" /></label>
                  <input
                    id="bk-dpw"
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
                  <label htmlFor="bk-cases"><Bi en="Expected cases per week" ar="عدد الحالات في الأسبوع" /></label>
                  <input
                    id="bk-cases"
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
            )}

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

          {/* Step 4 */}
          <div className={`m-book__panel${step === 4 ? " is-current" : ""}`} data-step="4">
            <h3><Bi en="Your details" ar="بياناتك" /></h3>
            <p className="hint">
              <Bi
                en="Enough for the team to read your file and reach you. Nothing is shared with anyone else."
                ar="اللي يكفي الفريق يقرأ ملفك ويوصلك. ومفيش بيانات بتتشارك مع أي حد تاني."
              />
            </p>
            <div className="m-form-grid">
              <div className="m-field">
                <label htmlFor="bk-name"><Bi en="Full name" ar="الاسم بالكامل" /></label>
                <input
                  id="bk-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  value={state.name ?? ""}
                  onChange={(event) => set({ name: event.target.value })}
                />
                <span data-err="name">{errors.name}</span>
              </div>
              <div className="m-field">
                <label htmlFor="bk-phone"><Bi en="Mobile" ar="الموبايل" /></label>
                <input
                  id="bk-phone"
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
              {state.service !== "team" && (
                <>
                  <div className="m-field">
                    <label htmlFor="bk-age"><Bi en="Age" ar="السن" /></label>
                    <input
                      id="bk-age"
                      name="age"
                      type="text"
                      inputMode="numeric"
                      placeholder="34"
                      value={state.age ?? ""}
                      onChange={(event) => set({ age: event.target.value })}
                    />
                    <span data-err="age">{errors.age}</span>
                  </div>
                  <div className="m-field">
                    <label htmlFor="bk-city"><Bi en="City" ar="المدينة" /></label>
                    <input
                      id="bk-city"
                      name="city"
                      type="text"
                      autoComplete="address-level2"
                      value={state.city ?? ""}
                      onChange={(event) => set({ city: event.target.value })}
                    />
                    <span data-err="city">{errors.city}</span>
                  </div>
                  <div className="m-field full">
                    <label htmlFor="bk-complaint"><Bi en="Chief complaint — in your own words" ar="الشكوى الحالية — بكلامك" /></label>
                    <textarea
                      id="bk-complaint"
                      name="complaint"
                      rows={3}
                      placeholder="..."
                      value={state.complaint ?? ""}
                      onChange={(event) => set({ complaint: event.target.value })}
                    />
                    <span data-err="complaint">{errors.complaint}</span>
                  </div>
                </>
              )}
              {state.service === "team" && (
                <div className="m-field">
                  <label htmlFor="bk-role"><Bi en="Your role at the facility" ar="وظيفتك في المنشأة" /></label>
                  <input
                    id="bk-role"
                    name="role"
                    type="text"
                    placeholder="مدير طبي / مدير التشغيل"
                    value={state.role ?? ""}
                    onChange={(event) => set({ role: event.target.value })}
                  />
                  <span data-err="role">{errors.role}</span>
                </div>
              )}
            </div>

            {state.service !== "team" && (
              <div className="m-sub">
                <span className="m-sub__label">
                  <Bi en="Chronic conditions — tick anything that applies" ar="أمراض مزمنة — علّم على أي حاجة تنطبق" />
                </span>
                <div className="m-chips">
                  {CONDITIONS.map((item) => (
                    <button
                      className="m-chip"
                      type="button"
                      key={item.value}
                      aria-pressed={(state.conds ?? []).includes(item.value)}
                      onClick={() => toggle("conds", item.value)}
                    >
                      <Bi en={item.en} ar={item.ar} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="m-form-grid">
              <div className="m-field full">
                <label htmlFor="bk-notes"><Bi en="Anything else the team should know?" ar="أي حاجة تانية تحب الفريق يعرفها؟" /></label>
                <textarea
                  id="bk-notes"
                  name="notes"
                  rows={2}
                  value={state.notes ?? ""}
                  onChange={(event) => set({ notes: event.target.value })}
                />
                <span data-err="notes">{errors.notes}</span>
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

          {/* Step 5 */}
          <div className={`m-book__panel${step === 5 ? " is-current" : ""}`} data-step="5">
            <h3>
              <Bi en="Lab results and scans" ar="التحاليل والأشعة" />{" "}
              <span className="tag tag--blue">
                {state.files.length ? `${state.files.length} ${locale === "ar" ? "ملف" : "file(s)"}` : ""}
              </span>
            </h3>
            <p className="hint">
              <Bi
                en="Attach what you have — recent labs, X-ray, CT, MRI or a referral letter. Skip it if you have nothing yet; the team will ask for whatever is missing."
                ar="ارفع اللي متوفر عندك — تحاليل حديثة، أشعة، مقطعية، رنين، أو تقرير طبيب. ولو مفيش، كمّل عادي والفريق هيطلب اللي ناقص."
              />
            </p>
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
              <b><Bi en="Drop your files here" ar="اسحب ملفاتك هنا" /></b>
              <span>
                <Bi
                  en="PDF, JPG or PNG · up to 10 files · 15 MB each"
                  ar="PDF أو JPG أو PNG · لحد ١٠ ملفات · ١٥ ميجا للملف"
                />
              </span>
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
                    <span>{fileSize(file.size)}</span>
                    <span className="m-file__bar">
                      <span style={{ width: `${Math.min(100, 20 + index * 14)}%` }} />
                    </span>
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
            <p className="note" style={{ marginTop: 14 }}>
              <i className="ph-light ph-lock-simple" aria-hidden="true" />{" "}
              <Bi
                en="Files stay inside the clinic's system and are only read by the treating team."
                ar="الملفات بتبقى داخل نظام العيادة وبيقرأها الفريق المعالج بس."
              />
            </p>

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

          {/* Step 6 */}
          <div className={`m-book__panel${step === 6 ? " is-current" : ""}`} data-step="6">
            <h3><Bi en="Review and confirm" ar="راجع وأكّد" /></h3>
            <p className="hint">
              <Bi
                en="One last look. Anything wrong, step back and edit it — nothing is sent until you press confirm."
                ar="نظرة أخيرة. لو في أي حاجة غلط، ارجع وعدّلها — مفيش حاجة بتتبعت قبل ما تضغط تأكيد."
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
                  en="I agree that the team may contact me on this number about the request, and that the details above are correct as far as I know."
                  ar="أوافق إن الفريق يتواصل معايا على الرقم ده بخصوص الطلب، وإن البيانات اللي فوق صحيحة في حدود علمي."
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
                <Bi en="Confirm the request" ar="أكّد الطلب" />
              </button>
            </div>
          </div>
        </form>

        <div className="m-book__body m-success" data-success>
          <span className="m-success__ico">
            <i className="ph-light ph-check-circle" aria-hidden="true" />
          </span>
          <h3><Bi en="Request received" ar="تم استلام طلبك" /></h3>
          <p>
            <Bi
              en="The team will read the file you uploaded, then confirm the appointment on WhatsApp during working hours."
              ar="الفريق هيقرأ الملف اللي رفعته، وبعدين يأكد الموعد على واتساب خلال ساعات العمل."
            />
          </p>
          <div className="m-success__ref">
            <span><Bi en="Your reference" ar="رقم الطلب" /></span> <b>{reference || "—"}</b>
          </div>
          <ul className="m-success__next">
            <li>
              <i className="ph-light ph-check" aria-hidden="true" />
              <span><Bi en="You will get a message confirming the exact slot." ar="هيوصلك رسالة بتأكيد الموعد بالظبط." /></span>
            </li>
            <li>
              <i className="ph-light ph-check" aria-hidden="true" />
              <span><Bi en="Bring your ID and any original scans on the day." ar="هات معاك البطاقة وأصل الأشعة يوم الزيارة." /></span>
            </li>
            <li>
              <i className="ph-light ph-check" aria-hidden="true" />
              <span><Bi en="Procedure prices start from EGP 20,000; the exact cost is confirmed with you directly — nothing is charged online." ar="أسعار العمليات بتبدأ من ٢٠ ألف جنيه، والتكلفة النهائية بتتأكد معاك مباشرة — ومفيش أي دفع أونلاين." /></span>
            </li>
          </ul>
          <div className="m-success__actions">
            <a className="btn btn--wa" href={whatsappSummary()} target="_blank" rel="noopener">
              <i className="ph-fill ph-whatsapp-logo" aria-hidden="true" />
              <Bi en="Send the summary on WhatsApp" ar="ابعت الملخص على واتساب" />
            </a>
            <button className="btn btn--ghost" type="button" onClick={reset}>
              <i className="ph-light ph-arrow-counter-clockwise" aria-hidden="true" />
              <Bi en="New request" ar="طلب جديد" />
            </button>
          </div>
        </div>
      </div>

      <aside className="m-rail" data-fade>
        <h3>
          <i className="ph-light ph-clipboard-text" aria-hidden="true" />
          <Bi en="Your request so far" ar="ملخص طلبك" />
        </h3>
        <dl className="m-rail__list">
          {rows.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd className={value ? undefined : "empty"}>{value || notSet}</dd>
            </div>
          ))}
        </dl>
        <p className="m-rail__note">
          <i className="ph-light ph-info" aria-hidden="true" />
          <span>
            <Bi
              en="Procedure prices start from EGP 20,000; the exact cost is confirmed with you on WhatsApp. Nothing is charged online."
              ar="أسعار العمليات بتبدأ من ٢٠ ألف جنيه، والتكلفة النهائية بنأكدها معاك على واتساب. ومفيش أي دفع أونلاين."
            />
          </span>
        </p>
        <div className="m-rail__help">
          {whatsapp && (
            <a
              className="btn btn--wa btn--sm btn--block"
              href={waLink(
                whatsapp,
                locale === "ar"
                  ? "السلام عليكم، مع فريق د. محسن ممدوح. عايز أحجز موعد أو أستفسر عن حالة."
                  : "Hello Dr. Mohsen's team, I would like to book an appointment."
              )}
              target="_blank"
              rel="noopener"
            >
              <i className="ph-fill ph-whatsapp-logo" aria-hidden="true" />
              <Bi en="Chat on WhatsApp" ar="كلّمنا واتساب" />
            </a>
          )}
          {phone && (
            <a className="btn btn--light btn--sm btn--block" href={`tel:${phoneDigits(phone)}`}>
              <i className="ph-light ph-phone" aria-hidden="true" />
              <span className="ltr">{phone}</span>
            </a>
          )}
        </div>
      </aside>
    </div>
  );
}
