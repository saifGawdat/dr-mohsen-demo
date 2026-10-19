"use client";

import * as React from "react";

/** Shared small pieces for the dashboard pages: heading, status chips, empty states. */

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">{title}</h1>
        {description && <p className="text-sm text-muted mt-1">{description}</p>}
      </div>
      {action}
    </div>
  );
}

const STATUS_STYLES: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-800",
  CONFIRMED: "bg-teal-100 text-teal-800",
  DONE: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-700",
  READ: "bg-blue-100 text-blue-800",
  REPLIED: "bg-green-100 text-green-800",
  DRAFT: "bg-gray-100 text-gray-600",
  PUBLISHED: "bg-green-100 text-green-800",
};

export function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_STYLES[status] ?? "bg-gray-100 text-gray-600";
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}
    >
      {status[0] + status.slice(1).toLowerCase()}
    </span>
  );
}

export function EmptyRow({ colSpan, children }: { colSpan: number; children?: React.ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-12 text-center text-sm text-muted">
        {children ?? "Nothing here yet."}
      </td>
    </tr>
  );
}

export function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <th
      className={`px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 ${className ?? ""}`}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  className,
  dir,
  onClick,
}: {
  children?: React.ReactNode;
  className?: string;
  dir?: "ltr" | "rtl";
  onClick?: (e: React.MouseEvent) => void;
}) {
  return (
    <td dir={dir} onClick={onClick} className={`px-4 py-3 text-sm text-ink ${className ?? ""}`}>
      {children}
    </td>
  );
}

/** Select for the booking/team-request pipeline. Persists on change. */
export function PipelineSelect({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (status: string) => void;
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className="border border-gray-200 rounded-md px-2 py-1 text-xs bg-white focus:border-teal focus:outline-none"
    >
      {["NEW", "CONFIRMED", "DONE", "CANCELLED"].map((s) => (
        <option key={s} value={s}>
          {s[0] + s.slice(1).toLowerCase()}
        </option>
      ))}
    </select>
  );
}
