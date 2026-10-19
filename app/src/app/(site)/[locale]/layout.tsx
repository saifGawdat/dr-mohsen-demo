import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { isLocale, localeDirection, type Locale } from "@/i18n/config";
import { getSettings } from "@/lib/settings";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { WhatsappFab } from "@/components/site/whatsapp-fab";

interface Props {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: raw } = await params;
  if (!isLocale(raw)) return {};
  const locale = raw as Locale;
  const settings = await getSettings();

  const title =
    locale === "ar"
      ? `${settings.siteName} — التخدير وعلاج الألم`
      : `${settings.siteName} — Anaesthesia & Pain Management`;

  return {
    title,
    alternates: {
      canonical: `/${locale}`,
      languages: { en: "/en", ar: "/ar" },
    },
    openGraph: {
      locale: locale === "ar" ? "ar_EG" : "en_EG",
      images: settings.ogImage ? [{ url: settings.ogImage }] : undefined,
    },
  };
}

export default async function SiteLayout({ children, params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;

  const settings = await getSettings();
  const dir = localeDirection[locale];
  const messages = await getMessages();

  return (
    // `dir` has to be correct in the server-rendered HTML — the
    // `[dir=ltr]` / `[dir=rtl]` rules in globals.css key off the attribute,
    // and a client-side flip would repaint the whole page after paint. The
    // root layout stays locale-blind (it is also the shell for Next's
    // request-less /_not-found prerender), so the locale is applied here.
    <div dir={dir} lang={locale} className="flex min-h-screen flex-col">
      <NextIntlClientProvider messages={messages}>
        <SiteHeader locale={locale} logoUrl={settings.logoUrl} siteName={settings.siteName} phone={settings.contactPhone} whatsapp={settings.whatsappNumber} />
        <main className="flex-1">{children}</main>
        <SiteFooter
          locale={locale}
          siteName={settings.siteName}
          phone={settings.contactPhone}
          email={settings.contactEmail}
          address={settings.address}
          openingHours={settings.openingHours}
          facebookUrl={settings.facebookUrl}
          instagramUrl={settings.instagramUrl}
          newsletterEnabled={settings.newsletterEnabled}
        />
        {settings.whatsappEnabled && settings.whatsappNumber && (
          <WhatsappFab number={settings.whatsappNumber} label={locale === "ar" ? "واتساب" : "WhatsApp"} />
        )}
      </NextIntlClientProvider>
    </div>
  );
}
