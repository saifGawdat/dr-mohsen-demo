"use client";

import * as React from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { MediaPicker } from "@/components/admin/media-picker";
import { EmptyRow, PageHeader, StatusBadge, Td, Th } from "@/components/admin/ui";

interface Post {
  id: string;
  slug: string;
  titleEn: string;
  titleAr: string;
  excerptEn: string | null;
  excerptAr: string | null;
  bodyEn: string | null;
  bodyAr: string | null;
  featuredImage: string | null;
  ogImage: string | null;
  status: string;
  publishedAt: string | null;
  category: { nameEn: string } | null;
  createdAt: string;
}

interface FormState {
  slug: string;
  titleEn: string;
  titleAr: string;
  excerptEn: string;
  excerptAr: string;
  bodyEn: string;
  bodyAr: string;
  featuredImage: string;
  ogImage: string;
  status: "DRAFT" | "PUBLISHED";
}

const EMPTY: FormState = {
  slug: "",
  titleEn: "",
  titleAr: "",
  excerptEn: "",
  excerptAr: "",
  bodyEn: "",
  bodyAr: "",
  featuredImage: "",
  ogImage: "",
  status: "DRAFT",
};

const input =
  "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-teal focus:outline-none";

function fmt(value: string | null): string {
  return value
    ? new Date(value).toLocaleDateString("en-GB", { dateStyle: "medium" })
    : "—";
}

export default function BlogPage() {
  const [posts, setPosts] = React.useState<Post[] | null>(null);
  const [editing, setEditing] = React.useState<Post | "new" | null>(null);
  const [form, setForm] = React.useState<FormState>(EMPTY);
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async () => {
    const res = await fetch("/api/admin/blog/posts");
    const data = await res.json();
    setPosts(data.posts ?? []);
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  function openEditor(p: Post | null) {
    setForm(
      p
        ? {
            slug: p.slug,
            titleEn: p.titleEn,
            titleAr: p.titleAr,
            excerptEn: p.excerptEn ?? "",
            excerptAr: p.excerptAr ?? "",
            bodyEn: p.bodyEn ?? "",
            bodyAr: p.bodyAr ?? "",
            featuredImage: p.featuredImage ?? "",
            ogImage: p.ogImage ?? "",
            status: p.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
          }
        : EMPTY
    );
    setEditing(p ?? "new");
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.titleEn.trim() || !form.titleAr.trim()) {
      toast.error("Both titles are required");
      return;
    }
    setSaving(true);
    try {
      const id = editing === "new" ? null : (editing as Post).id;
      const res = await fetch(id ? `/api/admin/blog/posts/${id}` : "/api/admin/blog/posts", {
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
    if (!confirm("Delete this post?")) return;
    const res = await fetch(`/api/admin/blog/posts/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Delete failed");
      return;
    }
    toast.success("Deleted");
    void load();
  }

  const set = (key: keyof FormState) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <div>
      <PageHeader
        title="Blog"
        description="Posts for the storefront blog, in both languages. Drafts are not published."
        action={
          <button
            onClick={() => openEditor(null)}
            className="inline-flex items-center gap-2 bg-teal text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-teal-deep"
          >
            <Plus className="w-4 h-4" /> New post
          </button>
        }
      />

      <div className="bg-white border border-line rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-line">
              <tr>
                <Th>Title</Th>
                <Th>Slug</Th>
                <Th>Status</Th>
                <Th>Published</Th>
                <Th />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {posts === null ? (
                <EmptyRow colSpan={5}>Loading…</EmptyRow>
              ) : posts.length === 0 ? (
                <EmptyRow colSpan={5}>No posts yet.</EmptyRow>
              ) : (
                posts.map((p) => (
                  <tr key={p.id}>
                    <Td>
                      <p className="font-medium">{p.titleEn}</p>
                      <p className="text-xs text-muted" dir="rtl">
                        {p.titleAr}
                      </p>
                    </Td>
                    <Td className="font-mono text-xs text-muted">{p.slug}</Td>
                    <Td><StatusBadge status={p.status} /></Td>
                    <Td className="text-xs text-muted">{fmt(p.publishedAt)}</Td>
                    <Td>
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => openEditor(p)} className="text-xs text-teal hover:underline">
                          Edit
                        </button>
                        <button onClick={() => void remove(p.id)} className="text-xs text-red-600 hover:underline">
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
            className="bg-white rounded-xl w-full max-w-3xl my-8 h-fit p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-bold text-lg">{editing === "new" ? "New post" : "Edit post"}</h2>

            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="block text-sm font-medium mb-1">Title (English)</span>
                <input value={form.titleEn} onChange={(e) => set("titleEn")(e.target.value)} className={input} />
              </label>
              <label className="block">
                <span className="block text-sm font-medium mb-1">Title (Arabic)</span>
                <input dir="rtl" value={form.titleAr} onChange={(e) => set("titleAr")(e.target.value)} className={input} />
              </label>
            </div>

            {editing !== "new" && (
              <label className="block">
                <span className="block text-sm font-medium mb-1">Slug</span>
                <input
                  value={form.slug}
                  onChange={(e) => set("slug")(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                  className={input + " font-mono"}
                />
              </label>
            )}

            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="block text-sm font-medium mb-1">Excerpt (English)</span>
                <textarea rows={2} value={form.excerptEn} onChange={(e) => set("excerptEn")(e.target.value)} className={input} />
              </label>
              <label className="block">
                <span className="block text-sm font-medium mb-1">Excerpt (Arabic)</span>
                <textarea dir="rtl" rows={2} value={form.excerptAr} onChange={(e) => set("excerptAr")(e.target.value)} className={input} />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="block text-sm font-medium mb-1">Body (English)</span>
                <textarea rows={8} value={form.bodyEn} onChange={(e) => set("bodyEn")(e.target.value)} className={input} />
              </label>
              <label className="block">
                <span className="block text-sm font-medium mb-1">Body (Arabic)</span>
                <textarea dir="rtl" rows={8} value={form.bodyAr} onChange={(e) => set("bodyAr")(e.target.value)} className={input} />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <MediaPicker label="Featured image" value={form.featuredImage} onChange={set("featuredImage")} purpose="blog" placeholder="Add image" />
              <MediaPicker label="Social share image" value={form.ogImage} onChange={set("ogImage")} purpose="og" placeholder="Add OG image" />
            </div>

            <label className="block max-w-[200px]">
              <span className="block text-sm font-medium mb-1">Status</span>
              <select
                value={form.status}
                onChange={(e) => set("status")(e.target.value)}
                className={input}
              >
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
              </select>
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
