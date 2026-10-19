"use client";

import * as React from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin/ui";

const input =
  "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-teal focus:outline-none";

export default function ProfilePage() {
  const user = useAuth();
  const [name, setName] = React.useState(user?.name ?? "");
  const [email, setEmail] = React.useState(user?.email ?? "");
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const body: Record<string, string> = { name, email };
      if (newPassword) {
        body.currentPassword = currentPassword;
        body.newPassword = newPassword;
      }

      const res = await fetch("/api/admin/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Save failed");
        return;
      }

      toast.success(
        newPassword ? "Saved — other devices are signed out" : "Saved"
      );
      setCurrentPassword("");
      setNewPassword("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-xl">
      <PageHeader title="Profile" description="Your account details and password." />

      <form onSubmit={save} className="bg-white border border-line rounded-xl p-6 space-y-4">
        <label className="block">
          <span className="block text-sm font-medium mb-1">Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className={input} />
        </label>
        <label className="block">
          <span className="block text-sm font-medium mb-1">Email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={input} />
        </label>

        <div className="border-t border-line pt-4 space-y-4">
          <p className="text-sm font-medium">Change password</p>
          <label className="block">
            <span className="block text-sm font-medium mb-1">Current password</span>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={input}
              autoComplete="current-password"
            />
          </label>
          <label className="block">
            <span className="block text-sm font-medium mb-1">New password</span>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={input}
              autoComplete="new-password"
              placeholder="At least 8 characters"
            />
          </label>
          <p className="text-xs text-muted">
            Changing the password signs out every other device.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="bg-teal text-white rounded-lg px-5 py-2 text-sm font-medium hover:bg-teal-deep disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </form>
    </div>
  );
}
