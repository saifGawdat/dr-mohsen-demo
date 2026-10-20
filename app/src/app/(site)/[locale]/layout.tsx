import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { isLocale, localeDirection, type Locale } from "@/i18n/config";
import { getSettings } from "@/lib/settings";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { WhatsappFab } from "@/components/site/whatsapp-fab";
import "@phosphor-icons/web/light";
import "@phosphor-icons/web/fill";
import "./landing.css";
import "./landing.css";

interface Props {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: raw } = await params;
  if (!isLocale(raw)) return {};
  const locale = raw as Locale;

  const title =
    locale === "ar"
      ? "د. محسن ممدوح | فريق تخدير وعلاج ألم — أطباء كل التخصصات"
      : "Dr. Mohsen Mamdouh | Anaesthesia & pain team — doctors across every specialty";
  const description =
    locale === "ar"
      ? "د. محسن ممدوح، أخصائي تخدير وعلاج ألم. فريق تخدير متكامل لأي مستشفى أو مركز أو عيادة، وشبكة أطباء في كل التخصصات: أسنان، نساء وتوليد، تجميل، أنف وأذن. احجز أونلاين وارفع تحاليلك وأشعتك."
      : "Dr. Mohsen Mamdouh, anaesthetist and pain management. A complete anaesthesia team for any hospital, centre or clinic, and a network of doctors across every specialty. Book online and upload your labs and scans.";

  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical: `/${locale}`,
      languages: { en: "/en", ar: "/ar" },
    },
    openGraph: {
      title,
      description,
      locale: locale === "ar" ? "ar_EG" : "en_EG",
      images: [{ url: "/brand/dr-mohsen-poster.jpg" }],
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
    // `dir`/`lang` live on the storefront wrapper (not <html>) so the admin
    // dashboard and Next's request-less error pages keep their own direction.
    // The ported stylesheet scopes every language rule to `.m-site[lang]`.
    <div dir={dir} lang={locale} className="m-site">
      <NextIntlClientProvider messages={messages}>
        <SiteHeader
          locale={locale}
          logoUrl={settings.logoUrl}
          siteName={settings.siteName}
          phone={settings.contactPhone}
          whatsapp={settings.whatsappNumber}
        />

        {children}

        <SiteFooter
          locale={locale}
          siteName={settings.siteName}
          phone={settings.contactPhone}
          email={settings.contactEmail}
          whatsapp={settings.whatsappNumber}
        />

        {settings.whatsappEnabled && settings.whatsappNumber && (
          <WhatsappFab
            locale={locale}
            number={settings.whatsappNumber}
            label={locale === "ar" ? "واتساب" : "WhatsApp"}
          />
        )}
      </NextIntlClientProvider>
    </div>
  );
}
