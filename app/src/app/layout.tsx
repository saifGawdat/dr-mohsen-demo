import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { defaultLocale, isLocale, localeDirection } from "@/i18n/config";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Dr. Mohsen Mamdouh — Anaesthesia & Pain Management",
    template: "%s | Dr. Mohsen Mamdouh",
  },
  description:
    "A complete anaesthesia team for any hospital, surgical centre or clinic — plus a network of doctors across every specialty. Book online and upload your labs before the visit.",
};

/**
 * The single root layout. It exists only to own the document shell.
 *
 * `dir` has to be on <html> and correct in the server-rendered HTML — the
 * `[dir=ltr]` / `[dir=rtl]` rules in globals.css key off it, and a client-side
 * flip would repaint the whole page after paint. The locale comes from
 * next-intl's request config, which the proxy resolves from the URL. Admin
 * routes fall through to the default locale and re-assert LTR themselves.
 */
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Next's built-in `/_not-found` shell is prerendered with no request in
  // scope, so next-intl has nothing to resolve a locale from and throws. That
  // page only needs a sane document shell, so fall back to the default locale
  // rather than failing the build.
  let resolved: string | undefined;
  try {
    resolved = await getLocale();
  } catch {
    resolved = defaultLocale;
  }
  const locale = isLocale(resolved) ? resolved : defaultLocale;
  const dir = localeDirection[locale];

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body className="bg-paper text-ink antialiased">{children}</body>
    </html>
  );
}
