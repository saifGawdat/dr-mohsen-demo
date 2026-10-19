"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { EmptyRow, PageHeader, PipelineSelect, Td, Th } from "@/components/admin/ui";

interface TeamRequestRow {
  id: string;
  number: string;
  name: string;
  phone: string;
  facility: string;
  facilityCity: string | null;
  role: string | null;
  fromDate: string;
  toDate: string | null;
  casesPerDay: number | null;
  daysPerWeek: number | null;
  notes: string | null;
  adminNotes: string | null;
  status: string;
  createdAt: string;
}

function fmtDate(value: string | null): string {
  return value
    ? new Date(value).toLocaleDateString("en-GB", { dateStyle: "medium" })
    : "—";
}

export default function TeamRequestsPage() {
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get("status") ?? "";

  const [rows, setRows] = React.useState<TeamRequestRow[] | null>(null);
  const [q, setQ] = React.useState("");
  const [openId, setOpenId] = React.useState<string | null>(null);
  const [adminNote, setAdminNote] = React.useState("");
  const [detail, setDetail] = React.useState<TeamRequestRow | null>(null);

  const load = React.useCallback(async () => {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (q.trim()) params.set("q", q.trim());
    const res = await fetch(`/api/admin/team-requests?${params}`);
    const data = await res.json();
    setRows(data.teamRequests ?? []);
  }, [statusFilter, q]);

  React.useEffect(() => {
    const t = setTimeout(() => void load(), q ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, q]);

  async function patch(id: string, body: Record<string, unknown>) {
    const res = await fetch(`/api/admin/team-requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      toast.error("Update failed");
      return;
    }
    void load();
    if (detail?.id === id) setDetail({ ...detail, ...body } as TeamRequestRow);
    toast.success("Saved");
  }

  function toggleOpen(row: TeamRequestRow) {
    setOpenId(openId === row.id ? null : row.id);
    setAdminNote(row.adminNotes ?? "");
    setDetail(row);
  }

  return (
    <div>
      <PageHeader
        title="Team requests"
        description="Facilities asking for anaesthesia cover. Confirm dates, then mark DONE once the cover is delivered."
      />

      <div className="flex gap-2 mb-4 items-center">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, facility or number…"
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full max-w-xs focus:border-teal focus:outline-none"
        />
        {statusFilter && (
          <a href="/admin/team-requests" className="text-xs text-teal hover:underline whitespace-nowrap">
            Clear filter: {statusFilter.toLowerCase()}
          </a>
        )}
      </div>

      {/* Expanded detail is rendered inline above the table. */}
      {detail && openId && (
        <div className="bg-white border border-teal-15 rounded-xl p-4 mb-4 text-sm space-y-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-bold">{detail.facility}</h3>
              <p className="text-xs text-muted font-mono">
                {detail.number} · {fmtDate(detail.createdAt)}
              </p>
            </div>
            <button onClick={() => setOpenId(null)} className="text-xs text-muted hover:text-ink">
              Close
            </button>
          </div>
          <p>
            <span className="text-muted">Contact:</span> {detail.name} ·{" "}
            <a href={`tel:${detail.phone}`} className="font-mono hover:text-teal">
              {detail.phone}
            </a>
          </p>
          <p>
            <span className="text-muted">City:</span> {detail.facilityCity ?? "—"} ·{" "}
            <span className="text-muted">Role:</span> {detail.role ?? "—"}
          </p>
          <p>
            <span className="text-muted">Cover:</span> {fmtDate(detail.fromDate)} → {fmtDate(detail.toDate)} ·{" "}
            <span className="text-muted">Cases/day:</span> {detail.casesPerDay ?? "—"} ·{" "}
            <span className="text-muted">Days/week:</span> {detail.daysPerWeek ?? "—"}
          </p>
          {detail.notes && (
            <p className="whitespace-pre-wrap bg-gray-50 rounded-lg p-3">{detail.notes}</p>
          )}
          <div>
            <label className="block text-muted mb-1">Admin notes</label>
            <textarea
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              onBlur={() => adminNote !== (detail.adminNotes ?? "") && void patch(detail.id, { adminNotes: adminNote })}
              rows={2}
              className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:border-teal focus:outline-none"
            />
          </div>
        </div>
      )}

      <div className="bg-white border border-line rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-line">
              <tr>
                <Th>Facility</Th>
                <Th>Contact</Th>
                <Th>From → To</Th>
                <Th>Status</Th>
                <Th>Received</Th>
                <Th />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows === null ? (
                <EmptyRow colSpan={6}>Loading…</EmptyRow>
              ) : rows.length === 0 ? (
                <EmptyRow colSpan={6}>No team requests match.</EmptyRow>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="cursor-pointer hover:bg-gray-50" onClick={() => toggleOpen(r)}>
                    <Td className="font-medium">
                      {r.facility}
                      <span className="text-xs text-muted block">{r.facilityCity ?? ""}</span>
                    </Td>
                    <Td>
                      {r.name}
                      <span className="text-xs text-muted block font-mono">{r.phone}</span>
                    </Td>
                    <Td className="text-xs whitespace-nowrap">
                      {fmtDate(r.fromDate)} → {fmtDate(r.toDate)}
                    </Td>
                    <Td onClick={(e) => e.stopPropagation()}>
                      <PipelineSelect value={r.status} onChange={(status) => void patch(r.id, { status })} />
                    </Td>
                    <Td className="text-xs text-muted whitespace-nowrap">{fmtDate(r.createdAt)}</Td>
                    <Td className="text-xs text-teal whitespace-nowrap">Details</Td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
