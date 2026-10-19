# Design System — Dr. Mohsen Mamdouh

Brand and UI foundation for the Dr. Mohsen Mamdouh digital presence (anaesthesia team + multi-specialty doctors + online booking).
This file is the single source of truth for colour, type, logo, imagery, components and page structure. Everything in `index.html` follows it.

---

## 1. Brand at a glance

| | |
|---|---|
| **Subject** | Dr. Mohsen Mamdouh — Anaesthetist & pain management specialist (أخصائي تخدير وعلاج ألم) |
| **Business model** | Two doors: **(A)** an anaesthesia team supplied to any hospital, centre or clinic that needs one at the highest level; **(B)** a network of doctors across every specialty (dentistry, gynaecology, aesthetics, ENT, and more), working with his team |
| **Core service** | Online booking: the patient uploads their data, lab results and scans, the team sets the appointment online, then the examination happens |
| **Signature line** | «التفاصيل.. بتفرق في التخدير» / *Details make the difference in anaesthesia* (taken from his own poster artwork) |
| **Voice** | Arabic-first, Egyptian, plain-spoken, safety-first, never salesy. Prices are **never** published — cost is discussed after the case is reviewed |

---

## 2. Source material (supplied)

| File | What it is | Where it ended up |
|---|---|---|
| `dr.mohsen-mamdouh-logo.png` | 1080×1080 transparent wordmark (blue + teal) | `assets/logo.png`, `assets/logo-white.png`, `assets/logo-mark*.png` |
| `1.jpg` | 1080×1350 social poster, scrubs | `assets/dr-mohsen-scrubs.jpg`, `assets/dr-mohsen-poster.jpg`, `assets/dr-mohsen-avatar.jpg` |
| `5.jpg` | 1080×1350 social poster, suit | `assets/dr-mohsen-suit.jpg` |
| `color-palette.txt` | `#20438e` (blue), `#007d77` (deep teal) | §3 |
| `font.txt` | `Lama Sans` | §4 — downloaded and self-hosted |

Originals stay untouched in the project root.

> **Note on the logo file:** the supplied PNG is a true transparent asset — the alpha channel carries the silhouette while RGB keeps the brand colour even where alpha = 0. Never re-key it against white, and never flatten it. Use `logo-white` / `logo-mark-white` for dark backgrounds instead.

---

## 3. Colour

### 3.1 Core palette

| Token | Hex | Role |
|---|---|---|
| `--blue` | `#20438E` | Primary. Trust, medicine, headings, dark sections, primary buttons |
| `--teal` | `#007D77` | Secondary. Precision, care, accents, eyebrows, links, teal planes |
| `--paper` | `#FFFFFF` | Cards, panels, form surfaces |
| `--mist` | `#F4F7FC` | Page background (blue-tinted off-white) |
| `--ink` | `#0C1936` | Body copy on light surfaces |
| `--muted` | `rgba(12,25,54,.62)` | Secondary copy, captions |
| `--line` | `#E1E7F0` | 1px hairlines, dividers, inputs |

### 3.2 Derived scale (tints / shades of the two brand colours only)

| Token | Hex | Use |
|---|---|---|
| `--blue-ink` | `#0C1936` | Darkest section background |
| `--blue-deep` | `#162F63` | Dark section background, hover on primary |
| `--blue-70` | `rgba(32,67,142,.70)` | Muted blue text |
| `--blue-15` | `#DEE3EE` | Fills, active chips, table striping |
| `--blue-08` | `#EDF0F6` | Soft fills, hover rows |
| `--teal-deep` | `#005853` | Teal hover / dark teal plane |
| `--teal-ink` | `#002F2D` | Darkest teal |
| `--teal-15` | `#D9ECEA` | Teal fills, badges |
| `--teal-08` | `#EBF6F5` | Teal wash on white |

### 3.3 Signature gradient — the brand's visual DNA

```css
--brand-diagonal: linear-gradient(118deg, #20438E 0%, #007D77 100%);
```

The two brand planes meet on a **diagonal**, exactly like the "M" monogram and the poster artwork. This is the one recurring graphic device: hero backgrounds, section dividers, button hovers, image masks. The two-door split is the exception — it is an even straight half-and-half so the two offers read as equal. Never use a third hue; never use purple/violet blends outside the two stops.

### 3.4 Semantic (feedback only)

| Token | Hex | Use |
|---|---|---|
| `--ok` | `#12855C` | Success states, confirmed bookings |
| `--warn` | `#B4761A` | Warnings, "needs review" |
| `--err` | `#B3261E` | Field errors (paired with text, never colour alone) |
| WhatsApp | `#25D366` | The one sanctioned exception, for the WhatsApp mark only |

---

## 4. Typography — Lama Sans

Supplied in `font.txt`; it is the real Baianat "Lama Sans" (weights 100–900, **Arabic + Latin in one family**), self-hosted from `assets/fonts/`.

```css
@font-face { font-family: "Lama Sans"; src: url("assets/fonts/LamaSans-Light.woff")   format("woff"); font-weight: 300; font-display: swap; }
@font-face { font-family: "Lama Sans"; src: url("assets/fonts/LamaSans-Regular.woff") format("woff"); font-weight: 400; font-display: swap; }
@font-face { font-family: "Lama Sans"; src: url("assets/fonts/LamaSans-Medium.woff")  format("woff"); font-weight: 500; font-display: swap; }
@font-face { font-family: "Lama Sans"; src: url("assets/fonts/LamaSans-SemiBold.woff")format("woff"); font-weight: 600; font-display: swap; }
@font-face { font-family: "Lama Sans"; src: url("assets/fonts/LamaSans-Bold.woff")    format("woff"); font-weight: 700; font-display: swap; }
@font-face { font-family: "Lama Sans"; src: url("assets/fonts/LamaSans-ExtraBold.woff")format("woff");font-weight: 800; font-display: swap; }
```

Fallback stack: `"Lama Sans", "Segoe UI", system-ui, -apple-system, sans-serif`.

### 4.1 Rules

- **Arabic is the default language** (`<html lang="ar" dir="rtl">`). Latin is a secondary toggle, never the fallback.
- Display headings use **weight 300–500** — clinical, calm, expensive. Weight 700–800 is reserved for numbers, badges and short labels.
- Arabic runs looser than Latin: +0.55 line-height on display sizes, `letter-spacing: 0`, no italics anywhere.
- Eyebrows/labels: 12–13px, `letter-spacing: .18em`, uppercase for Latin, weight 600, teal.
- Numbers use Latin digits in both languages (`٠١` only for decorative step counters in Arabic).
- Bold inside a heading is written with `<strong>`, not a colour change.

### 4.2 Scale (desktop → mobile)

| Role | Size | Weight | Notes |
|---|---|---|---|
| Display / hero h1 | `clamp(38px, 5.2vw, 74px)` | 300 (AR 400) | line-height 1.05 (AR 1.35) |
| Section h2 | `clamp(28px, 3.4vw, 48px)` | 300 | line-height 1.15 (AR 1.45) |
| Lead paragraph | `clamp(17px, 1.35vw, 21px)` | 300 | line-height 1.75 |
| Body | `16–17px` | 400 | line-height 1.8 |
| Small / meta | `13–14px` | 400 | `--muted` |
| Eyebrow | `13px` | 600 | `.18em` tracking, teal |

---

## 5. Logo

| Asset | Use |
|---|---|
| `assets/logo.png` | Full wordmark on light surfaces (nav on scroll, footer, invoices) |
| `assets/logo-white.png` | Full wordmark on `--blue`, `--teal`, or photography |
| `assets/logo-mark.png` / `logo-mark-white.png` | Monogram only: favicon, watermarks, avatar fallback, section marks |
| `assets/logo-mark-{64,180,512}.png` | Pre-sized favicon / app-icon / social-avatar exports |

**Clear space:** ≥ 0.5× the height of the "M" on every side.
**Minimum size:** wordmark 120px wide; monogram 24px.
**Backgrounds:** light → `logo.png`; dark blue/teal/photos → `logo-white.png`. Never place the blue wordmark on a mid-tone blue or on the diagonal gradient.
**Don'ts:** no recolouring, no outline, no drop shadow, no stretching, no rotating, no placing over busy areas of a photo, no re-typing "Dr. Mohsen Mamdouh" as a substitute for the wordmark.

---

## 6. Iconography

- **Phosphor Icons** (CDN, `regular` + `light` weights) — thin, neutral, clinical.
- 1.25–1.5px optical stroke weight; size 18–22px inline, 26–32px in feature cards.
- Icons are always paired with a text label; never the only carrier of meaning.
- Brand-specific shapes: monogram "M", diagonal planes, hairline grids. No emoji in production UI.

---

## 7. Layout, surfaces & motion

- **Container:** `max-width: 1360px`, inline padding `clamp(20px, 5vw, 64px)`.
- **Vertical rhythm:** section padding `clamp(72px, 12vh, 152px)` top/bottom.
- **Grid:** 12 columns on desktop, 2 on tablet, 1 on mobile. Cards sit on hairline rails (`--line`) and divide with 1px borders rather than heavy shadows.
- **Radii:** `2px` (buttons, inputs), `10px` (cards), `20px` (media frames), `999px` (pills, avatars).
- **Borders > shadows.** One soft elevation only: `0 18px 45px -28px rgba(32,67,142,.45)`.
- **Diagonal device:** `clip-path: polygon(...)` planes and `--brand-diagonal` fills; used for section breaks and image masks. (The two-door split deliberately uses a straight 50/50 seam instead.)
- **Motion:** GSAP + ScrollTrigger. Fade/rise reveals (`y: 26px, 0.9s, expo.out`), staggered lists, sticky process rail, parallax on portraits only. All motion collapses under `prefers-reduced-motion: reduce`.
- **Focus:** `:focus-visible { outline: 2px solid var(--teal); outline-offset: 3px }`.

---

## 8. Photography

Supplied imagery is social-media artwork with baked-in Arabic copy and the logo, so it is cropped to the subject before use.

| Asset | Crop | Use |
|---|---|---|
| `dr-mohsen-suit.jpg` | 540×1350 (right of the baked text) | Hero portrait, "about the doctor", booking panel |
| `dr-mohsen-scrubs.jpg` | 350×1350 (right of the baked text) | Anaesthesia-team section |
| `dr-mohsen-avatar.jpg` | 560×560 head crop | Signature block, doctor cards, testimonial avatars |
| `dr-mohsen-poster.jpg` | full poster | Social/marketing previews only |

Rules: always crop to the subject, never stretch, `object-fit: cover` with a 45–60% vertical focal point so the face stays in frame. Keep brand planes behind portraits so the blue/teal of the artwork blends into the page. Photography is never used to imply a price, a result or a guarantee.

---

## 9. Components

| Component | Spec |
|---|---|
| **Primary button** | Fill `--blue`, white text, 54px tall, 2px radius, arrow icon slides 4px on hover; on dark → white fill with `--blue-ink` text |
| **Ghost button** | 1px `--blue-15` border, text `--blue`, hover border `--teal` |
| **Link** | Underline that retracts on hover; teal arrow |
| **Chip / filter** | 44px pill, hairline border; `aria-pressed="true"` → `--blue` fill, white text |
| **Service card** | Icon (teal) → title (blue, 500) → 2-line body → hairline footer with price-free CTA |
| **Specialty index row** | Hairline row, no box: `٠١` index, specialty name + EN subtitle, doctor-count pill, retracting arrow; clicking it filters the directory below |
| **Featured doctor panel** | Full-width `--blue-ink` panel reserved for the lead: portrait on one side, role + name + blurb + CTA on the other |
| **Doctor directory row** | Hairline row, no box: avatar, name + specialty, clinic + experience, "احجز أونلاين" |
| **Two-door split** | Full-width 50/50 split, teal plane + blue plane side by side with a clean vertical seam, each with its own CTA |
| **Accordion row** | `--line` rails, giant light title, rotate-on-open `+`; body = 2-col detail grid (used for العمليات) |
| **Table** | Hairline rows, `--blue-08` zebra, no vertical rules |
| **Form field** | 52px, 1px `--line`, radius 2px, label above (always visible), inline error under the field |
| **Upload zone** | Dashed 1px `--teal` border on white, drag-active → `--teal-08`; file list shows name, size, remove; accepts PDF/JPG/PNG up to 10 files |
| **Step indicator** | Numbered 01…06 with a hairline progress bar; completes in teal |
| **Booking summary rail** | Sticky `--blue-ink` panel: selections, upload count, "الأسعار بتتحدد بعد مراجعة الحالة" note |
| **Trust strip** | 4-up hairline strip under the hero (specialty / coverage / booking / follow-up) |
| **Footer** | `--blue-ink`, white wordmark, 4 nav columns, WhatsApp + phone, legal line, demo-data disclaimer |

---

## 10. Content & data status

- **Real:** brand, palette, typography, logo, photography, tagline, specialty list, service descriptions, safety messaging, "no prices published" policy.
- **Placeholder (must be confirmed before launch):** doctor names and counts, clinic addresses and opening hours, phone/WhatsApp numbers, social handles, e-mail, exact appointment slots, review/testimonial text, statistical claims.
- All placeholder blocks are flagged in the UI with a light "بيانات توضيحية" note so the client can review copy and structure without mistaking it for final data.

---

## 11. Page architecture (the "تقسيمه")

`index.html` — one page, Arabic-first with EN toggle:

1. **Nav** — logo, sections, language, "احجز أونلاين"
2. **Hero** — tagline, two-service promise, primary + secondary CTA, trust strip
3. **Two doors** — (A) اطلب فريق تخدير · (B) تصفح الأطباء والتخصصات — an even half-and-half split (teal | blue)
4. **فريق التخدير** — what we cover, where we work, safety standards, how the team joins your hospital
5. **ليه فريق كامل** — comparison for decision-makers (hospital without a dedicated team vs with Dr. Mohsen's team)
6. **التخصصات** — a 12-row editorial index (number, name, doctor count) → clicking a row filters the directory
7. **الأطباء** — the lead doctor as a featured panel, then a filterable hairline directory (multiple doctors per specialty) with a book CTA
8. **العمليات** — an accordion of procedures with full detail (duration, anaesthesia type, recovery, what's included) and **no prices** + "اعرف التكلفة" contact CTA
9. **الحجز أونلاين** — 6 steps: type → specialty/doctor (+ place or facility) → date & time → your details → upload labs & scans → review & confirm, with a live sticky summary and a WhatsApp hand-off (the anaesthesia-team request reuses the same engine as a 4-step sheet)
10. **رحلة الحالة** — sticky numbered process (request → upload → file review → examination / anaesthetic → follow-up & pain plan)
11. **علاج الألم** — the pain-clinic highlight band
12. **الأسئلة الشائعة** — pricing policy, referrals, uploads, confirmation time, team cover, child sedation, rescheduling
13. **التواصل + الفوتر** — WhatsApp, phone, coverage, social, legal

### Deliberately not included (yet)

Prices (policy), live slot availability from a real calendar, payments, patient portal login, results gallery (needs consented material), blog/journal, Arabic SEO pages per specialty.
