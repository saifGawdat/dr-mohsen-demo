import sharp from "sharp";
import { fileURLToPath } from "node:url";

// Publish only the supplied portrait and conference photos, never the operation.
const assets = [
  ["ahmed-ibrahim-helmy-suit.jpg", "dr-ahmed-ibrahim-helmy-suit.webp"],
  ["ahmed-ibrahim-helmy.jpeg", "dr-ahmed-ibrahim-helmy-conference.webp"],
  ["ahmed-ibrahim-helmy2.jpeg", "dr-ahmed-ibrahim-helmy-conference-2.webp"],
];

for (const [source, output] of assets) {
  await sharp(fileURLToPath(new URL(`../../${source}`, import.meta.url)))
    .rotate()
    .resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 90 })
    .toFile(fileURLToPath(new URL(`../public/brand/${output}`, import.meta.url)));
}
