import { cache } from "react";
import prisma from "@/lib/prisma";

/**
 * The single settings row, created on first read. Everything configurable from
 * the dashboard — contact details, hero copy, email credentials — hangs off
 * this row, which is why it is read through one cached accessor rather than
 * scattered `findUnique` calls.
 */
export const getSettings = cache(async () => {
  const existing = await prisma.settings.findFirst();
  if (existing) return existing;
  return prisma.settings.create({ data: {} });
});
