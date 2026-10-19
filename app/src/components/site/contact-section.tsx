"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const input =
  "w-full rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-teal focus:ring-1 focus:ring-teal";

const PHONE_REGEX = /^(?:\+?20|0)?1[0125]\d{8}$/;

export function ContactSection() {
  const t = useTranslations("contact");
  const tNewsletter = useTranslations("newsletter");
  const locale = useLocale();

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [sending, setSending] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  const [subscriberEmail, setSubscriberEmail] = React.useState("");
  const [subState, setSubState] = React.useState<"idle" | "sending" | "done">("idle");
  const showNewsletter = locale === "en" || locale === "ar";

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    if (name.trim().length < 2) {
      setError(t("name"));
      return;
    }
    if (message.trim().length < 5) {
      setError(t("message"));
      return;
    }

    setSending(true);
    setError(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email: email || "", phone, message }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }
      setSent(true);
    } catch {
      setError("Network error — please try again.");
    } finally {
      setSending(false);
    }
  }

  async function subscribe(e: React.FormEvent) {
    e.preventDefault();
    setSubState("sending");

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: subscriberEmail }),
      });
      if (res.ok) setSubState("done");
      else setSubState("idle");
    } catch {
      setSubState("idle");
    }
  }

  return (
    <div id="contact" className="scroll-mt-24 grid gap-8 md:grid-cols-2">
      <div>
        {sent ? (
          <div className="flex items-center gap-3 rounded-2xl bg-teal-08 px-5 py-4 text-sm">
            <Check className="h-5 w-5 text-teal-deep" />
            {t("success")}
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-sm font-medium">{t("name")}</span>
                <input value={name} onChange={(e) => setName(e.target.value)} className={input} />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium">{t("phone")}</span>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} className={cn(input, "font-mono")} inputMode="tel" />
              </label>
            </div>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">{t("email")}</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={input} />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">{t("message")}</span>
              <textarea rows={4} value={message} onChange={(e) => setMessage(e.target.value)} className={cn(input, "resize-none")} />
            </label>

            {error && <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-err">{error}</p>}

            <button
              type="submit"
              disabled={sending}
              className="rounded-full bg-blue px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-deep disabled:opacity-60"
            >
              {sending ? "…" : t("send")}
            </button>
          </form>
        )}
      </div>

      {showNewsletter ? (
        <div className="rounded-2xl bg-blue-ink p-6 text-white h-fit">
          <p className="font-semibold">{locale === "ar" ? "النشرة البريدية" : "Newsletter"}</p>
          {subState === "done" ? (
            <p className="mt-3 text-sm text-white/80">{tNewsletter("success")}</p>
          ) : (
            <form onSubmit={subscribe} className="mt-3 flex gap-2">
              <input
                type="email"
                required
                value={subscriberEmail}
                onChange={(e) => setSubscriberEmail(e.target.value)}
                placeholder={tNewsletter("placeholder")}
                className="min-w-0 flex-1 rounded-full bg-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/40 outline-none focus:bg-white/15"
              />
              <button type="submit" disabled={subState === "sending"} className="rounded-full bg-teal px-4 py-2.5 text-sm font-medium hover:bg-teal-deep disabled:opacity-60">
                {subState === "sending" ? "…" : tNewsletter("subscribe")}
              </button>
            </form>
          )}
        </div>
      ) : null}
    </div>
  );
}
