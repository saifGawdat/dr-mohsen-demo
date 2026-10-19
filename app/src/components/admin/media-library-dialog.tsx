"use client";

import * as React from "react";
import Image from "next/image";
import { ImageIcon, Loader2, Trash2, Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { uploadImageFile } from "@/lib/media/client-upload";
import {
  ACCEPTED_INPUT_MIME,
  type ImagePurpose,
  purposeConfig,
} from "@/lib/media/shared";

/**
 * The single place an admin picks or uploads an image.
 *
 * Both the single-image and multi-image pickers open this, so upload rules,
 * progress reporting and error wording exist once rather than being
 * reimplemented on every form.
 */

interface LibraryImage {
  id: string;
  url: string;
  size: number;
  width: number;
  height: number;
  createdAt: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purpose: ImagePurpose;
  /** Currently chosen urls, so they can be marked in the grid. */
  selected: string[];
  /** Called with the urls the admin picked. One entry unless `multiple`. */
  onSelect: (urls: string[]) => void;
  multiple?: boolean;
  /** Caps how many can be added in one go, when the entity has a limit. */
  remainingSlots?: number;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MediaLibraryDialog({
  open,
  onOpenChange,
  purpose,
  selected,
  onSelect,
  multiple = false,
  remainingSlots,
}: Props) {
  const [tab, setTab] = React.useState<"library" | "upload">("library");
  const [files, setFiles] = React.useState<LibraryImage[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);
  const [queue, setQueue] = React.useState<{ name: string; percent: number }[]>([]);
  const [errors, setErrors] = React.useState<string[]>([]);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const config = purposeConfig(purpose);
  const isUploading = queue.length > 0;

  const fetchFiles = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/media");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setFiles(data.files);
    } catch {
      toast.error("Failed to load the media library");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (open) {
      setErrors([]);
      fetchFiles();
    }
  }, [open, fetchFiles]);

  /**
   * Uploads run one after another rather than all at once. Each one costs the
   * server a full decode and re-encode, and firing ten in parallel at a small
   * box is how a bulk product upload becomes an outage.
   */
  const handleFiles = async (incoming: File[]) => {
    if (incoming.length === 0) return;

    const capped =
      typeof remainingSlots === "number"
        ? incoming.slice(0, Math.max(0, remainingSlots))
        : incoming;

    if (capped.length < incoming.length) {
      toast.error(
        `Only ${capped.length} more image${capped.length === 1 ? "" : "s"} can be added.`
      );
    }

    setErrors([]);
    setQueue(capped.map((file) => ({ name: file.name, percent: 0 })));

    const uploaded: string[] = [];
    const failures: string[] = [];

    for (const [index, file] of capped.entries()) {
      try {
        const result = await uploadImageFile(file, purpose, (percent) => {
          setQueue((prev) =>
            prev.map((item, i) => (i === index ? { ...item, percent } : item))
          );
        });
        uploaded.push(result.url);
      } catch (error) {
        failures.push(
          `${file.name}: ${error instanceof Error ? error.message : "Upload failed"}`
        );
      }
    }

    setQueue([]);
    setErrors(failures);

    if (uploaded.length > 0) {
      onSelect(uploaded);
      toast.success(
        uploaded.length === 1 ? "Image uploaded" : `${uploaded.length} images uploaded`
      );
    }

    if (failures.length === 0 && uploaded.length > 0) {
      onOpenChange(false);
    } else if (uploaded.length > 0) {
      fetchFiles();
      setTab("library");
    }
  };

  const handleDelete = async (image: LibraryImage, event: React.MouseEvent) => {
    event.stopPropagation();
    if (
      !confirm("Delete this image? Anything still using it will show a broken picture.")
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/media?id=${encodeURIComponent(image.id)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      setFiles((prev) => prev.filter((f) => f.id !== image.id));
      toast.success("Image deleted");
    } catch {
      toast.error("Failed to delete image");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:w-full max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Media Library</DialogTitle>
        </DialogHeader>

        <p className="text-xs text-gray-500 -mt-2">
          {config.label} — resized to {config.maxDimension}px and converted to WebP
          automatically.
        </p>

        <div className="flex gap-4 border-b border-gray-200">
          <button
            type="button"
            onClick={() => setTab("library")}
            className={cn(
              "pb-2 text-sm font-medium transition-colors border-b-2 -mb-px",
              tab === "library"
                ? "border-gold text-gold"
                : "border-transparent text-gray-500 hover:text-gray-700"
            )}
          >
            <ImageIcon className="w-4 h-4 inline-block mr-1.5" />
            Library
          </button>
          <button
            type="button"
            onClick={() => setTab("upload")}
            className={cn(
              "pb-2 text-sm font-medium transition-colors border-b-2 -mb-px",
              tab === "upload"
                ? "border-gold text-gold"
                : "border-transparent text-gray-500 hover:text-gray-700"
            )}
          >
            <Upload className="w-4 h-4 inline-block mr-1.5" />
            Upload
          </button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          {errors.length > 0 && (
            <div className="my-2 border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {errors.map((message) => (
                <p key={message}>{message}</p>
              ))}
            </div>
          )}

          {tab === "library" && (
            <div>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-gold" />
                </div>
              ) : files.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <ImageIcon className="w-10 h-10 mb-2" />
                  <p className="text-sm">No images uploaded yet</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={() => setTab("upload")}
                  >
                    Upload one
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 py-2">
                  {files.map((file) => (
                    <button
                      key={file.id}
                      type="button"
                      onClick={() => {
                        onSelect([file.url]);
                        if (!multiple) onOpenChange(false);
                      }}
                      className={cn(
                        "group relative aspect-square border overflow-hidden transition-all hover:ring-2 hover:ring-gold",
                        selected.includes(file.url)
                          ? "ring-2 ring-gold"
                          : "border-gray-200"
                      )}
                    >
                      <Image
                        src={file.url}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 45vw, 160px"
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                      <span
                        role="button"
                        tabIndex={-1}
                        aria-label="Delete image"
                        onClick={(event) => handleDelete(file, event)}
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600"
                      >
                        <Trash2 className="w-3 h-3" />
                      </span>
                      <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[10px] px-1.5 py-1 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                        {file.width}x{file.height} · {formatSize(file.size)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "upload" && (
            <div className="py-2">
              <div
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setIsDragging(false);
                  if (!isUploading) handleFiles(Array.from(event.dataTransfer.files));
                }}
                onClick={() => !isUploading && inputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 sm:p-12 flex flex-col items-center gap-3 cursor-pointer transition-colors",
                  isDragging ? "border-gold bg-gold/5" : "border-gray-300 hover:border-gold",
                  isUploading && "pointer-events-none opacity-60"
                )}
              >
                {isUploading ? (
                  <div className="w-full space-y-3">
                    {queue.map((item) => (
                      <div key={item.name}>
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span className="truncate pr-2">{item.name}</span>
                          <span>{item.percent}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-200 overflow-hidden rounded-full">
                          <div
                            className="h-full bg-gold transition-[width] duration-300"
                            style={{ width: `${item.percent}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-gray-400" />
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-700">
                        Drop {multiple ? "images" : "an image"} here or tap to browse
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        JPEG, PNG, WebP, AVIF or GIF. Large photos are shrunk in your
                        browser before uploading.
                      </p>
                    </div>
                  </>
                )}
              </div>
              <input
                ref={inputRef}
                type="file"
                multiple={multiple}
                accept={ACCEPTED_INPUT_MIME}
                onChange={(event) => {
                  const chosen = Array.from(event.target.files ?? []);
                  event.target.value = "";
                  handleFiles(chosen);
                }}
                className="hidden"
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
