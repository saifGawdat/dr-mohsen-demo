"use client";

import { createContext, useContext } from "react";
import type { AuthUser } from "@/lib/auth/session";

/**
 * A read-only copy of who the server resolved for this render, so client
 * components can show a name or decide whether to sync a cart without a
 * round trip.
 *
 * This is a convenience cache and nothing more. It is seeded from a server
 * component on every navigation and is trivially editable from devtools, so
 * nothing may be authorised on the strength of it — every protected read or
 * write is checked again on the server.
 */
const AuthContext = createContext<AuthUser | null>(null);

export function AuthProvider({
  user,
  children,
}: {
  user: AuthUser | null;
  children: React.ReactNode;
}) {
  return <AuthContext.Provider value={user}>{children}</AuthContext.Provider>;
}

/** The signed-in shopper as of the last server render, or null. */
export function useAuth(): AuthUser | null {
  return useContext(AuthContext);
}
