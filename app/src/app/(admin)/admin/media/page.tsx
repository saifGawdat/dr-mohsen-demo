"use client";

import * as React from "react";
import Image from "next/image";
import { toast } from "sonner";
import { FileText, Trash2 } from "lucide-react";
import { MediaLibraryDialog } from "@/components/admin/media-library-dialog";
import { PageHeader } from "@/components/admin/ui";

interface MediaFile {
  id: string;
  url: string;
  size: number;
  width: number;
  height: number;
  purpose: string;
  createdAt: string;
}

function kb(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export default function MediaPage() {
  const [files, setFiles] = React.useState<MediaFile[] | null>(null);
  const [uploadOpen, setUploadOpen] = React.useState(false);

  const load = React.useCallback(async () => {
    const res = await fetch("/api/admin/media");
    const data = await res.json();
    setFiles(data.files ?? []);
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function remove(f: MediaFile) {
    if (!confirm("Delete this file? Anything still using its URL will show it broken.")) return;
    const res = await fetch(`/api/admin/media?id=${f.id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Delete failed");
      return;
    }
    toast.success("Deleted");
    void load();
  }

  const isPdf = (f: MediaFile) => f.url.endsWith(".pdf");

  return (
    <div>
      <PageHeader
        title="Media library"
        description="Every uploaded file lives here. Files nothing references are swept automatically."
        action={
          <button
            onClick={() => setUploadOpen(true)}
            className="bg-teal text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-teal-deep"
          >
            Upload
          </button>
        }
      />

      {files === null ? (
        <p className="text-sm text-muted py-12 text-center">Loading…</p>
      ) : files.length === 0 ? (
        <p className="text-sm text-muted py-12 text-center">The library is empty. Upload the first file to get started.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {files.map((f) => (
            <div key={f.id} className="border border-line rounded-xl overflow-hidden bg-white group">
              <div className="aspect-square bg-gray-50 relative">
                {isPdf(f) ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-red-600">
                    <FileText className="w-8 h-8" />
                    <span className="text-[10px] font-bold">PDF</span>
                  </div>
                ) : (
                  <Image src={f.url} alt="" fill sizes="(max-width: 640px) 45vw, 200px" className="object-cover" />
                )}
                <button
                  type="button"
                  aria-label="Delete"
                  onClick={() => void remove(f)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="p-2 text-[11px] text-muted">
                <p className="truncate font-mono" title={f.url}>
                  {f.url.replace("/api/uploads/", "")}
                </p>
                <p>
                  {f.purpose} · {kb(f.size)}
                  {f.width > 0 && ` · ${f.width}×${f.height}`}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <MediaLibraryDialog
        open={uploadOpen}
        onOpenChange={(open) => {
          setUploadOpen(open);
          if (!open) void load();
        }}
        purpose="general"
        selected={[]}
        onSelect={() => {}}
        multiple
      />
    </div>
  );
}
