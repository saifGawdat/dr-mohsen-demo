import type { Locale } from "@/i18n/config";
import { Bi } from "@/components/site/bilingual";
import { phoneDigits, waLink } from "@/lib/site-format";

interface Props {
  locale: Locale;
  siteName: string;
  phone: string | null;
  email: string | null;
  whatsapp: string | null;
}

const EXPLORE = [
  { href: "#team", en: "Anaesthesia team", ar: "فريق التخدير" },
  { href: "#specialties", en: "Specialties", ar: "التخصصات" },
  { href: "#doctors", en: "Doctors", ar: "الأطباء" },
  { href: "#procedures", en: "Procedures", ar: "العمليات" },
  { href: "#process", en: "How it works", ar: "بيحصل إزاي" },
] as const;

const SPECIALTIES = [
  { slug: "dental", en: "Dentistry", ar: "أسنان" },
  { slug: "gyn", en: "Gynaecology", ar: "نساء وتوليد" },
  { slug: "aesthetic", en: "Aesthetics", ar: "تجميل" },
  { slug: "ent", en: "ENT", ar: "أنف وأذن" },
  { slug: "pain", en: "Pain clinic", ar: "علاج الألم" },
] as const;

export function SiteFooter({ locale, siteName, phone, email, whatsapp }: Props) {
  const waText =
    locale === "ar"
      ? "السلام عليكم، مع فريق د. محسن ممدوح. عايز أحجز موعد أو أستفسر عن حالة."
      : "Hello Dr. Mohsen's team, I would like to book an appointment.";

  return (
    <footer className="m-foot">
      <div className="wrap">
        <div className="m-foot__top">
          <div className="m-foot__brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo-white.png" alt={siteName} />
            <p>
              <Bi
                en="A complete anaesthesia team for any hospital, centre or clinic — and a network of doctors across every specialty, with one file, one booking and one standard of care."
                ar="فريق تخدير متكامل لأي مستشفى أو مركز أو عيادة — وشبكة أطباء في كل التخصصات، بملف واحد وحجز واحد ونفس مستوى الرعاية."
              />
            </p>
            <div className="m-foot__badges">
              <span><Bi en="Anaesthesia" ar="تخدير" /></span>
              <span><Bi en="Pain clinic" ar="علاج ألم" /></span>
              <span><Bi en="All specialties" ar="كل التخصصات" /></span>
            </div>
          </div>

          <div>
            <h4><Bi en="Explore" ar="تصفح" /></h4>
            <ul>
              {EXPLORE.map((item) => (
                <li key={item.href}>
                  <a href={item.href}><Bi en={item.en} ar={item.ar} /></a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4><Bi en="Specialties" ar="تخصصات" /></h4>
            <ul>
              {SPECIALTIES.map((item) => (
                <li key={item.slug}>
                  <a href="#doctors" data-goto-spec={item.slug}>
                    <Bi en={item.en} ar={item.ar} />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4><Bi en="Contact" ar="تواصل" /></h4>
            <div className="m-foot__contact">
              {phone && (
                <a className="ltr" href={`tel:${phoneDigits(phone)}`}>
                  <i className="ph-light ph-phone" aria-hidden="true" />
                  {phone}
                </a>
              )}
              {whatsapp && (
                <a href={waLink(whatsapp, waText)} target="_blank" rel="noopener">
                  <i className="ph-fill ph-whatsapp-logo" aria-hidden="true" />
                  <Bi en="WhatsApp" ar="واتساب" />
                </a>
              )}
              {email && (
                <a href={`mailto:${email}`}>
                  <i className="ph-light ph-envelope-simple" aria-hidden="true" />
                  {email}
                </a>
              )}
              <a href="#booking">
                <i className="ph-light ph-calendar-check" aria-hidden="true" />
                <Bi en="Book online" ar="احجز أونلاين" />
              </a>
            </div>
          </div>
        </div>

        <p className="note" style={{ color: "rgba(255,255,255,.55)", maxWidth: "78ch" }}>
          <i className="ph-light ph-info" aria-hidden="true" />{" "}
          <Bi
            en="Review build: doctor names, cities, phone numbers and hours on this page are sample data for the design round, and will be replaced with the real ones before launch."
            ar="نسخة مراجعة: أسماء الأطباء والمدن وأرقام التليفون والمواعيد في الصفحة دي بيانات توضيحية لمرحلة التصميم، وبتتغيّر بالبيانات الحقيقية قبل النشر."
          />
        </p>

        <div className="m-foot__bottom">
          <span>
            © 2026 <Bi en="Dr. Mohsen Mamdouh. All rights reserved." ar="د. محسن ممدوح. جميع الحقوق محفوظة." />
          </span>
          <nav aria-label="تذييل">
            <a href="#top"><Bi en="Back to top" ar="لأعلى الصفحة" /></a>
            <a href="#faq"><Bi en="FAQ" ar="أسئلة شائعة" /></a>
            <a href="#contact"><Bi en="Contact" ar="تواصل" /></a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
