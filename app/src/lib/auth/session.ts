import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

export const SESSION_COOKIE = "dm_session";

/** Sessions last 30 days, and are extended once a session is over halfway old. */
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const REFRESH_THRESHOLD_MS = 15 * 24 * 60 * 60 * 1000;

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  role: "ADMIN" | "CUSTOMER";
  image: string | null;
};

/**
 * The cookie carries the raw token; the database stores only this digest of it.
 * A leaked database dump therefore contains nothing that can be replayed as a
 * login, and lookups stay a single indexed primary-key read.
 */
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

export function cookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    expires: expiresAt,
  };
}

/**
 * Issues a fresh session. Always called on a successful login rather than
 * reusing whatever token the request arrived with, so a token planted by an
 * attacker before sign-in is never promoted to an authenticated one.
 */
export async function createSession(userId: string): Promise<{ token: string; expiresAt: Date }> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await prisma.session.create({
    data: { id: hashToken(token), userId, expiresAt },
  });

  return { token, expiresAt };
}

export async function setSessionCookie(token: string, expiresAt: Date): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, cookieOptions(expiresAt));
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, "", { ...cookieOptions(new Date(0)), maxAge: 0 });
}

export async function readSessionToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(SESSION_COOKIE)?.value ?? null;
}

/**
 * Resolves a token to its owner, or null when the session is unknown, expired
 * or revoked. Expired rows are deleted on sight so the table self-prunes for
 * anyone who comes back after a long absence.
 */
export async function validateSessionToken(token: string): Promise<AuthUser | null> {
  if (!token) return null;

  const id = hashToken(token);

  const session = await prisma.session.findUnique({
    where: { id },
    select: {
      id: true,
      expiresAt: true,
      user: {
        select: { id: true, email: true, name: true, role: true, image: true },
      },
    },
  });

  if (!session) return null;

  if (session.expiresAt.getTime() <= Date.now()) {
    await prisma.session.delete({ where: { id } }).catch(() => {});
    return null;
  }

  // Rolling expiry: an active admin is not signed out mid-visit on day 30.
  if (session.expiresAt.getTime() - Date.now() < REFRESH_THRESHOLD_MS) {
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    await prisma.session.update({ where: { id }, data: { expiresAt } }).catch(() => {});
    // Server Components may not write cookies; the database row is the
    // authority either way, so a failure here is not worth surfacing.
    try {
      await setSessionCookie(token, expiresAt);
    } catch {
      /* not in a mutable-cookie context */
    }
  }

  return session.user;
}

export async function revokeSession(token: string): Promise<void> {
  await prisma.session.delete({ where: { id: hashToken(token) } }).catch(() => {});
}

/**
 * Drops every session a user holds. Used after a password change so a stolen
 * cookie stops working the moment the account owner reacts to it.
 */
export async function revokeAllSessions(userId: string, except?: string): Promise<void> {
  await prisma.session.deleteMany({
    where: {
      userId,
      ...(except ? { id: { not: hashToken(except) } } : {}),
    },
  });
}
