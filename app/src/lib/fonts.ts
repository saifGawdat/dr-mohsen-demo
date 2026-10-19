import { Cormorant_Garamond, Manrope, Cairo, Tajawal } from "next/font/google";

/**
 * DESIGN.md §1.2 — two type systems, swapped by direction.
 * Latin faces are subset to `latin`; Arabic faces to `arabic`. Nothing loads the
 * other script's glyph ranges, and every face uses `font-display: swap`.
 */

export const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

export const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-manrope",
  display: "swap",
});

export const cairo = Cairo({
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-cairo",
  display: "swap",
});

export const tajawal = Tajawal({
  subsets: ["arabic"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-tajawal",
  display: "swap",
});

export const fontVariables = [
  cormorant.variable,
  manrope.variable,
  cairo.variable,
  tajawal.variable,
].join(" ");
