"use client";

import * as React from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Pencil, Plus } from "lucide-react";
import { MediaPicker } from "@/components/admin/media-picker";
import { EmptyRow, PageHeader, Td, Th } from "@/components/admin/ui";

interface Doctor {
  id: string;
  nameEn: string;
  nameAr: string;
  titleEn: string | null;
  titleAr: string | null;
  bioEn: string | null;
  bioAr: string | null;
  hospitalEn: string | null;
  hospitalAr: string | null;
  photoUrl: string | null;
  specialtyId: string | null;
  specialty: { id: string; nameEn: string } | null;
  order: number;
  active: boolean;
}

interface Specialty {
  id: string;
  nameEn: string;
  nameAr: string;
}

interface FormState {
  nameEn: string;
  nameAr: string;
  titleEn: string;
  titleAr: string;
  bioEn: string;
  bioAr: string;
  hospitalEn: string;
  hospitalAr: string;
  photoUrl: string;
  specialtyId: string;
  order: number;
  active: boolean;
}

const EMPTY: FormState = {
  nameEn: "",
  nameAr: "",
  titleEn: "",
  titleAr: "",
  bioEn: "",
  bioAr: "",
  hospitalEn: "",
  hospitalAr: "",
  photoUrl: "",
  specialtyId: "",
  order: 0,
  active: true,
};

const input =
  "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-teal focus:outline-none";

export default function DoctorsPage() {
  const [doctors, setDoctors] = React.useState<Doctor[] | null>(null);
  const [specialties, setSpecialties] = React.useState<Specialty[]>([]);
  const [editing, setEditing] = React.useState<Doctor | "new" | null>(null);
  const [form, setForm] = React.useState<FormState>(EMPTY);
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async () => {
    const [dRes, sRes] = await Promise.all([
      fetch("/api/admin/doctors"),
      fetch("/api/admin/specialties"),
    ]);
    const dData = await dRes.json();
    const sData = await sRes.json();
    setDoctors(dData.doctors ?? []);
    setSpecialties(sData.specialties ?? []);
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  function openEditor(doctor: Doctor | null) {
    if (!doctor) {
      setForm(EMPTY);
      setEditing("new");
    } else {
      setForm({
        nameEn: doctor.nameEn,
        nameAr: doctor.nameAr,
        titleEn: doctor.titleEn ?? "",
        titleAr: doctor.titleAr ?? "",
        bioEn: doctor.bioEn ?? "",
        bioAr: doctor.bioAr ?? "",
        hospitalEn: doctor.hospitalEn ?? "",
        hospitalAr: doctor.hospitalAr ?? "",
        photoUrl: doctor.photoUrl ?? "",
        specialtyId: doctor.specialtyId ?? "",
        order: doctor.order,
        active: doctor.active,
      });
      setEditing(doctor);
    }
  }

  const set = (key: keyof FormState) => (value: string | number | boolean) =>
    setForm((f) => ({ ...f, [key]: value }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nameEn.trim() || !form.nameAr.trim()) {
      toast.error("English and Arabic names are required");
      return;
    }
    setSaving(true);
    try {
      const id = editing === "new" ? null : (editing as Doctor).id;
      const res = await fetch(id ? `/api/admin/doctors/${id}` : "/api/admin/doctors", {
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
    if (!confirm("Delete this doctor? Bookings that referenced them keep their history.")) return;
    const res = await fetch(`/api/admin/doctors/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Delete failed");
      return;
    }
    toast.success("Deleted");
    void load();
  }

  async function toggleActive(doctor: Doctor) {
    const res = await fetch(`/api/admin/doctors/${doctor.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...toForm(doctor), active: !doctor.active }),
    });
    if (!res.ok) {
      toast.error("Update failed");
      return;
    }
    void load();
  }

  function toForm(d: Doctor): FormState {
    return {
      nameEn: d.nameEn,
      nameAr: d.nameAr,
      titleEn: d.titleEn ?? "",
      titleAr: d.titleAr ?? "",
      bioEn: d.bioEn ?? "",
      bioAr: d.bioAr ?? "",
      hospitalEn: d.hospitalEn ?? "",
      hospitalAr: d.hospitalAr ?? "",
      photoUrl: d.photoUrl ?? "",
      specialtyId: d.specialtyId ?? "",
      order: d.order,
      active: d.active,
    };
  }

  return (
    <div>
      <PageHeader
        title="Doctors"
        description="The doctor directory shown on the storefront and bookable from the booking form."
        action={
          <button
            onClick={() => openEditor(null)}
            className="inline-flex items-center gap-2 bg-teal text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-teal-deep"
          >
            <Plus className="w-4 h-4" /> Add doctor
          </button>
        }
      />

      <div className="bg-white border border-line rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-line">
              <tr>
                <Th>Doctor</Th>
                <Th>Specialty</Th>
                <Th>Order</Th>
                <Th>Visible</Th>
                <Th />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {doctors === null ? (
                <EmptyRow colSpan={5}>Loading…</EmptyRow>
              ) : doctors.length === 0 ? (
                <EmptyRow colSpan={5}>No doctors yet — add the first one.</EmptyRow>
              ) : (
                doctors.map((d) => (
                  <tr key={d.id}>
                    <Td>
                      <div className="flex items-center gap-3">
                        {d.photoUrl ? (
                          <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-100">
                            <Image src={d.photoUrl} alt="" fill sizes="40px" className="object-cover" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-blue-08" />
                        )}
                        <div>
                          <p className="font-medium">{d.nameEn}</p>
                          <p className="text-xs text-muted" dir="rtl">
                            {d.nameAr}
                          </p>
                        </div>
                      </div>
                    </Td>
                    <Td className="text-sm text-muted">{d.specialty?.nameEn ?? "—"}</Td>
                    <Td>{d.order}</Td>
                    <Td>
                      <button
                        onClick={() => void toggleActive(d)}
                        className={`text-xs px-2 py-1 rounded-full ${
                          d.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {d.active ? "Active" : "Hidden"}
                      </button>
                    </Td>
                    <Td>
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => openEditor(d)} className="p-2 text-muted hover:text-teal">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => void remove(d.id)} className="p-2 text-muted hover:text-red-600 text-xs">
                          <span className="underline">Delete</span>
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
            className="bg-white rounded-xl w-full max-w-2xl my-8 h-fit p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-bold text-lg">{editing === "new" ? "Add doctor" : "Edit doctor"}</h2>

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
                <span className="block text-sm font-medium mb-1">Title (English)</span>
                <input value={form.titleEn} onChange={(e) => set("titleEn")(e.target.value)} className={input} placeholder="e.g. Consultant anaesthetist" />
              </label>
              <label className="block">
                <span className="block text-sm font-medium mb-1">Title (Arabic)</span>
                <input dir="rtl" value={form.titleAr} onChange={(e) => set("titleAr")(e.target.value)} className={input} />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="block text-sm font-medium mb-1">Hospital (English)</span>
                <input value={form.hospitalEn} onChange={(e) => set("hospitalEn")(e.target.value)} className={input} />
              </label>
              <label className="block">
                <span className="block text-sm font-medium mb-1">Hospital (Arabic)</span>
                <input dir="rtl" value={form.hospitalAr} onChange={(e) => set("hospitalAr")(e.target.value)} className={input} />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="block text-sm font-medium mb-1">Bio (English)</span>
                <textarea rows={3} value={form.bioEn} onChange={(e) => set("bioEn")(e.target.value)} className={input} />
              </label>
              <label className="block">
                <span className="block text-sm font-medium mb-1">Bio (Arabic)</span>
                <textarea dir="rtl" rows={3} value={form.bioAr} onChange={(e) => set("bioAr")(e.target.value)} className={input} />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4 items-end">
              <label className="block">
                <span className="block text-sm font-medium mb-1">Specialty</span>
                <select value={form.specialtyId} onChange={(e) => set("specialtyId")(e.target.value)} className={input}>
                  <option value="">— None —</option>
                  {specialties.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nameEn}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="block text-sm font-medium mb-1">Order</span>
                <input type="number" value={form.order} onChange={(e) => set("order")(Number(e.target.value))} className={input} />
              </label>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.active} onChange={(e) => set("active")(e.target.checked)} />
              Visible on the storefront
            </label>

            <MediaPicker
              label="Photo"
              value={form.photoUrl}
              onChange={set("photoUrl")}
              purpose="doctor"
              placeholder="Add a portrait"
            />

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
