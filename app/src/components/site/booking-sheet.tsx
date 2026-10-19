"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Check, ChevronLeft, ChevronRight, FileUp, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DoctorOption {
  id: string;
  name: string;
  specialty: string;
}

interface Props {
  doctors: DoctorOption[];
  specialties: { slug: string; name: string }[];
}

const input =
  "w-full rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-teal focus:ring-1 focus:ring-teal";
const stepBtn =
  "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors";

const MAX_FILES = 10;
const MAX_FILE_MB = 20;

/** Latin digits only string compare — the API re-validates anyway. */
const PHONE_REGEX = /^(?:\+?20|0)?1[0125]\d{8}$/;

export function BookingSheet({ doctors, specialties }: Props) {
  const t = useTranslations("booking");

  const [step, setStep] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [done, setDone] = React.useState<string | null>(null);

  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [age, setAge] = React.useState("");
  const [complaint, setComplaint] = React.useState("");
  const [preferredDate, setPreferredDate] = React.useState("");
  const [doctorId, setDoctorId] = React.useState("");
  const [specialtySlug, setSpecialtySlug] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [files, setFiles] = React.useState<File[]>([]);
  const [consent, setConsent] = React.useState(false);

  function validateStep(s: number): string | null {
    if (s === 0) {
      if (name.trim().length < 2) return t("errorRequired");
      if (!PHONE_REGEX.test(phone.replace(/[\s\-().]/g, ""))) return t("errorPhone");
    }
    if (s === 1) {
      if (complaint.trim().length < 2) return t("errorRequired");
    }
    if (s === 3) {
      if (!consent) return t("errorConsent");
    }
    return null;
  }

  function next() {
    const problem = validateStep(step);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setStep((s) => Math.min(s + 1, 3));
  }

  function back() {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  }

  function addFiles(list: FileList | null) {
    if (!list) return;
    const fresh = Array.from(list);
    setFiles((current) => {
      const merged = [...current, ...fresh].slice(0, MAX_FILES);
      return merged;
    });
  }

  async function submit() {
    const problem = validateStep(3);
    if (problem) {
      setError(problem);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const form = new FormData();
      form.set("name", name);
      form.set("phone", phone);
      if (age) form.set("age", age);
      form.set("complaint", complaint);
      if (preferredDate) form.set("preferredDate", preferredDate);
      form.set("doctorId", doctorId);
      form.set("specialtySlug", specialtySlug);
      form.set("notes", notes);
      form.set("consent", "true");
      for (const file of files) form.append("files", file);

      const res = await fetch("/api/bookings", { method: "POST", body: form });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }

      setDone(data.number ?? "—");
    } catch {
      setError("Network error — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const steps = [t("step1"), t("step2"), t("step3"), t("step4")];

  return (
    <div id="booking" className="scroll-mt-24">
      <div className="mx-auto max-w-2xl bg-white rounded-3xl border border-line shadow-sm p-6 sm:p-8">
        {done ? (
          <div className="text-center py-10">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-teal-15">
              <Check className="h-7 w-7 text-teal-deep" />
            </div>
            <p className="font-bold text-lg mb-2">{t("success")}</p>
            <p className="text-sm text-muted font-mono">{done}</p>
          </div>
        ) : (
          <>
            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-8">
              {steps.map((label, i) => (
                <React.Fragment key={label}>
                  <div
                    className={cn(
                      "flex items-center gap-2 text-xs font-medium",
                      i < step ? "text-teal" : i === step ? "text-ink" : "text-muted"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full border text-[11px]",
                        i < step
                          ? "border-teal bg-teal text-white"
                          : i === step
                            ? "border-ink"
                            : "border-line"
                      )}
                    >
                      {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
                    </span>
                    <span className="hidden sm:inline">{label}</span>
                  </div>
                  {i < steps.length - 1 && <div className="h-px flex-1 bg-line" />}
                </React.Fragment>
              ))}
            </div>

            {error && (
              <p className="mb-4 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-err">{error}</p>
            )}

            {step === 0 && (
              <div className="space-y-4">
                <label className="block">
                  <span className="mb-1 block text-sm font-medium">{t("name")} *</span>
                  <input value={name} onChange={(e) => setName(e.target.value)} className={input} />
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium">{t("phone")} *</span>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={cn(input, "font-mono")}
                    placeholder="01xxxxxxxxx"
                    inputMode="tel"
                  />
                </label>
                <label className="block max-w-[160px]">
                  <span className="mb-1 block text-sm font-medium">{t("age")}</span>
                  <input
                    type="number"
                    min={0}
                    max={120}
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className={input}
                    inputMode="numeric"
                  />
                </label>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <label className="block">
                  <span className="mb-1 block text-sm font-medium">{t("complaint")} *</span>
                  <textarea rows={3} value={complaint} onChange={(e) => setComplaint(e.target.value)} className={cn(input, "resize-none")} />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium">{t("date")}</span>
                    <input type="date" value={preferredDate} onChange={(e) => setPreferredDate(e.target.value)} className={input} />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium">{t("doctor")}</span>
                    <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)} className={input}>
                      <option value="">—</option>
                      {doctors.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} · {d.specialty}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium">{t("specialty")}</span>
                  <select value={specialtySlug} onChange={(e) => setSpecialtySlug(e.target.value)} className={input}>
                    <option value="">—</option>
                    {specialties.map((s) => (
                      <option key={s.slug} value={s.slug}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium">{t("notes")}</span>
                  <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className={cn(input, "resize-none")} />
                </label>
              </div>
            )}

            {step === 2 && (
              <div>
                <p className="text-sm text-muted mb-4">{t("uploadHint")}</p>

                <label className="block cursor-pointer">
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    className="sr-only"
                    onChange={(e) => addFiles(e.target.files)}
                  />
                  <span className="flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-line px-6 py-10 text-muted transition-colors hover:border-teal hover:text-teal">
                    <FileUp className="h-6 w-6" />
                    <span className="text-sm">
                      {files.length}/{MAX_FILES}
                    </span>
                  </span>
                </label>

                {files.length > 0 && (
                  <ul className="mt-4 space-y-2">
                    {files.map((f, i) => (
                      <li key={`${f.name}-${i}`} className="flex items-center gap-3 rounded-xl border border-line px-3 py-2 text-sm">
                        <FileUp className="h-4 w-4 shrink-0 text-teal" />
                        <span className="min-w-0 flex-1 truncate">{f.name}</span>
                        <button
                          type="button"
                          aria-label="Remove"
                          onClick={() => setFiles((cur) => cur.filter((_, j) => j !== i))}
                          className="text-muted hover:text-err"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <dl className="rounded-2xl bg-blue-08 p-4 text-sm space-y-1.5">
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">{t("name")}</dt>
                    <dd className="font-medium">{name}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">{t("phone")}</dt>
                    <dd className="font-mono">{phone}</dd>
                  </div>
                  {age && (
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted">{t("age")}</dt>
                      <dd>{age}</dd>
                    </div>
                  )}
                  {files.length > 0 && (
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted">{t("step3")}</dt>
                      <dd>
                        {files.length} ×
                      </dd>
                    </div>
                  )}
                </dl>

                <label className="flex items-start gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-[#007d77]"
                  />
                  {t("consent")}
                </label>
              </div>
            )}

            <div className="mt-8 flex items-center justify-between gap-3">
              {step > 0 ? (
                <button type="button" onClick={back} className={cn(stepBtn, "border border-line text-ink/70 hover:bg-blue-08")}>
                  <ChevronLeft className="h-4 w-4 ltr:inline rtl:hidden" />
                  <ChevronRight className="h-4 w-4 ltr:hidden rtl:inline" />
                </button>
              ) : (
                <span />
              )}

              {step < 3 ? (
                <button type="button" onClick={next} className={cn(stepBtn, "bg-blue text-white hover:bg-blue-deep")}>
                  <ChevronRight className="h-4 w-4 ltr:inline rtl:hidden" />
                  <ChevronLeft className="h-4 w-4 ltr:hidden rtl:inline" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void submit()}
                  disabled={submitting}
                  className={cn(stepBtn, "bg-teal text-white hover:bg-teal-deep disabled:opacity-60")}
                >
                  {submitting ? "…" : t("submit")}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
