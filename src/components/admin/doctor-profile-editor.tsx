"use client";
import type { DoctorProfile } from "@/lib/doctor-profile";
import { MediaPicker } from "@/components/admin/media-picker";

type Section = "clinics" | "cases" | "articles" | "comparisons";
const titles: Record<Section, string> = { clinics: "Clinic locations", cases: "Anonymized case studies", articles: "Articles", comparisons: "Before and after" };
export function DoctorProfileEditor({ value, onChange }: { value: DoctorProfile; onChange: (value: DoctorProfile) => void }) {
  function update(section: Section, index: number, patch: Record<string, string | boolean>) {
    onChange({ ...value, [section]: value[section].map((item, i) => i === index ? { ...item, ...patch } : item) });
  }
  function add(section: Section) {
    const common = { titleEn: "", titleAr: "" };
    const item = section === "clinics" ? { ...common, addressEn: "", addressAr: "" }
      : section === "comparisons" ? { ...common, before: "", after: "", consentConfirmed: false }
      : { ...common, bodyEn: "", bodyAr: "" };
    // Drafts may be incomplete; the server validates them before saving.
    onChange({ ...value, [section]: [...value[section], item] } as DoctorProfile);
  }
  return <div className="space-y-6 border-t border-line pt-4">
    <p className="text-sm text-muted">Public content only. Publish approved copy and anonymized cases. Never include patient names, records, or identifiable child photos.</p>
    {(["clinics", "cases", "articles", "comparisons"] as Section[]).map((section) => <fieldset key={section} className="space-y-3">
      <legend className="font-medium">{titles[section]}</legend>
      {value[section].map((item, index) => <div key={index} className="border border-line rounded p-3 space-y-3">
        {Object.entries(item).filter(([key]) => /^(title|address|body)/.test(key)).map(([key, text]) => <label key={key} className="block text-sm">
          {key.replace(/(En|Ar)$/, " ($1)")}
          <textarea className="w-full border border-line rounded px-3 py-2 text-sm" dir={key.endsWith("Ar") ? "rtl" : "ltr"} rows={key.startsWith("body") ? 5 : 2} value={String(text)} onChange={(e) => update(section, index, { [key]: e.target.value })} required />
        </label>)}
        {"before" in item && <>
          <MediaPicker label="Before" value={item.before} onChange={(before) => update(section, index, { before })} purpose="doctor" />
          <MediaPicker label="After" value={item.after} onChange={(after) => update(section, index, { after })} purpose="doctor" />
          <label className="flex gap-2 text-sm"><input type="checkbox" required checked={item.consentConfirmed} onChange={(e) => update(section, index, { consentConfirmed: e.target.checked })} />I confirm documented consent to publish these anonymized images. No identifiable child is shown.</label>
        </>}
        <button type="button" className="text-sm underline" onClick={() => onChange({ ...value, [section]: value[section].filter((_, i) => i !== index) })}>Remove entry</button>
      </div>)}
      <button type="button" className="text-sm underline" onClick={() => add(section)}>Add {titles[section].toLowerCase()} entry</button>
    </fieldset>)}
    <fieldset className="space-y-3"><legend className="font-medium">Photo gallery</legend>
      {value.images.map((url, index) => <div key={index}>
        <MediaPicker label={`Image ${index + 1}`} purpose="doctor" value={url} onChange={(next) => onChange({ ...value, images: value.images.map((image, i) => i === index ? next : image) })} />
        <button type="button" className="text-sm underline" onClick={() => onChange({ ...value, images: value.images.filter((_, i) => i !== index) })}>Remove image</button>
      </div>)}
      <button type="button" className="text-sm underline" onClick={() => onChange({ ...value, images: [...value.images, ""] })}>Add gallery image</button>
    </fieldset>
  </div>;
}
