"use client";

import * as React from "react";
import { toast } from "sonner";
import { EmptyRow, PageHeader, StatusBadge, Td, Th } from "@/components/admin/ui";

interface Message {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  message: string;
  status: string;
  createdAt: string;
}

export default function MessagesPage() {
  const [rows, setRows] = React.useState<Message[] | null>(null);
  const [openId, setOpenId] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    const res = await fetch("/api/admin/messages");
    const data = await res.json();
    setRows(data.messages ?? []);
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function patch(id: string, status: string) {
    const res = await fetch(`/api/admin/messages/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      toast.error("Update failed");
      return;
    }
    void load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this message?")) return;
    const res = await fetch(`/api/admin/messages/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Delete failed");
      return;
    }
    toast.success("Deleted");
    void load();
  }

  return (
    <div>
      <PageHeader title="Messages" description="Contact-form submissions. Mark REPLIED once answered." />

      <div className="space-y-3">
        {rows === null ? (
          <p className="text-sm text-muted py-12 text-center">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted py-12 text-center bg-white border border-line rounded-xl">No messages yet.</p>
        ) : (
          rows.map((m) => (
            <div key={m.id} className="bg-white border border-line rounded-xl overflow-hidden">
              <button
                className="w-full px-4 py-3 flex items-center justify-between gap-4 text-left hover:bg-gray-50"
                onClick={() => {
                  setOpenId(openId === m.id ? null : m.id);
                  if (m.status === "NEW") void patch(m.id, "READ");
                }}
              >
                <div className="min-w-0">
                  <p className="font-medium text-sm">
                    {m.name}
                    {m.phone && <span className="text-muted font-mono text-xs"> · {m.phone}</span>}
                    {m.email && <span className="text-muted text-xs truncate"> · {m.email}</span>}
                  </p>
                  <p className="text-xs text-muted truncate">{m.message}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <StatusBadge status={m.status} />
                  <span className="text-xs text-muted whitespace-nowrap">
                    {new Date(m.createdAt).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })}
                  </span>
                </div>
              </button>

              {openId === m.id && (
                <div className="px-4 pb-4 border-t border-line pt-3 space-y-3 text-sm">
                  <p className="whitespace-pre-wrap bg-gray-50 rounded-lg p-3">{m.message}</p>
                  <div className="flex gap-3 items-center justify-between">
                    <div className="flex gap-2">
                      {m.status !== "REPLIED" && (
                        <button onClick={() => void patch(m.id, "REPLIED")} className="text-xs border border-gray-200 rounded-md px-2.5 py-1.5 hover:bg-gray-50">
                          Mark replied
                        </button>
                      )}
                      <button onClick={() => void patch(m.id, "NEW")} className="text-xs border border-gray-200 rounded-md px-2.5 py-1.5 hover:bg-gray-50">
                        Back to new
                      </button>
                    </div>
                    <button onClick={() => void remove(m.id)} className="text-xs text-red-600 hover:underline">
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
