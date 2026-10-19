"use client";

import * as React from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { EmptyRow, PageHeader, Td, Th } from "@/components/admin/ui";

interface Specialty {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string | null;
  descriptionAr: string | null;
  order: number;
  active: boolean;
  _count: { doctors: number };
}

interface FormState {
  slug: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  order: number;
  active: boolean;
}

const EMPTY: FormState = {
  slug: "",
  nameEn: "",
  nameAr: "",
  descriptionEn: "",
  descriptionAr: "",
  order: 0,
  active: true,
};

const input =
  "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-teal focus:outline-none";

export default function SpecialtiesPage() {
  const [rows, setRows] = React.useState<Specialty[] | null>(null);
  const [editing, setEditing] = React.useState<Specialty | "new" | null>(null);
  const [form, setForm] = React.useState<FormState>(EMPTY);
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async () => {
    const res = await fetch("/api/admin/specialties");
    const data = await res.json();
    setRows(data.specialties ?? []);
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  function openEditor(s: Specialty | null) {
    setForm(
      s
        ? {
            slug: s.slug,
            nameEn: s.nameEn,
            nameAr: s.nameAr,
            descriptionEn: s.descriptionEn ?? "",
            descriptionAr: s.descriptionAr ?? "",
            order: s.order,
            active: s.active,
          }
        : EMPTY
    );
    setEditing(s ?? "new");
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.slug.trim() || !form.nameEn.trim() || !form.nameAr.trim()) {
      toast.error("Slug, English name and Arabic name are required");
      return;
    }
    setSaving(true);
    try {
      const id = editing === "new" ? null : (editing as Specialty).id;
      const res = await fetch(id ? `/api/admin/specialties/${id}` : "/api/admin/specialties", {
        method: id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Save failed");
        return;
      }
      toast.success("Saved");
      setEditing(null);
      void load();
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this specialty? Doctors and bookings keep working — the link is dropped.")) return;
    const res = await fetch(`/api/admin/specialties/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Delete failed — the slug may conflict.");
      return;
    }
    toast.success("Deleted");
    void load();
  }

  const set = (key: keyof FormState) => (value: string | number | boolean) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <div>
      <PageHeader
        title="Specialties"
        description="The specialty filters used across the storefront and the booking form."
        action={
          <button
            onClick={() => openEditor(null)}
            className="inline-flex items-center gap-2 bg-teal text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-teal-deep"
          >
            <Plus className="w-4 h-4" /> Add specialty
          </button>
        }
      />

      <div className="bg-white border border-line rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-line">
              <tr>
                <Th>Specialty</Th>
                <Th>Slug</Th>
                <Th>Doctors</Th>
                <Th>Order</Th>
                <Th>Status</Th>
                <Th />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows === null ? (
                <EmptyRow colSpan={6}>Loading…</EmptyRow>
              ) : rows.length === 0 ? (
                <EmptyRow colSpan={6}>No specialties yet.</EmptyRow>
              ) : (
                rows.map((s) => (
                  <tr key={s.id}>
                    <Td>
                      <p className="font-medium">{s.nameEn}</p>
                      <p className="text-xs text-muted" dir="rtl">
                        {s.nameAr}
                      </p>
                    </Td>
                    <Td className="font-mono text-xs text-muted">{s.slug}</Td>
                    <Td>{s._count.doctors}</Td>
                    <Td>{s.order}</Td>
                    <Td>
                      <span className={`text-xs px-2 py-1 rounded-full ${s.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"}`}>
                        {s.active ? "Active" : "Hidden"}
                      </span>
                    </Td>
                    <Td>
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => openEditor(s)} className="text-xs text-teal hover:underline">
                          Edit
                        </button>
                        <button onClick={() => void remove(s.id)} className="text-xs text-red-600 hover:underline">
                          Delete
                        </button>
                      </div>
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/50 flex justify-center overflow-y-auto p-4" onClick={() => setEditing(null)}>
          <form
            onSubmit={save}
            className="bg-white rounded-xl w-full max-w-xl my-8 h-fit p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-bold text-lg">{editing === "new" ? "Add specialty" : "Edit specialty"}</h2>

            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="block text-sm font-medium mb-1">Slug</span>
                <input
                  value={form.slug}
                  onChange={(e) => set("slug")(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                  className={input + " font-mono"}
                  placeholder="e.g. pain-management"
                />
                <span className="text-[11px] text-muted mt-1 block">Lowercase letters, numbers, dashes. Used in URLs.</span>
              </label>
              <label className="block">
                <span className="block text-sm font-medium mb-1">Order</span>
                <input type="number" value={form.order} onChange={(e) => set("order")(Number(e.target.value))} className={input} />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="block text-sm font-medium mb-1">Name (English)</span>
                <input value={form.nameEn} onChange={(e) => set("nameEn")(e.target.value)} className={input} />
              </label>
              <label className="block">
                <span className="block text-sm font-medium mb-1">Name (Arabic)</span>
                <input dir="rtl" value={form.nameAr} onChange={(e) => set("nameAr")(e.target.value)} className={input} />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="block text-sm font-medium mb-1">Description (English)</span>
                <textarea rows={3} value={form.descriptionEn} onChange={(e) => set("descriptionEn")(e.target.value)} className={input} />
              </label>
              <label className="block">
                <span className="block text-sm font-medium mb-1">Description (Arabic)</span>
                <textarea dir="rtl" rows={3} value={form.descriptionAr} onChange={(e) => set("descriptionAr")(e.target.value)} className={input} />
              </label>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.active} onChange={(e) => set("active")(e.target.checked)} />
              Visible on the storefront
            </label>

            <div className="flex justify-end gap-2 pt-2 border-t border-line">
              <button type="button" onClick={() => setEditing(null)} className="border border-gray-200 rounded-lg px-4 py-2 text-sm hover:bg-gray-50">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="bg-teal text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-teal-deep disabled:opacity-60">
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
