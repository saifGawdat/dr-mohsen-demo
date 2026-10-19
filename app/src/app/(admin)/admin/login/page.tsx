"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/auth-client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const result = await signIn(email, password);
    if (result.ok) {
      // Full navigation so every server component re-renders as signed-in.
      window.location.href = "/admin";
      return;
    }

    setError(result.error);
    setPending(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-3 mb-8">
          <Image
            src="/brand/logo.png"
            alt="Dr. Mohsen Mamdouh"
            width={160}
            height={48}
            className="h-12 w-auto"
            priority
          />
          <p className="text-sm text-muted">Admin dashboard</p>
        </div>

        <form
          onSubmit={onSubmit}
          className="bg-white border border-line rounded-2xl p-6 shadow-sm space-y-4"
        >
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1.5">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal"
            />
          </div>

          {error && <p className="text-sm text-err">{error}</p>}

          <button
            type="submit"
            disabled={pending}
            className="w-full bg-teal text-white rounded-lg py-2.5 text-sm font-medium hover:bg-teal-deep transition-colors disabled:opacity-60"
          >
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
