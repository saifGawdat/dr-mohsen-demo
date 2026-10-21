"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { Bi } from "@/components/site/bilingual";
import { phoneDigits, waLink } from "@/lib/site-format";

interface Props {
  locale: Locale;
  logoUrl: string | null;
  siteName: string;
  phone: string | null;
  whatsapp: string | null;
}

const MENU = [
  { href: "#team", en: "Anaesthesia team", ar: "فريق التخدير" },
  { href: "#specialties", en: "Specialties", ar: "التخصصات" },
  { href: "#doctors", en: "Doctors", ar: "الأطباء" },
  { href: "#procedures", en: "Procedures", ar: "العمليات" },
  { href: "#booking", en: "Online booking", ar: "الحجز أونلاين" },
  { href: "#faq", en: "FAQ", ar: "أسئلة شائعة" },
  { href: "#contact", en: "Contact", ar: "تواصل" },
] as const;

export function SiteHeader({ locale, logoUrl, siteName, phone, whatsapp }: Props) {
  const [solid, setSolid] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const burgerRef = React.useRef<HTMLButtonElement>(null);
  const router = useRouter();

  // The nav is transparent over the hero and solid after 60px, as designed.
  React.useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock the page behind the drawer and let Escape close it.
  React.useEffect(() => {
    if (!menuOpen) return;
    const root = document.documentElement;
    const previousBody = document.body.style.overflow;
    const previousRoot = root.style.overflow;
    document.body.style.overflow = "hidden";
    root.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      burgerRef.current?.focus();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousBody;
      root.style.overflow = previousRoot;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  const switchLocale = (next: Locale) => {
    setMenuOpen(false);
    if (next === locale) return;
    const hash = typeof window === "undefined" ? "" : window.location.hash;
    router.push(`/${next}${hash}`);
  };

  const darkLogo = logoUrl || "/brand/logo.png";

  return (
    <>
      <header className={`m-nav${solid ? " is-solid" : ""}`}>
        <div className="wrap">
          <a className="m-nav__logo" href="#top" aria-label={siteName}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="is-light" src="/brand/logo-white.png" alt={siteName} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="is-dark" src={darkLogo} alt={siteName} />
          </a>

          <div className="m-nav__end">
            {phone && (
              <a className="m-nav__tel" href={`tel:${phoneDigits(phone)}`}>
                <i className="ph-light ph-phone" aria-hidden="true" />
                <span className="ltr">{phone}</span>
              </a>
            )}

            <div className="m-lang" data-lang-switch>
              <button type="button" onClick={() => switchLocale("ar")} aria-pressed={locale === "ar"}>
                عربي
              </button>
              <span aria-hidden="true">/</span>
              <button type="button" onClick={() => switchLocale("en")} aria-pressed={locale === "en"}>
                EN
              </button>
            </div>

            <a className="btn btn--sm" href="#booking">
              <Bi en="Book online" ar="احجز أونلاين" />
            </a>
            <button
              ref={burgerRef}
              className="m-nav__burger"
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="القائمة"
              aria-expanded={menuOpen}
              aria-controls="site-menu"
            >
              <i className="ph-light ph-list" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <div
        id="site-menu"
        className={`m-menu${menuOpen ? " is-open" : ""}`}
        data-menu
        aria-hidden={!menuOpen}
      >
        <div className="m-menu__top">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo-white.png" alt={siteName} />
          <button className="m-menu__x" type="button" onClick={() => setMenuOpen(false)} aria-label="إغلاق">
            <i className="ph-light ph-x" aria-hidden="true" />
          </button>
        </div>
        {MENU.map((item) => (
          <a key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>
            <Bi en={item.en} ar={item.ar} />
          </a>
        ))}
        <button className="btn" type="button" data-team-request onClick={() => setMenuOpen(false)}>
          <Bi en="Request an anaesthesia team" ar="اطلب فريق تخدير" />
        </button>
        <a
          className="btn btn--wa"
          href={
            whatsapp
              ? waLink(
                  whatsapp,
                  locale === "ar"
                    ? "السلام عليكم، مع فريق د. محسن ممدوح. عايز أحجز موعد أو أستفسر عن حالة."
                    : "Hello Dr. Mohsen's team, I would like to book an appointment."
                )
              : "#contact"
          }
          target={whatsapp ? "_blank" : undefined}
          rel={whatsapp ? "noopener" : undefined}
          onClick={() => setMenuOpen(false)}
        >
          <i className="ph-fill ph-whatsapp-logo" aria-hidden="true" />
          <Bi en="Chat on WhatsApp" ar="كلّمنا واتساب" />
        </a>
      </div>
    </>
  );
}
