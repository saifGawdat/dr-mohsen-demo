"use client";

import * as React from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { EmptyRow, PageHeader, Td, Th } from "@/components/admin/ui";

interface Faq {
  id: string;
  questionEn: string;
  questionAr: string;
  answerEn: string;
  answerAr: string;
  order: number;
  active: boolean;
}

interface FormState {
  questionEn: string;
  questionAr: string;
  answerEn: string;
  answerAr: string;
  order: number;
  active: boolean;
}

const EMPTY: FormState = {
  questionEn: "",
  questionAr: "",
  answerEn: "",
  answerAr: "",
  order: 0,
  active: true,
};

const input =
  "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-teal focus:outline-none";

export default function FaqsPage() {
  const [rows, setRows] = React.useState<Faq[] | null>(null);
  const [editing, setEditing] = React.useState<Faq | "new" | null>(null);
  const [form, setForm] = React.useState<FormState>(EMPTY);
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async () => {
    const res = await fetch("/api/admin/faqs");
    const data = await res.json();
    setRows(data.faqs ?? []);
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  function openEditor(f: Faq | null) {
    setForm(
      f
        ? {
            questionEn: f.questionEn,
            questionAr: f.questionAr,
            answerEn: f.answerEn,
            answerAr: f.answerAr,
            order: f.order,
            active: f.active,
          }
        : EMPTY
    );
    setEditing(f ?? "new");
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    for (const key of ["questionEn", "questionAr", "answerEn", "answerAr"] as const) {
      if (!form[key].trim()) {
        toast.error("All four question/answer fields are required");
        return;
      }
    }
    setSaving(true);
    try {
      const id = editing === "new" ? null : (editing as Faq).id;
      const res = await fetch(id ? `/api/admin/faqs/${id}` : "/api/admin/faqs", {
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
    if (!confirm("Delete this FAQ?")) return;
    const res = await fetch(`/api/admin/faqs/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Delete failed");
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
        title="FAQs"
        description="Questions rendered in the storefront FAQ section, in both languages."
        action={
          <button
            onClick={() => openEditor(null)}
            className="inline-flex items-center gap-2 bg-teal text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-teal-deep"
          >
            <Plus className="w-4 h-4" /> Add FAQ
          </button>
        }
      />

      <div className="bg-white border border-line rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-line">
              <tr>
                <Th>Question (EN)</Th>
                <Th>Question (AR)</Th>
                <Th>Order</Th>
                <Th>Status</Th>
                <Th />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows === null ? (
                <EmptyRow colSpan={5}>Loading…</EmptyRow>
              ) : rows.length === 0 ? (
                <EmptyRow colSpan={5}>No FAQs yet.</EmptyRow>
              ) : (
                rows.map((f) => (
                  <tr key={f.id}>
                    <Td className="max-w-[280px] truncate">{f.questionEn}</Td>
                    <Td className="max-w-[280px] truncate" dir="rtl">
                      {f.questionAr}
                    </Td>
                    <Td>{f.order}</Td>
                    <Td>
                      <span className={`text-xs px-2 py-1 rounded-full ${f.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"}`}>
                        {f.active ? "Active" : "Hidden"}
                      </span>
                    </Td>
                    <Td>
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => openEditor(f)} className="text-xs text-teal hover:underline">
                          Edit
                        </button>
                        <button onClick={() => void remove(f.id)} className="text-xs text-red-600 hover:underline">
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
            <h2 className="font-bold text-lg">{editing === "new" ? "Add FAQ" : "Edit FAQ"}</h2>

            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="block text-sm font-medium mb-1">Question (English)</span>
                <input value={form.questionEn} onChange={(e) => set("questionEn")(e.target.value)} className={input} />
              </label>
              <label className="block">
                <span className="block text-sm font-medium mb-1">Question (Arabic)</span>
                <input dir="rtl" value={form.questionAr} onChange={(e) => set("questionAr")(e.target.value)} className={input} />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="block text-sm font-medium mb-1">Answer (English)</span>
                <textarea rows={4} value={form.answerEn} onChange={(e) => set("answerEn")(e.target.value)} className={input} />
              </label>
              <label className="block">
                <span className="block text-sm font-medium mb-1">Answer (Arabic)</span>
                <textarea dir="rtl" rows={4} value={form.answerAr} onChange={(e) => set("answerAr")(e.target.value)} className={input} />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4 items-center">
              <label className="block">
                <span className="block text-sm font-medium mb-1">Order</span>
                <input type="number" value={form.order} onChange={(e) => set("order")(Number(e.target.value))} className={input} />
              </label>
              <label className="flex items-center gap-2 text-sm mt-4">
                <input type="checkbox" checked={form.active} onChange={(e) => set("active")(e.target.checked)} />
                Visible on the storefront
              </label>
            </div>

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
