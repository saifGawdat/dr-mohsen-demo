"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, hint, id, name, ...props }, ref) => {
    // Use provided id, or generate stable id from name, or fallback to useId
    const fallbackId = React.useId();
    const inputId = id ?? (name ? `input-${name}` : fallbackId);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            {label}
          </label>
        )}
        <input
          type={type}
          id={inputId}
          name={name}
          className={cn(
            "w-full bg-transparent border-b border-gray-300 py-3 px-0 text-base text-black placeholder:text-gray-400 transition-colors duration-300 focus:border-gold focus:outline-none",
            error && "border-red-500 focus:border-red-500",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-sm text-red-500">{error}</p>
        )}
        {hint && !error && (
          <p className="mt-1.5 text-sm text-gray-500">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

// Boxed Input variant
export interface BoxedInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const BoxedInput = React.forwardRef<HTMLInputElement, BoxedInputProps>(
  ({ className, type, label, error, id, name, ...props }, ref) => {
    // Use provided id, or generate stable id from name, or fallback to useId
    const fallbackId = React.useId();
    const inputId = id ?? (name ? `boxed-input-${name}` : fallbackId);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            {label}
          </label>
        )}
        <input
          type={type}
          id={inputId}
          name={name}
          className={cn(
            "w-full border border-gray-200 bg-white py-3 px-4 text-base text-black placeholder:text-gray-400 transition-[border-color,box-shadow,background-color] duration-300 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold",
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

BoxedInput.displayName = "BoxedInput";

export { Input, BoxedInput };
