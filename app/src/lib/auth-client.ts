/**
 * Browser-side calls to the credential endpoints.
 *
 * These are thin `fetch` wrappers, not a client session store — the cookie is
 * HttpOnly and never readable here, and identity always comes from the server.
 * After a successful sign-in or sign-out the page is replaced rather than
 * soft-navigated, so every server component re-renders against the new session.
 */

export type AuthResult = { ok: true } | { ok: false; error: string };

async function post(url: string, body?: unknown): Promise<AuthResult> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // The session cookie must ride along; it is same-origin, but be explicit.
      credentials: "same-origin",
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return { ok: false, error: data.error ?? "Something went wrong" };
    }

    return { ok: true };
  } catch {
    return { ok: false, error: "Network error. Please try again." };
  }
}

export function signIn(email: string, password: string): Promise<AuthResult> {
  return post("/api/auth/login", { email, password });
}

export function register(input: {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
}): Promise<AuthResult> {
  return post("/api/auth/register", input);
}

/**
 * Ends the session server-side, then hard-navigates so no stale authenticated
 * markup survives in the client router cache.
 */
export async function signOut(callbackUrl: string): Promise<void> {
  await post("/api/auth/logout");
  window.location.href = callbackUrl;
}
