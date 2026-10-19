import { cache } from "react";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword, verifyPassword, verifyPasswordDummy } from "./password";
import {
  type AuthUser,
  createSession,
  clearSessionCookie,
  readSessionToken,
  revokeAllSessions,
  revokeSession,
  setSessionCookie,
  validateSessionToken,
} from "./session";

export type { AuthUser };
export { revokeAllSessions, revokeSession, hashPassword, verifyPassword };

/**
 * The one place identity is resolved. Everything that needs to know who is
 * making a request — route handlers, server components, layouts — comes through
 * here, so there is a single definition of "signed in" to audit.
 *
 * Wrapped in React's `cache` so several guards in one render share a single
 * database read.
 */
export const getCurrentUser = cache(async (): Promise<AuthUser | null> => {
  const token = await readSessionToken();
  if (!token) return null;
  return validateSessionToken(token);
});

/**
 * Page guard: sends anonymous visitors to sign in and back to where they were.
 * `redirect` throws, so callers can treat the return value as always present.
 */
export async function requireAuth(loginPath = "/en/login", callbackUrl?: string): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    const target = callbackUrl
      ? `${loginPath}?callbackUrl=${encodeURIComponent(callbackUrl)}`
      : loginPath;
    redirect(target);
  }
  return user;
}

/** Page guard for the dashboard. Non-admins are bounced to the storefront. */
export async function requireAdmin(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  if (user.role !== "ADMIN") redirect("/");
  return user;
}

export function unauthorized(): NextResponse {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function forbidden(): NextResponse {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

/**
 * Signs a user in from an email and password. Returns null for every failure —
 * unknown address, no password set, wrong password — so callers cannot
 * accidentally build a response that distinguishes them.
 */
export async function login(email: string, password: string): Promise<AuthUser | null> {
  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      image: true,
      password: true,
    },
  });

  if (!user?.password) {
    // Spend the same time as a real verification so a missing account is not
    // detectable from how quickly the request comes back.
    await verifyPasswordDummy(password);
    return null;
  }

  if (!(await verifyPassword(password, user.password))) return null;

  const { token, expiresAt } = await createSession(user.id);
  await setSessionCookie(token, expiresAt);

  const { password: _password, ...authUser } = user;
  return authUser;
}

/** Revokes the current session server-side, then clears the cookie. */
export async function logout(): Promise<void> {
  const token = await readSessionToken();
  if (token) await revokeSession(token);
  await clearSessionCookie();
}

/** Starts a session for a freshly registered user. */
export async function startSession(userId: string): Promise<void> {
  const { token, expiresAt } = await createSession(userId);
  await setSessionCookie(token, expiresAt);
}

/**
 * Drops every other session for a user and re-issues the current one. Called
 * after a password change so other devices are signed out without signing out
 * the person making the change.
 */
export async function rotateSession(userId: string): Promise<void> {
  await revokeAllSessions(userId);
  await startSession(userId);
}
