"use client";

import * as React from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MediaLibraryDialog } from "./media-library-dialog";
import { DEFAULT_PURPOSE, type ImagePurpose } from "@/lib/media/shared";

/**
 * Image inputs for the admin forms.
 *
 * Every form uses one of these two components rather than a text box holding a
 * URL. That is what makes the size limits, the format conversion and the
 * cleanup tracking apply everywhere instead of only where somebody remembered.
 *
 * Existing values that are not managed uploads — the seeded `/brand/*.jpg`
 * assets, say — still render as the current image and can be replaced. Nothing
 * needs migrating for a form to keep working.
 */

interface MediaPickerProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  placeholder?: string;
  /** Decides the dimensions and size ceiling the upload is held to. */
  purpose?: ImagePurpose;
}

export function MediaPicker({
  value,
  onChange,
  label,
  placeholder = "Select an image",
  purpose = DEFAULT_PURPOSE,
}: MediaPickerProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      )}

      {value ? (
        <div className="flex items-center gap-3 border border-gray-200 p-3">
          <div className="relative h-16 w-16 shrink-0 bg-gray-50 border border-gray-100">
            <Image src={value} alt="" fill sizes="64px" className="object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-gray-600 truncate">{value}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(true)}>
              Change
            </Button>
            <button
              type="button"
              aria-label="Remove image"
              onClick={() => onChange("")}
              className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full border-2 border-dashed border-gray-300 hover:border-gold p-6 flex flex-col items-center gap-2 text-gray-500 hover:text-gold transition-colors"
        >
          <ImagePlus className="w-6 h-6" />
          <span className="text-sm">{placeholder}</span>
        </button>
      )}

      <MediaLibraryDialog
        open={open}
        onOpenChange={setOpen}
        purpose={purpose}
        selected={value ? [value] : []}
        onSelect={(urls) => {
          if (urls[0]) onChange(urls[0]);
        }}
      />
    </div>
  );
}

interface MediaPickerMultipleProps {
  values: string[];
  onChange: (urls: string[]) => void;
  label?: string;
  purpose?: ImagePurpose;
  /** Upper bound on how many images the entity may hold. */
  max?: number;
  /** Explains what position matters for, when it does. */
  hint?: string;
}

export function MediaPickerMultiple({
  values,
  onChange,
  label,
  purpose = DEFAULT_PURPOSE,
  max,
  hint,
}: MediaPickerMultipleProps) {
  const [open, setOpen] = React.useState(false);

  const atLimit = typeof max === "number" && values.length >= max;

  const add = (urls: string[]) => {
    // Selecting an image already in the list would otherwise duplicate it, and a
    // duplicate is indistinguishable from the original once saved.
    const fresh = urls.filter((url) => !values.includes(url));
    if (fresh.length === 0) return;

    const next = [...values, ...fresh];
    onChange(typeof max === "number" ? next.slice(0, max) : next);
  };

  const remove = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= values.length) return;

    const next = [...values];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div>
      {label && (
        <div className="flex items-baseline justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">{label}</label>
          {typeof max === "number" && (
            <span className="text-xs text-gray-400">
              {values.length} / {max}
            </span>
          )}
        </div>
      )}

      {hint && <p className="text-xs text-gray-500 mb-3">{hint}</p>}

      {values.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-3">
          {values.map((url, index) => (
            <div
              key={`${url}-${index}`}
              className="group relative aspect-square border border-gray-200 overflow-hidden"
            >
              <Image
                src={url}
                alt=""
                fill
                sizes="(max-width: 640px) 45vw, 160px"
                className="object-cover"
              />

              {index === 0 && (
                <span className="absolute top-1 left-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded">
                  Main
                </span>
              )}

              <button
                type="button"
                aria-label="Remove image"
                onClick={() => remove(index)}
                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600"
              >
                <X className="w-3 h-3" />
              </button>

              <div className="absolute bottom-0 inset-x-0 flex justify-between opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                <button
                  type="button"
                  aria-label="Move earlier"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                  className={cn(
                    "flex h-6 w-6 items-center justify-center bg-black/60 text-white",
                    index === 0 && "opacity-30 pointer-events-none"
                  )}
                >
                  <ChevronLeft className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  aria-label="Move later"
                  disabled={index === values.length - 1}
                  onClick={() => move(index, 1)}
                  className={cn(
                    "flex h-6 w-6 items-center justify-center bg-black/60 text-white",
                    index === values.length - 1 && "opacity-30 pointer-events-none"
                  )}
                >
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        disabled={atLimit}
        onClick={() => setOpen(true)}
        className={cn(
          "w-full border-2 border-dashed p-6 flex flex-col items-center gap-2 transition-colors",
          atLimit
            ? "border-gray-200 text-gray-300 cursor-not-allowed"
            : "border-gray-300 text-gray-500 hover:border-gold hover:text-gold"
        )}
      >
        <ImagePlus className="w-6 h-6" />
        <span className="text-sm">
          {atLimit
            ? `Maximum of ${max} images reached`
            : values.length === 0
              ? "Add images"
              : "Add more images"}
        </span>
      </button>

      <MediaLibraryDialog
        open={open}
        onOpenChange={setOpen}
        purpose={purpose}
        selected={values}
        onSelect={add}
        multiple
        remainingSlots={typeof max === "number" ? max - values.length : undefined}
      />
    </div>
  );
}
