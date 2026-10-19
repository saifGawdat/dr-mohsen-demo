import Link from "next/link";

interface Props {
  locale: "en" | "ar";
  siteName: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  openingHours: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  newsletterEnabled: boolean;
}

const copy = {
  en: {
    quick: "Quick links",
    contact: "Contact",
    hours: "Hours",
    about: "About",
    specialties: "Specialties",
    doctors: "Doctors",
    faq: "FAQ",
    book: "Book online",
    team: "Book a team",
    allRights: "All rights reserved.",
  },
  ar: {
    quick: "روابط سريعة",
    contact: "تواصل",
    hours: "المواعيد",
    about: "عن الدكتور",
    specialties: "التخصصات",
    doctors: "الأطباء",
    faq: "أسئلة شائعة",
    book: "احجز أونلاين",
    team: "اطلب فريق تخدير",
    allRights: "جميع الحقوق محفوظة.",
  },
} as const;

export function SiteFooter({
  locale,
  siteName,
  phone,
  email,
  address,
  openingHours,
  facebookUrl,
  instagramUrl,
  newsletterEnabled,
}: Props) {
  const t = copy[locale];

  return (
    <footer className="bg-blue-ink text-white/80">
      <div className="mx-auto max-w-6xl px-4 py-12 grid gap-10 md:grid-cols-4">
        <div>
          <p className="font-bold text-white text-lg mb-3">{siteName}</p>
          <p className="text-sm leading-relaxed">
            {locale === "ar"
              ? "التفاصيل.. بتفرق في التخدير. فريق تخدير متكامل وأطباء في كل التخصصات."
              : "Details make the difference in anaesthesia. A complete anaesthesia team and doctors across every specialty."}
          </p>
          {(facebookUrl || instagramUrl) && (
            <div className="flex gap-3 mt-4 text-sm">
              {facebookUrl && (
                <a href={facebookUrl} target="_blank" rel="noreferrer" className="hover:text-white">
                  Facebook
                </a>
              )}
              {instagramUrl && (
                <a href={instagramUrl} target="_blank" rel="noreferrer" className="hover:text-white">
                  Instagram
                </a>
              )}
            </div>
          )}
        </div>

        <div>
          <p className="text-white font-semibold text-sm mb-3">{t.quick}</p>
          <ul className="space-y-2 text-sm">
            <li><a href="#about" className="hover:text-white">{t.about}</a></li>
            <li><a href="#specialties" className="hover:text-white">{t.specialties}</a></li>
            <li><a href="#doctors" className="hover:text-white">{t.doctors}</a></li>
            <li><a href="#faq" className="hover:text-white">{t.faq}</a></li>
            <li><a href="#booking" className="hover:text-white">{t.book}</a></li>
            <li><a href="#team-request" className="hover:text-white">{t.team}</a></li>
          </ul>
        </div>

        <div>
          <p className="text-white font-semibold text-sm mb-3">{t.contact}</p>
          <ul className="space-y-2 text-sm">
            {phone && (
              <li>
                <a href={`tel:${phone.replace(/\s/g, "")}`} className="font-mono hover:text-white">
                  {phone}
                </a>
              </li>
            )}
            {email && (
              <li>
                <a href={`mailto:${email}`} className="hover:text-white">
                  {email}
                </a>
              </li>
            )}
            {address && <li className="leading-relaxed">{address}</li>}
          </ul>
        </div>

        <div>
          {openingHours && (
            <>
              <p className="text-white font-semibold text-sm mb-3">{t.hours}</p>
              <p className="text-sm">{openingHours}</p>
            </>
          )}
          {newsletterEnabled && (
            <p className="text-xs text-white/50 mt-6">
              <Link href={`/${locale}`} className="hover:text-white">
                {siteName}
              </Link>{" "}
              · © {new Date().getFullYear()} {t.allRights}
            </p>
          )}
        </div>
      </div>
    </footer>
  );
}
