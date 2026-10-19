"use client";

import * as React from "react";
import { EmptyRow, PageHeader, Td, Th } from "@/components/admin/ui";

interface Subscriber {
  id: string;
  email: string;
  subscribedAt: string;
}

export default function NewsletterPage() {
  const [rows, setRows] = React.useState<Subscriber[] | null>(null);

  const load = React.useCallback(async () => {
    // The messages endpoint returns both queues; the newsletter is the list.
    const res = await fetch("/api/admin/messages");
    const data = await res.json();
    setRows(data.subscribers ?? []);
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <PageHeader
        title="Newsletter"
        description="Subscribers collected from the storefront form. Copy the list into your mail tool."
        action={
          rows && rows.length > 0 ? (
            <button
              onClick={() => {
                navigator.clipboard.writeText(rows.map((r) => r.email).join(",\n"));
              }}
              className="border border-gray-200 rounded-lg px-4 py-2 text-sm hover:bg-gray-50"
            >
              Copy all addresses
            </button>
          ) : undefined
        }
      />

      <div className="bg-white border border-line rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-line">
              <tr>
                <Th>Email</Th>
                <Th>Subscribed</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows === null ? (
                <EmptyRow colSpan={2}>Loading…</EmptyRow>
              ) : rows.length === 0 ? (
                <EmptyRow colSpan={2}>No subscribers yet.</EmptyRow>
              ) : (
                rows.map((s) => (
                  <tr key={s.id}>
                    <Td className="font-mono text-xs">{s.email}</Td>
                    <Td className="text-xs text-muted whitespace-nowrap">
                      {new Date(s.subscribedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
                    </Td>
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
