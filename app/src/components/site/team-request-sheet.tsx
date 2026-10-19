"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const input =
  "w-full rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-teal focus:ring-1 focus:ring-teal";
const stepBtn =
  "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors";

const PHONE_REGEX = /^(?:\+?20|0)?1[0125]\d{8}$/;

const ROLES = ["", "Hospital", "Surgical centre", "Clinic", "Other"];

export function TeamRequestSheet() {
  const t = useTranslations("teamRequest");

  const [step, setStep] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [done, setDone] = React.useState(false);

  const [role, setRole] = React.useState("");
  const [casesPerDay, setCasesPerDay] = React.useState("");
  const [daysPerWeek, setDaysPerWeek] = React.useState("");
  const [facility, setFacility] = React.useState("");
  const [facilityCity, setFacilityCity] = React.useState("");
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [fromDate, setFromDate] = React.useState("");
  const [toDate, setToDate] = React.useState("");
  const [consent, setConsent] = React.useState(false);

  function validateStep(s: number): string | null {
    // Only step-2 asks for required text; everything earlier is optional
    // until the confirm screen, where consent gates the send.
    if (s === 2 && !fromDate) return t("errorRequired");
    if (s === 3) {
      if (!facility.trim() || !name.trim()) return t("errorRequired");
      if (!PHONE_REGEX.test(phone.replace(/[\s\-().]/g, ""))) return t("errorPhone");
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

  async function submit() {
    const problem = validateStep(3);
    if (problem) {
      setError(problem);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/team-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          facility,
          facilityCity: facilityCity || "",
          role: role || "",
          fromDate,
          toDate: toDate || "",
          casesPerDay: casesPerDay || undefined,
          daysPerWeek: daysPerWeek || undefined,
          notes: notes || "",
          consent: true,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }

      setDone(true);
    } catch {
      setError("Network error — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const steps = [t("step1"), t("step2"), t("step3"), t("step4")];

  return (
    <div id="team-request" className="scroll-mt-24">
      <div className="mx-auto max-w-2xl bg-white rounded-3xl border border-teal-15 shadow-sm p-6 sm:p-8">
        {done ? (
          <div className="text-center py-10">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-teal-15">
              <Check className="h-7 w-7 text-teal-deep" />
            </div>
            <p className="font-bold text-lg">{t("success")}</p>
          </div>
        ) : (
          <>
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
                        i < step ? "border-teal bg-teal text-white" : i === step ? "border-ink" : "border-line"
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

            {error && <p className="mb-4 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-err">{error}</p>}

            {step === 0 && (
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-sm font-medium">{t("role")}</span>
                  <select value={role} onChange={(e) => setRole(e.target.value)} className={input}>
                    {ROLES.map((value) => (
                      <option key={value} value={value}>
                        {value || "—"}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium">{t("cases")}</span>
                  <input type="number" min={0} value={casesPerDay} onChange={(e) => setCasesPerDay(e.target.value)} className={input} />
                </label>
                <label className="block sm:col-span-2">
                  <span className="mb-1 block text-sm font-medium">{t("daysPerWeek")}</span>
                  <input type="number" min={0} max={7} value={daysPerWeek} onChange={(e) => setDaysPerWeek(e.target.value)} className={input} />
                </label>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <label className="block">
                  <span className="mb-1 block text-sm font-medium">{t("facility")} *</span>
                  <input value={facility} onChange={(e) => setFacility(e.target.value)} className={input} />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium">{t("facilityCity")}</span>
                    <input value={facilityCity} onChange={(e) => setFacilityCity(e.target.value)} className={input} />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium">{t("role")}</span>
                    <input value={role === "" ? "" : role} readOnly className={cn(input, "opacity-50")} tabIndex={-1} />
                  </label>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-sm font-medium">{t("from")} *</span>
                  <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className={input} />
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium">{t("to")}</span>
                  <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className={input} />
                </label>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium">{t("name")} *</span>
                    <input value={name} onChange={(e) => setName(e.target.value)} className={input} />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium">{t("phone")} *</span>
                    <input value={phone} onChange={(e) => setPhone(e.target.value)} className={cn(input, "font-mono")} inputMode="tel" placeholder="01xxxxxxxxx" />
                  </label>
                </div>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium">{t("notes")}</span>
                  <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className={cn(input, "resize-none")} />
                </label>

                <dl className="rounded-2xl bg-teal-08 p-4 text-sm space-y-1.5">
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">{t("facility")}</dt>
                    <dd className="font-medium">{facility || "—"}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">{t("from")}</dt>
                    <dd>{fromDate || "—"}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">{t("to")}</dt>
                    <dd>{toDate || "—"}</dd>
                  </div>
                </dl>

                <label className="flex items-start gap-3 text-sm">
                  <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#007d77]" />
                  {t("consent")}
                </label>
              </div>
            )}

            <div className="mt-8 flex items-center justify-between gap-3">
              {step > 0 ? (
                <button type="button" onClick={back} className={cn(stepBtn, "border border-line text-ink/70 hover:bg-teal-08")}>
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
                <button type="button" onClick={() => void submit()} disabled={submitting} className={cn(stepBtn, "bg-teal text-white hover:bg-teal-deep disabled:opacity-60")}>
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
