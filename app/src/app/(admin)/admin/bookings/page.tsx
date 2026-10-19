"use client";

import * as React from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Download } from "lucide-react";
import {
  EmptyRow,
  PageHeader,
  PipelineSelect,
  StatusBadge,
  Td,
  Th,
} from "@/components/admin/ui";

interface BookingRow {
  id: string;
  number: string;
  name: string;
  phone: string;
  age: number | null;
  complaint: string | null;
  preferredDate: string | null;
  notes: string | null;
  status: string;
  adminNotes: string | null;
  createdAt: string;
  doctor: { nameEn: string } | null;
  specialty: { nameEn: string } | null;
  _count: { uploads: number };
}

interface BookingDetail extends BookingRow {
  uploads: { id: string; filename: string; mimeType: string | null; url: string | null }[];
}

function format(date: string | null): string {
  return date
    ? new Date(date).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })
    : "—";
}

export default function BookingsPage() {
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get("status") ?? "";

  const [rows, setRows] = React.useState<BookingRow[] | null>(null);
  const [detail, setDetail] = React.useState<BookingDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = React.useState(false);
  const [q, setQ] = React.useState("");
  const [deleting, setDeleting] = React.useState(false);

  const load = React.useCallback(async () => {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (q.trim()) params.set("q", q.trim());
    const res = await fetch(`/api/admin/bookings?${params}`);
    const data = await res.json();
    setRows(data.bookings ?? []);
  }, [statusFilter, q]);

  React.useEffect(() => {
    const t = setTimeout(() => void load(), q ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, q]);

  async function openDetail(id: string) {
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/admin/bookings/${id}`);
      const data = await res.json();
      setDetail(data.booking ?? null);
    } finally {
      setLoadingDetail(false);
    }
  }

  async function patchDetail(id: string, body: Record<string, unknown>) {
    const res = await fetch(`/api/admin/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      toast.error("Update failed");
      return;
    }
    if (detail?.id === id) setDetail({ ...detail, ...body } as BookingDetail);
    void load();
    toast.success("Saved");
  }

  async function removeBooking() {
    if (!detail) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/bookings/${detail.id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Delete failed");
        return;
      }
      setDetail(null);
      void load();
      toast.success("Booking deleted");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Bookings"
        description="Guest bookings from the online form. NEW means not yet called."
      />

      <div className="flex gap-2 mb-4 items-center">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, phone or number…"
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full max-w-xs focus:border-teal focus:outline-none"
        />
        {statusFilter && (
          <a href="/admin/bookings" className="text-xs text-teal hover:underline whitespace-nowrap">
            Clear filter: {statusFilter.toLowerCase()}
          </a>
        )}
      </div>

      <div className="bg-white border border-line rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-line">
              <tr>
                <Th>Name</Th>
                <Th>Phone</Th>
                <Th>Number</Th>
                <Th>Complaint</Th>
                <Th>Files</Th>
                <Th>Status</Th>
                <Th>Received</Th>
                <Th />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows === null ? (
                <EmptyRow colSpan={8}>Loading…</EmptyRow>
              ) : rows.length === 0 ? (
                <EmptyRow colSpan={8}>No bookings match.</EmptyRow>
              ) : (
                rows.map((b) => (
                  <tr key={b.id} className="cursor-pointer hover:bg-gray-50" onClick={() => void openDetail(b.id)}>
                    <Td className="font-medium">{b.name}</Td>
                    <Td className="font-mono text-xs">{b.phone}</Td>
                    <Td className="font-mono text-xs text-muted">{b.number}</Td>
                    <Td className="max-w-[200px] truncate text-muted">{b.complaint ?? "—"}</Td>
                    <Td>{b._count.uploads > 0 ? `${b._count.uploads}` : ""}</Td>
                    <Td>
                      <div onClick={(e) => e.stopPropagation()}>
                        <PipelineSelect
                          value={b.status}
                          onChange={(status) => void patchDetail(b.id, { status })}
                        />
                      </div>
                    </Td>
                    <Td className="text-xs text-muted whitespace-nowrap">{format(b.createdAt)}</Td>
                    <Td className="text-xs text-teal whitespace-nowrap">Details</Td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail */}
      {detail && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex justify-center overflow-y-auto p-4"
          onClick={() => setDetail(null)}
        >
          <div
            className="bg-white rounded-xl w-full max-w-xl my-8 h-fit"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-line flex items-center justify-between">
              <div>
                <h2 className="font-bold">{detail.name}</h2>
                <p className="text-xs text-muted font-mono">
                  {detail.number} · {format(detail.createdAt)}
                </p>
              </div>
              <StatusBadge status={detail.status} />
            </div>

            <div className="px-6 py-4 space-y-3 text-sm">
              <p>
                <span className="text-muted">Phone:</span>{" "}
                <a href={`tel:${detail.phone}`} className="font-mono hover:text-teal">
                  {detail.phone}
                </a>
              </p>
              {detail.age != null && (
                <p>
                  <span className="text-muted">Age:</span> {detail.age}
                </p>
              )}
              {detail.preferredDate && (
                <p>
                  <span className="text-muted">Preferred date:</span> {format(detail.preferredDate)}
                </p>
              )}
              <p>
                <span className="text-muted">Doctor:</span> {detail.doctor?.nameEn ?? "—"} ·{" "}
                <span className="text-muted">Specialty:</span> {detail.specialty?.nameEn ?? "—"}
              </p>
              <div>
                <p className="text-muted mb-1">Complaint</p>
                <p className="whitespace-pre-wrap bg-gray-50 rounded-lg p-3">
                  {detail.complaint || "—"}
                </p>
              </div>
              {detail.notes && (
                <div>
                  <p className="text-muted mb-1">Notes</p>
                  <p className="whitespace-pre-wrap bg-gray-50 rounded-lg p-3">{detail.notes}</p>
                </div>
              )}

              {detail.uploads.length > 0 && (
                <div>
                  <p className="text-muted mb-2">Labs & scans</p>
                  <div className="space-y-2">
                    {detail.uploads.map((u) => (
                      <div key={u.id} className="flex items-center gap-3 border border-line rounded-lg p-2">
                        {u.mimeType === "application/pdf" ? (
                          <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center text-[10px] font-bold text-red-600">
                            PDF
                          </div>
                        ) : u.url ? (
                          <div className="relative w-12 h-12 bg-gray-100 rounded overflow-hidden">
                            <Image src={u.url} alt={u.filename} fill sizes="48px" className="object-cover" />
                          </div>
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 rounded" />
                        )}
                        <span className="text-xs truncate flex-1">{u.filename}</span>
                        {u.url && (
                          <a
                            href={u.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-teal hover:underline flex items-center gap-1"
                          >
                            <Download className="w-3 h-3" /> Open
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-muted mb-1">Admin notes</label>
                <textarea
                  defaultValue={detail.adminNotes ?? ""}
                  onBlur={(e) =>
                    e.target.value !== (detail.adminNotes ?? "") &&
                    void patchDetail(detail.id, { adminNotes: e.target.value })
                  }
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:border-teal focus:outline-none"
                  placeholder="Internal notes — call outcome, etc."
                />
              </div>

              <p className="text-xs text-muted">Changing the status applies immediately.</p>
            </div>

            <div className="px-6 py-4 border-t border-line flex justify-between items-center">
              <button
                onClick={() => void removeBooking()}
                disabled={deleting}
                className="text-xs text-red-600 hover:underline disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Delete booking"}
              </button>
              <button
                onClick={() => setDetail(null)}
                className="text-sm border border-gray-200 rounded-lg px-4 py-2 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
