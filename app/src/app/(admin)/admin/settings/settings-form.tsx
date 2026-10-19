"use client";

import * as React from "react";
import { toast } from "sonner";
import { MediaPicker } from "@/components/admin/media-picker";
import { PageHeader } from "@/components/admin/ui";

type Settings = Record<string, unknown> & {
  id: string;
  siteName: string;
  tagline: string;
};

const input =
  "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-teal focus:outline-none";
const labelCls = "block text-sm font-medium mb-1";

function Field({
  label,
  k,
  form,
  set,
  type = "text",
  dir,
  placeholder,
}: {
  label: string;
  k: string;
  form: Record<string, string | boolean | number>;
  set: (k: string, v: string) => void;
  type?: string;
  dir?: "rtl" | "ltr";
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className={labelCls}>{label}</span>
      <input
        type={type}
        dir={dir}
        placeholder={placeholder}
        value={String(form[k] ?? "")}
        onChange={(e) => set(k, e.target.value)}
        className={input}
      />
    </label>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white border border-line rounded-xl p-5 mb-5">
      <h2 className="font-semibold mb-4">{title}</h2>
      {children}
    </section>
  );
}

export function SettingsForm({ settings }: { settings: Settings }) {
  const [form, setForm] = React.useState<Record<string, string | boolean>>(() => {
    const snapshot: Record<string, string | boolean> = {};
    for (const [k, v] of Object.entries(settings)) {
      if (k === "id" || k === "updatedAt") continue;
      snapshot[k] = v === null ? "" : (v as string | boolean);
    }
    return snapshot;
  });
  const [saving, setSaving] = React.useState(false);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const toggle = (k: string) => setForm((f) => ({ ...f, [k]: !f[k] }));

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Save failed");
        return;
      }
      toast.success("Settings saved");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Site identity, contact details, homepage copy and integrations — applied live to the storefront."
        action={
          <button
            onClick={() => void save()}
            disabled={saving}
            className="bg-teal text-white rounded-lg px-5 py-2 text-sm font-medium hover:bg-teal-deep disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        }
      />

      <Section title="Identity">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Site name" k="siteName" form={form} set={set} />
          <Field label="Tagline" k="tagline" form={form} set={set} />
        </div>
        <div className="mt-4">
          <MediaPicker label="Logo" value={String(form.logoUrl ?? "")} onChange={(v) => set("logoUrl", v)} purpose="logo" placeholder="Add a logo" />
        </div>
      </Section>

      <Section title="Contact & social">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Contact phone" k="contactPhone" form={form} set={set} placeholder="+20 123 456 7890" />
          <Field label="Contact email" k="contactEmail" form={form} set={set} placeholder="info@example.com" />
          <Field label="WhatsApp number (digits only)" k="whatsappNumber" form={form} set={set} placeholder="201234567890" />
          <Field label="Opening hours" k="openingHours" form={form} set={set} placeholder="Sat–Thu 10:00–18:00" />
          <Field label="Facebook URL" k="facebookUrl" form={form} set={set} />
          <Field label="Instagram URL" k="instagramUrl" form={form} set={set} />
        </div>
        <label className="block mt-4">
          <span className={labelCls}>Address</span>
          <textarea rows={2} value={String(form.address ?? "")} onChange={(e) => set("address", e.target.value)} className={input} />
        </label>
        <label className="flex items-center gap-2 text-sm mt-3">
          <input type="checkbox" checked={Boolean(form.whatsappEnabled)} onChange={() => toggle("whatsappEnabled")} />
          Show the WhatsApp floating button on the storefront
        </label>
      </Section>

      <Section title="Homepage copy (English)">
        <div className="space-y-4">
          <Field label="Hero eyebrow" k="heroEyebrowEn" form={form} set={set} />
          <Field label="Hero title" k="heroTitleEn" form={form} set={set} />
          <label className="block">
            <span className={labelCls}>Hero lead</span>
            <textarea rows={2} value={String(form.heroLeadEn ?? "")} onChange={(e) => set("heroLeadEn", e.target.value)} className={input} />
          </label>
          <label className="block">
            <span className={labelCls}>About lead</span>
            <textarea rows={3} value={String(form.aboutLeadEn ?? "")} onChange={(e) => set("aboutLeadEn", e.target.value)} className={input} />
          </label>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4">
          <MediaPicker label="Hero image 1" value={String(form.heroImageUrl ?? "")} onChange={(v) => set("heroImageUrl", v)} purpose="hero" placeholder="Add image" />
          <MediaPicker label="Hero image 2" value={String(form.heroImage2Url ?? "")} onChange={(v) => set("heroImage2Url", v)} purpose="hero" placeholder="Add image" />
          <MediaPicker label="Hero image 3" value={String(form.heroImage3Url ?? "")} onChange={(v) => set("heroImage3Url", v)} purpose="hero" placeholder="Add image" />
        </div>
        <div className="mt-4">
          <MediaPicker label="About image" value={String(form.aboutImageUrl ?? "")} onChange={(v) => set("aboutImageUrl", v)} purpose="content" placeholder="Add image" />
        </div>
      </Section>

      <Section title="Homepage copy (Arabic)">
        <div className="space-y-4">
          <Field label="Hero eyebrow" k="heroEyebrowAr" form={form} set={set} dir="rtl" />
          <Field label="Hero title" k="heroTitleAr" form={form} set={set} dir="rtl" />
          <label className="block">
            <span className={labelCls}>Hero lead</span>
            <textarea dir="rtl" rows={2} value={String(form.heroLeadAr ?? "")} onChange={(e) => set("heroLeadAr", e.target.value)} className={input} />
          </label>
          <label className="block">
            <span className={labelCls}>About lead</span>
            <textarea dir="rtl" rows={3} value={String(form.aboutLeadAr ?? "")} onChange={(e) => set("aboutLeadAr", e.target.value)} className={input} />
          </label>
        </div>
      </Section>

      <Section title="Features">
        <div className="space-y-2 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={Boolean(form.blogEnabled)} onChange={() => toggle("blogEnabled")} />
            Blog enabled on the storefront
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={Boolean(form.newsletterEnabled)} onChange={() => toggle("newsletterEnabled")} />
            Newsletter form enabled
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={Boolean(form.reviewsEnabled)} onChange={() => toggle("reviewsEnabled")} />
            Testimonials enabled
          </label>
        </div>
      </Section>

      <Section title="Email (Resend)">
        <p className="text-xs text-muted mb-4">
          The API key is stored in the database, not the environment, so it can be rotated without a redeploy. Emails are
          best-effort: a failed send never fails a booking.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <Field label="From address" k="emailFrom" form={form} set={set} placeholder="Dr. Mohsen <no-reply@example.com>" />
          <Field label="Booking notification email" k="bookingNotifyEmail" form={form} set={set} placeholder="reception@example.com" />
          <Field label="Resend API key" k="resendApiKey" form={form} set={set} type="password" placeholder="re_…" />
        </div>
        <label className="flex items-center gap-2 text-sm mt-3">
          <input type="checkbox" checked={Boolean(form.emailServiceEnabled)} onChange={() => toggle("emailServiceEnabled")} />
          Email service enabled
        </label>
      </Section>

      <Section title="SEO">
        <div className="space-y-4">
          <label className="block">
            <span className={labelCls}>Site description</span>
            <textarea rows={2} value={String(form.siteDescription ?? "")} onChange={(e) => set("siteDescription", e.target.value)} className={input} />
          </label>
          <Field label="Site keywords" k="siteKeywords" form={form} set={set} />
          <Field label="Google verification token" k="googleVerification" form={form} set={set} />
          <MediaPicker label="Social share image" value={String(form.ogImage ?? "")} onChange={(v) => set("ogImage", v)} purpose="og" placeholder="Add OG image" />
        </div>
      </Section>
    </div>
  );
}
