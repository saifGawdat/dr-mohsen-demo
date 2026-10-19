"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, name, ...props }, ref) => {
    // Use provided id, or generate stable id from name, or fallback to useId
    const fallbackId = React.useId();
    const textareaId = id ?? (name ? `textarea-${name}` : fallbackId);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          name={name}
          className={cn(
            "w-full min-h-[120px] border border-gray-200 bg-white py-3 px-4 text-base text-black placeholder:text-gray-400 transition-[border-color,box-shadow,background-color] duration-300 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold resize-none",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-sm text-red-500">{error}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export { Textarea };
