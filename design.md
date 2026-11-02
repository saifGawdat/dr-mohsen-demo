# Design System — PCA Clinic

Brand and UI foundation for the **PCA Clinic — Pain Comfort Assessment Clinic**
digital presence (الرئيس **د. محسن ممدوح** — pain management — plus a team of
consultant doctors joining under the clinic: currently **د. أحمد سعيد مليحه**,
consultant paediatric, neonatal & laparoscopic surgery, and **د. أحمد إبراهيم
حلمي**, orthopaedics with a subspecialty in hand surgery).
This file is the single source of truth for colour, type, logo, imagery,
components and page structure. Everything in `index.html` and the Next
storefront follows it.

---

## 1. Brand at a glance

| | |
|---|---|
| **Subject** | PCA Clinic — Pain Comfort Assessment Clinic ("Care Beyond Relief") |
| **Leader** | Dr. Mohsen Mamdouh — anaesthetist & pain management specialist (أخصائي تخدير وعلاج ألم). The clinic introduces the practice first, followed by his featured profile and team, then the other consultants |
| **Business model** | Two doors: **(A)** an anaesthesia team supplied to any hospital, centre or clinic that needs one at the highest level; **(B)** a network of consultant doctors across specialties (pain, paediatric surgery, and more), working with his team |
| **Core service** | Review-first online booking: the patient uploads their data, lab results and scans, the team sets the appointment online, then the examination happens |
| **Tagline** | "Care Beyond Relief" (English, from the logo lockup). Arabic mirror: «رعاية تتجاوز التسكين» — pending client confirmation |
| **Voice** | Arabic-first, Egyptian, plain-spoken, safety-first, never salesy. Prices are **never** published — cost is discussed after the case is reviewed |

---

## 2. Source material (supplied)

| File | What it is | Where it ended up |
|---|---|---|
| `clinic-logo.jpeg` | PCA lockup on a cream card (wave mark + serif wordmark + tagline) | `app/public/brand/pca-logo-{full,mark,white,mark-white}*.png`, keys out via `app/scripts/process-brand-assets.mjs` |
| `ahmed-mleha-png.png` | Dr. Ahmad Meliha, white-coat portrait, transparent | `app/public/brand/dr-ahmed-mleha-coat.webp` |
| `ahmed-mleha2025-09-20T14-10-36 copy.jpg.jpeg` | Dr. Ahmad Meliha, suit portrait | `app/public/brand/dr-ahmed-mleha-suit.webp` |
| `ahmed-ibrahim-helmy-suit.jpg` | Dr. Ahmed Ibrahim Helmy, portrait | `app/public/brand/dr-ahmed-ibrahim-helmy-suit.webp` |
| `ahmed-ibrahim-helmy.jpeg` / `ahmed-ibrahim-helmy2.jpeg` | Supplied conference photos | `app/public/brand/dr-ahmed-ibrahim-helmy-conference*.webp` |
| `dr.mohsen-mamdouh-logo.png` | 1080×1080 transparent Dr. Mohsen wordmark (old brand) | kept for reference; no longer shipped in the Next app |
| `1.jpg` / `5.jpg` | 1080×1350 social posters, scrubs / suit | `app/public/brand/dr-mohsen-*.jpg|png` — Dr. Mohsen's portraits remain in use |
| `color-palette.txt` / `font.txt` | old palette note; Lama Sans | palette superseded by §3; font unchanged |

Originals stay untouched in the project root.

> **Note on the logo file:** the supplied lockup is a JPEG flattened on a cream
> card, so the shipped PNGs are colour-distance key-outs (feathered alpha).
> `pca-logo-white.png` / `pca-logo-mark-white.png` are solid-white companion
> exports for dark surfaces. Never re-key again by hand; rerun the script
> instead (`node scripts/process-brand-assets.mjs` from `app/`).

---

## 3. Colour

### 3.1 Core palette (sampled off the artwork)

| Actual colour | Hex | Stored in | Role |
|---|---|---|---|
| Swirl ink | `#13262D` | `--blue-ink`, `--ink` | Dark sections, footer, body copy on light surfaces |
| Wordmark teal | `#195869` | `--blue` | Primary. Headings, buttons, links, dark planes |
| Wave sky | `#85BDD6` | `--sky` | Secondary. Soft wave tint in the mark; light accents |
| Copper ribbon | `#C2895F` | `--teal` | Accent. Eyebrows, retracting links, small marks |

> **Token naming:** the stylesheet keeps the legacy `--blue`/`--teal` names so
> the Tailwind admin theme (`@theme --color-*` in `globals.css`) and the ~190
> rule references keep working. Semantically: `--blue` = PCA primary teal,
> `--teal` = copper accent. New code can use either pair; match the file you
> are editing.

### 3.2 Derived scale (tints / shades of the PCA hues only)

| Token | Hex | Use |
|---|---|---|
| `--blue-deep` | `#10414F` | Hover on primary, dark teal plane |
| `--blue-70` | `rgba(25,88,105,.70)` | Muted primary text |
| `--blue-15` | `#DCE6EA` | Fills, active chips, table striping |
| `--blue-08` | `#ECF3F5` | Soft fills, hover rows |
| `--teal-deep` | `#A37040` | Copper hover |
| `--teal-ink` | `#6E4A2B` | Darkest copper |
| `--teal-15` | `#F1E4D8` | Copper fills, badges |
| `--teal-08` | `#F8F1EA` | Copper wash on white |
| `--mist` | `#F6F5F0` | Page background (the logo's cream field) |
| `--line` | `#E2E7E9` | 1px hairlines, dividers, inputs |
| `--muted` | `rgba(19,38,45,.66)` | Secondary copy, captions |

### 3.3 Signature gradient — the brand's visual DNA

```css
--brand-diagonal: linear-gradient(118deg, #13262D 0%, #195869 100%);
```

The two ink-bearing stops of the mark (swirl ink → wordmark teal) meet on the
same **diagonal** as before; this is still the one recurring graphic device:
hero backgrounds, section dividers, button hovers, image masks. **Copper is
the sanctioned third hue — accents only** (eyebrows, links, small marks),
the same privilege WhatsApp green holds; never a large copper plane, never a
copper gradient stop.

### 3.4 Semantic (feedback only)

| Token | Hex | Use |
|---|---|---|
| `--ok` | `#12855C` | Success states, confirmed bookings |
| `--warn` | `#B4761A` | Warnings, "needs review" |
| `--err` | `#B3261E` | Field errors (paired with text, never colour alone) |
| WhatsApp | `#25D366` | The one sanctioned exception, for the WhatsApp mark only |

---

## 4. Typography — Lama Sans

Unchanged by the rebrand: the real Baianat "Lama Sans" (weights 100–900,
**Arabic + Latin in one family**), self-hosted from `assets/fonts/` and
`app/public/fonts/`.

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
- Eyebrows/labels: 12–13px, `letter-spacing: .18em`, uppercase for Latin, weight 600, copper.
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
| Eyebrow | `13px` | 600 | `.18em` tracking, copper |

---

## 5. Logo

| Asset | Use |
|---|---|
| `pca-logo-full.png` | Full lockup on light surfaces (nav on scroll, footer, invoices) |
| `pca-logo-white.png` | Full lockup on dark ink/primary planes or photography |
| `pca-logo-mark.png` / `pca-logo-mark-white.png` | Mark only: watermarks, section marks, avatar fallback |
| `pca-logo-mark-{64,180,512}.png` | Pre-sized favicon / app-icon / social-avatar exports |

**Clear space:** ≥ 0.5× the height of the wave mark on every side.
**Minimum size:** full lockup 120px wide; mark 24px. The wordmark carries a
serif display face — never re-typeset "PCA Clinic" as live text in its place.
**Backgrounds:** light → `pca-logo-full.png` (on white or `--mist`); dark
ink/primary/photos → `pca-logo-white.png`. Never place the coloured lockup on
the diagonal gradient or on mid-tone planes of either brand colour.
**Don'ts:** no recolouring, no outline, no drop shadow, no stretching, no
rotating, no placing over busy areas of a photo.

---

## 6. Iconography

- **Phosphor Icons** (CDN, `regular` + `light` weights) — thin, neutral, clinical.
- 1.25–1.5px optical stroke weight; size 18–22px inline, 26–32px in feature cards.
- Icons are always paired with a text label; never the only carrier of meaning.
- Brand-specific shapes: the wave mark, diagonal planes, hairline grids. No emoji in production UI.

---

## 7. Layout, surfaces & motion

- **Container:** `max-width: 1360px`, inline padding `clamp(20px, 5vw, 64px)`.
- **Vertical rhythm:** section padding `clamp(72px, 12vh, 152px)` top/bottom.
- **Grid:** 12 columns on desktop, 2 on tablet, 1 on mobile. Cards sit on hairline rails (`--line`) and divide with 1px borders rather than heavy shadows.
- **Radii:** `2px` (buttons, inputs), `10px` (cards), `20px` (media frames), `999px` (pills, avatars).
- **Borders > shadows.** One soft elevation only: `0 18px 45px -28px rgba(32,67,142,.45)`.
- **Diagonal device:** `clip-path: polygon(...)` planes and `--brand-diagonal` fills; used for section breaks and image masks. (The two-door split deliberately uses a straight 50/50 seam instead.)
- **Motion:** the app and its HTML mirror use CSS hero entrances, intersection-based reveals and a manually controlled doctor slider. All motion collapses under `prefers-reduced-motion: reduce`.
- **Focus:** `:focus-visible { outline: 2px solid var(--teal); outline-offset: 3px }`.

---

## 8. Photography

Dr. Mohsen's supplied imagery is social-media artwork with baked-in Arabic
copy and the old logo, so it is cropped to the subject before use. Dr.
Ahmad's portraits arrive clean.

| Asset | Use |
|---|---|
| `dr-mohsen-suit.png` | Leader hero, "about the doctor", booking panel |
| `dr-mohsen-scrubs.png` | Anaesthesia-team section |
| `dr-mohsen-avatar.jpg` | Signature block, doctor cards, testimonial avatars |
| `dr-ahmed-mleha-coat.webp` | White-coat portrait — doctor card, team grid, About |
| `dr-ahmed-mleha-suit.webp` | Suit portrait — profile page, section spreads |
| `dr-ahmed-mleha-coat.webp` on a brand plane | banner portraits |

Rules: always crop to the subject, never stretch, `object-fit: cover` with a
45–60% vertical focal point so the face stays in frame. Keep brand planes
behind portraits so their colours blend into the page. Patient-family photos
before an approved, consented case-study workflow are **never** substituted
for clinical photography. Photography is never used to imply a price, a
result or a guarantee. (And no identifiable child photo anywhere — see §10.)

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

- **Real:** PCA brand, palette, typography, logo, both doctors' photography, the service catalogue structure, safety messaging, "no prices published" policy.
- **Dr. Ahmad Meliha's profile data** (credentials, positions, skills, memberships, clinic catalogue, FAQ clusters) comes from drahmadmeleha.com and is rewritten into the clinic voice before publishing — the site never links back-to-back to his own site's copy as verbatim text, to keep the SEO surface clean.
- **Pending client confirmation:** the Arabic mirror of "Care Beyond Relief", Dr. Mohsen's published bio/credentials copy, phone/WhatsApp/email values, social handles, opening hours, and any review/testimonial text (unchanged rule: none publishes unapproved).
- **Dr. Ahmed Ibrahim Helmy:** name follows the supplied filenames; orthopaedics and the hand-surgery subspecialty were supplied by the client. Only the portrait and conference photos publish. The supplied Facebook share link could not be fetched; no credentials, affiliation, clinic address, phone or experience claims were imported. The operation photo remains unpublished pending patient consent. Seed data lives in `app/prisma/seed-content/doctors.json`.
- **Placeholder (must be confirmed before launch):** clinic addresses and opening hours, exact appointment slots, statistical claims.
- All placeholder blocks are flagged in the UI with a light "بيانات توضيحية" note so the client can review copy and structure without mistaking it for final data.
- **No prices anywhere**, and **no identifiable patient photo/metadata** may enter a case study: each case publishes only anonymized clinical narrative until documented parental consent exists.

---

## 11. Page architecture (the "تقسيمه")

### Production storefront — Excalidraw structure, 2026-11-01

The supplied `dr-mohsen-struvture.excalidraw` updates the Next storefront order:

1. **PCA Clinic** — clinic identity, care introduction and links to the doctors
   and anaesthesia team.
2. **Dr. Mohsen and the anaesthesia team** — the lead doctor's featured portrait
   and profile link, followed by team coverage and safety information.
3. **Other doctors** — an admin-controlled portrait slider, filtered by specialty,
   with swipe/scroll and labelled previous/next controls. No automatic playback.
   Only active records appear; names, portraits and order come from the dashboard.
4. **The remaining website** — trust strip, two doors, team comparison,
   specialties, procedures, booking, process, pain care, FAQ and contact.

Each doctor links to `/{locale}/{id}` (`/ar/{id}` by default). Profiles show name,
specialty, biography, clinic locations, public phone, gallery, consent-confirmed
before-and-after pairs, anonymized case studies and articles. Empty editorial
sections are omitted. The profile booking form selects that doctor and specialty
and offers their configured clinics. No specialty → arrange through the clinic.
All public editorial content is bilingual and managed under `/admin/doctors`.
No patient case content is supplied by this implementation; image pairs require
explicit admin confirmation of documented publication consent. Results vary by
case; the gallery must never imply a guarantee or show an identifiable child.

### Root prototype — app-aligned review snapshot, 2026-11-02

At the client's explicit request, `index.html` now mirrors the current app:

1. **PCA navigation and clinic hero** — local PCA logos, the ink/teal/sky/copper palette, clinic introduction and doctor/team links.
2. **Dr. Mohsen** — the lead portrait panel and profile link.
3. **Anaesthesia team** — coverage, protocols and request sheet.
4. **Consultant slider** — Dr. Ahmad Meliha and Dr. Ahmed Ibrahim Helmy, specialty filters, portrait cards and labelled previous/next controls. No automatic playback.
5. **Remaining app sections** — trust strip, two doors, team comparison, specialty index, procedures, six-step booking, process, pain care, FAQ, contact and footer, in the same order as the app.

The three `doctor-*.html` pages reproduce the app's profile layouts and public
content, with local page links and doctor/specialty preselection in their demo
booking forms. Dr. Helmy's two conference photographs appear in his gallery.
The supplied operation photograph stays unpublished.

Each page embeds the app's storefront stylesheet with local font URLs;
`assets/prototype.js` supplies standalone interactions. All photos, PCA marks
and Phosphor light/fill fonts live under `assets/`. Arabic remains the default
and the language toggle switches the whole page. Open `index.html` directly
or serve the repository root; neither Next nor a database is required.
Forms retain the prototype's local demonstration flow and WhatsApp hand-off;
they do not persist bookings or upload medical documents. Numeric prices
present in the current app copy are replaced by review-first wording to
comply with §10. `concepts.html` remains the earlier design reference.

### Deliberately not included (yet)

Prices (policy), live slot availability from a real calendar, payments, patient portal login, a populated results gallery (needs approved, consented material), Arabic SEO pages per specialty. The production app supports doctor editorial content and the existing journal.
