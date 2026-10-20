const ARABIC_DIGITS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];

/** Western digits → Arabic-Indic, matching the prototype's `arabicNum`. */
export function arabicDigits(value: string | number): string {
  return String(value).replace(/\d/g, (digit) => ARABIC_DIGITS[Number(digit)]);
}

/** Keeps only digits (and a leading +) for `tel:` and `wa.me` links. */
export function phoneDigits(phone: string): string {
  return phone.replace(/[^\d+]/g, "");
}

export function waLink(number: string, text: string): string {
  return `https://wa.me/${number.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
}

/** Initials for the directory avatar, e.g. "د. أحمد سالم" → "أ س". */
export function doctorInitials(name: string): string {
  const words = name
    .replace(/^(د\.|Dr\.?)\s*/i, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return "";
  const first = words[0]?.[0] ?? "";
  const last = words.length > 1 ? words[words.length - 1][0] : "";
  return `${first} ${last}`.trim();
}

export function experienceLabel(locale: "ar" | "en", years: number | null): string {
  if (!years) return "";
  if (locale === "en") return `${years} years experience`;
  const word = years >= 3 && years <= 10 ? "سنوات" : "سنة";
  return `خبرة ${arabicDigits(years)} ${word}`;
}

export function countLabel(locale: "ar" | "en", count: number): string {
  if (locale === "en") return `${count} ${count === 1 ? "doctor" : "doctors"}`;
  if (count === 1) return "طبيب";
  if (count === 2) return "طبيبان";
  if (count >= 3 && count <= 10) return `${arabicDigits(count)} أطباء`;
  return `${arabicDigits(count)} طبيب`;
}

const EN_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const EN_WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const AR_MONTHS = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
const AR_WEEKDAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

/** ISO date (YYYY-MM-DD) without the UTC shift of toISOString(). */
export function isoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function dayParts(date: Date, locale: "ar" | "en") {
  if (locale === "ar") {
    return {
      weekday: AR_WEEKDAYS[date.getDay()],
      day: arabicDigits(date.getDate()),
      month: AR_MONTHS[date.getMonth()],
    };
  }
  return {
    weekday: EN_WEEKDAYS[date.getDay()],
    day: String(date.getDate()),
    month: EN_MONTHS[date.getMonth()],
  };
}

export function longDate(iso: string, locale: "ar" | "en"): string {
  if (!iso) return "";
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

export function timeLabel(time: string, locale: "ar" | "en"): string {
  if (!time) return "";
  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}
