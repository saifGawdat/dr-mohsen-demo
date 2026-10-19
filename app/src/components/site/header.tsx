"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Phone } from "lucide-react";

interface Props {
  locale: "en" | "ar";
  logoUrl: string | null;
  siteName: string;
  phone: string | null;
  whatsapp: string | null;
}

const copy = {
  en: {
    about: "About",
    specialties: "Specialties",
    doctors: "Doctors",
    faq: "FAQ",
    contact: "Contact",
    book: "Book online",
    team: "Book a team",
    switchTo: "العربية",
  },
  ar: {
    about: "عن الدكتور",
    specialties: "التخصصات",
    doctors: "الأطباء",
    faq: "أسئلة شائعة",
    contact: "تواصل معنا",
    book: "احجز أونلاين",
    team: "اطلب فريق تخدير",
    switchTo: "English",
  },
} as const;

export function SiteHeader({ locale, logoUrl, siteName, phone, whatsapp }: Props) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();
  const t = copy[locale];

  const other = locale === "ar" ? "en" : "ar";
  // Swap the locale segment in the current path; undefined on non-locale paths.
  const switchHref = (() => {
    if (!pathname.startsWith("/en") && !pathname.startsWith("/ar")) return `/${other}`;
    return `/${other}${pathname.slice(3)}`;
  })();

  const nav = [
    { label: t.about, href: "#about" },
    { label: t.specialties, href: "#specialties" },
    { label: t.doctors, href: "#doctors" },
    { label: t.faq, href: "#faq" },
    { label: t.contact, href: "#contact" },
  ];

  return (
    <header className="sticky top-0 z-40 bg-paper/90 backdrop-blur border-b border-line">
      <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between gap-4">
        <Link href={`/${locale}`} className="flex items-center gap-2 shrink-0">
          {logoUrl ? (
            <Image src={logoUrl} alt={siteName} width={140} height={40} className="h-9 w-auto" />
          ) : (
            <span className="font-bold text-blue-ink">{siteName}</span>
          )}
        </Link>

        <nav className="hidden lg:flex items-center gap-6 text-sm">
          {nav.map((item) => (
            <a key={item.href} href={item.href} className="text-ink/80 hover:text-teal transition-colors">
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href={switchHref}
            className="text-sm px-3 py-1.5 rounded-full border border-line text-ink/70 hover:border-teal hover:text-teal transition-colors"
          >
            {t.switchTo}
          </Link>

          {phone && (
            <a
              href={`tel:${phone.replace(/\s/g, "")}`}
              className="hidden sm:flex items-center gap-1.5 text-sm text-ink/70 hover:text-teal transition-colors"
              aria-label={phone}
            >
              <Phone className="w-4 h-4" />
              <span className="font-mono">{phone}</span>
            </a>
          )}

          <a
            href="#booking"
            className="hidden sm:inline-flex bg-teal text-white text-sm font-medium rounded-full px-4 py-2 hover:bg-teal-deep transition-colors"
          >
            {t.book}
          </a>

          <button
            className="lg:hidden p-2 text-ink"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-line bg-paper px-4 py-4 space-y-3">
          {nav.map((item) => (
            <a key={item.href} href={item.href} onClick={() => setOpen(false)} className="block text-sm text-ink/80">
              {item.label}
            </a>
          ))}
          <a
            href="#booking"
            onClick={() => setOpen(false)}
            className="block text-center bg-teal text-white text-sm font-medium rounded-full px-4 py-2"
          >
            {t.book}
          </a>
          <a
            href="#team-request"
            onClick={() => setOpen(false)}
            className="block text-center border border-teal text-teal text-sm font-medium rounded-full px-4 py-2"
          >
            {t.team}
          </a>
        </div>
      )}
    </header>
  );
}
