import type { Metadata, Viewport } from "next";
import "./globals.css";

/**
 * The single root layout. It owns the document shell.
 *
 * It must stay fully synchronous and free of request-context reads
 * (`headers()`, `cookies()`, next-intl's request APIs): Next prerenders the
 * internal `/_not-found` and `/_global-error` pages through this layout with
 * no request in scope, and any dynamic read reachable from here aborts that
 * static generation with a "workUnitAsyncStorage" invariant.
 *
 * The locale is therefore resolved one level down: the storefront group sets
 * `dir`/`lang` on its own wrapper (the `[dir=ltr]` / `[dir=rtl]` rules in
 * globals.css match any element carrying the attribute, not just <html>), and
 * the admin group re-asserts LTR English-only chrome the same way.
 */
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Dr. Mohsen Mamdouh — Anaesthesia & Pain Management",
    template: "%s | Dr. Mohsen Mamdouh",
  },
  description:
    "A complete anaesthesia team for any hospital, surgical centre or clinic — plus a network of doctors across every specialty. Book online and upload your labs before the visit.",
  icons: {
    icon: [{ url: "/brand/logo-mark-64.png", type: "image/png" }],
    apple: "/brand/logo-mark-180.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#20438E",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <body className="bg-paper text-ink antialiased">{children}</body>
    </html>
  );
}
