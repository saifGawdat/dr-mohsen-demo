export const locales = ["en", "ar"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "ar";

export const localeNames: Record<Locale, string> = {
  en: "English",
  ar: "العربية",
};

export const localeDirection: Record<Locale, "ltr" | "rtl"> = {
  en: "ltr",
  ar: "rtl",
};

/** BCP-47 tags used for hreflang, OpenGraph locale and <html lang>. */
export const localeHrefLang: Record<Locale, string> = {
  en: "en-EG",
  ar: "ar-EG",
};

/** OpenGraph `locale` values (underscore form). */
export const localeOgTag: Record<Locale, string> = {
  en: "en_EG",
  ar: "ar_EG",
};

export function isLocale(value: string | undefined): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}
