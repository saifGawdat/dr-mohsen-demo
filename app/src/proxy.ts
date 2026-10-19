import { NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { locales, defaultLocale } from "@/i18n/config";

const SESSION_COOKIE = "dm_session";

// Create the i18n middleware
const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: "always",
});

/**
 * This runs on the Edge runtime, where Prisma is unavailable — so it can only
 * see *that* a session cookie exists, never whether it is valid or whose it is.
 * Everything here is therefore optimistic: it exists to send anonymous visitors
 * somewhere sensible, not to authorise anyone.
 *
 * The real checks are `requireAdmin()` in the dashboard layout and
 * `getCurrentUser()` in each route handler, both of which hit the database.
 */
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSessionCookie = Boolean(req.cookies.get(SESSION_COOKIE)?.value);

  const isAdminRoute = pathname.startsWith("/admin");
  const isApiRoute = pathname.startsWith("/api");
  const isStaticFile = pathname.includes(".");
  const isNextInternal = pathname.startsWith("/_next");

  // Reject cross-site state changes before they reach a handler. The session
  // cookie is SameSite=Lax, so a cross-site POST arrives without it and would
  // fail anyway; this closes the gap for anything Lax still forwards.
  if (!isNextInternal && !isSameOriginMutation(req)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  if (isAdminRoute) {
    const isAdminLoginPage = pathname === "/admin/login";

    if (isAdminLoginPage) {
      // A stale cookie would bounce forever, so let the page decide.
      return nextWithPathname(req);
    }

    if (!hasSessionCookie) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }

    // Role is not knowable here; the dashboard layout enforces it.
    return nextWithPathname(req);
  }

  if (isApiRoute || isStaticFile || isNextInternal) {
    return NextResponse.next();
  }

  return intlMiddleware(req);
}

/**
 * Passes the path down to server components, which cannot read it themselves.
 * The dashboard layout uses it to let `/admin/login` through unguarded. It has
 * to be set on the forwarded *request* headers, not on the response.
 */
function nextWithPathname(req: NextRequest): NextResponse {
  const headers = new Headers(req.headers);
  headers.set("x-pathname", req.nextUrl.pathname);
  return NextResponse.next({ request: { headers } });
}

function isSameOriginMutation(req: NextRequest): boolean {
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") {
    return true;
  }

  const origin = req.headers.get("origin");
  // Same-origin fetches from older clients may omit Origin entirely; a
  // cross-site request that can set cookies never does.
  if (!origin) return true;

  try {
    return new URL(origin).host === req.headers.get("host");
  } catch {
    return false;
  }
}

export const config = {
  matcher: [
    // Match all pathnames except static files
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
