/**
 * One-off asset intake for the PCA Clinic rebrand.
 *
 * Inputs (repo root, supplied originals — never modified):
 *   ../../clinic-logo.jpeg                        → brand lockup on a cream field
 *   ../../ahmed-mleha-png.png                     → Dr. Ahmad Meliha, transparent white-coat portrait
 *   ../../ahmed-mleha2025-09-20T14-10-36 copy.jpg.jpeg → Dr. Ahmad Meliha, suit portrait
 *
 * Outputs (app/public/brand/, shipped assets):
 *   pca-logo-full.png        full lockup, background removed
 *   pca-logo-mark.png        the wave mark alone
 *   pca-logo-mark-{64,180,512}.png  favicon / app icon / social avatar sizes
 *   pca-logo-white.png       full lockup in solid white (dark surfaces)
 *   pca-logo-mark-white.png  mark in solid white
 *   dr-ahmed-mleha-coat.webp / dr-ahmed-mleha-suit.webp  portrait photography
 *
 * The logo arrives flattened on paper-coloured card, so the cutout keys the
 * background out by colour distance with feathered alpha rather than a hard
 * chroma threshold — the antialiased serif edges survive as partial coverage.
 * Run with: node scripts/process-brand-assets.mjs
 */
import sharp from "sharp";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..", "..");
const out = path.resolve(here, "..", "public", "brand");

const LOGO = path.join(root, "clinic-logo.jpeg");
const COAT = path.join(root, "ahmed-mleha-png.png");
const SUIT = path.join(root, "ahmed-mleha2025-09-20T14-10-36 copy.jpg.jpeg");

for (const file of [LOGO, COAT, SUIT]) {
  if (!existsSync(file)) {
    console.error(`Missing input: ${file}`);
    process.exit(1);
  }
}

/**
 * Key out the background colour; returns RGBA raw buffer + width/height.
 * t0..t1 ramps the feather band: within t0 of the paper colour → fully cut,
 * beyond t1 → fully kept, in between → partial alpha (soft serif edges).
 */
async function cutoutBackground(input, { t0 = 44, t1 = 110 } = {}) {
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const [w, h] = [info.width, info.height];

  // Sample the paper colour from the four corners and average them.
  const corners = [0, 3 * (w - 1), 3 * w * (h - 1), 3 * (w * h - 1)];
  let br = 0, bg = 0, bb = 0;
  for (const o of corners) {
    br += data[o]; bg += data[o + 1]; bb += data[o + 2];
  }
  br /= corners.length; bg /= corners.length; bb /= corners.length;

  const outBuf = Buffer.alloc(w * h * 4, 0);
  for (let i = 0; i < w * h; i++) {
    const o = i * 4;
    const dr = data[o] - br, dg = data[o + 1] - bg, db = data[o + 2] - bb;
    const d = Math.abs(dr) + Math.abs(dg) + Math.abs(db); // manhattan, cheap and gradient-free
    let a = Math.min(1, Math.max(0, (d - t0) / (t1 - t0)));
    // The JPEG field has low-level block noise; anything under a 4% shimmer
    // is background texture, keep it out of the bbox maths entirely.
    if (a < 0.04) a = 0;
    outBuf[o] = data[o]; outBuf[o + 1] = data[o + 1]; outBuf[o + 2] = data[o + 2];
    outBuf[o + 3] = Math.round(a * 255);
  }
  return { buf: outBuf, w, h };
}

/** Trim to the fully-opaque bounding box, with a couple of pixels of breathing room. */
function bboxOpaque(buf, w, h) {
  let minX = w, minY = h, maxX = -1, maxY = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (buf[(y * w + x) * 4 + 3] < 24) continue;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  if (maxX < 0) throw new Error("Nothing left after the cutout — check the thresholds.");
  return { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

/** Column opacity profile → widest fully-empty gap between mark and wordmark. */
function splitIndexForMark(buf, w, h) {
  const cols = new Array(w).fill(0);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) if (buf[(y * w + x) * 4 + 3] > 12) cols[x]++;
  }
  let first = -1, last = -1;
  for (let x = 0; x < w; x++) {
    if (cols[x] > 0) { if (first < 0) first = x; last = x; }
  }
  let gapStart = -1, best = 0, split = -1, start = -1;
  for (let x = first; x <= last; x++) {
    if (cols[x] === 0) {
      if (start < 0) start = x;
      if (x - start + 1 > best) { best = x - start + 1; split = start + Math.floor(best / 2); }
    } else {
      start = -1;
    }
  }
  return { contentStart: first, contentEnd: last, split, gapWidth: best };
}

async function writeTiles(markRaw, outName) {
  for (const size of [64, 180, 512]) {
    await sharp(markRaw)
      .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(path.join(out, `pca-logo-mark-${size}.png`));
  }
}

async function main() {
  // --- The logo -------------------------------------------------------------
  const cut = await cutoutBackground(LOGO);
  const fullBox = bboxOpaque(cut.buf, cut.w, cut.h);
  const full = await sharp(cut.buf, { raw: { width: cut.w, height: cut.h, channels: 4 } })
    .extract(fullBox)
    .png()
    .toFile(path.join(out, "pca-logo-full.png"));
  console.log(`pca-logo-full.png ${full.width}×${full.height}`);

  const markSplit = splitIndexForMark(cut.buf, cut.w, cut.h);
  if (typeof markSplit.split !== "number" || markSplit.gapWidth < 8) {
    throw new Error(`Could not find the gap between mark and wordmark: ${JSON.stringify(markSplit)}`);
  }
  const markBox = {
    left: markSplit.contentStart, top: fullBox.top,
    width: markSplit.split - markSplit.contentStart, height: fullBox.height,
  };
  console.log(
    `mark region x ${markSplit.contentStart}–${markSplit.split} (gap ${markSplit.gapWidth}px), ` +
    `text region to ${markSplit.contentEnd}`
  );

  // The mark often sits higher than the wordmark — trim to its own bbox.
  const markCropped = await sharp(cut.buf, { raw: { width: cut.w, height: cut.h, channels: 4 } })
    .extract(markBox)
    .png().toBuffer();
  const { data: markData, info: markInfo } = await sharp(markCropped).raw().toBuffer({ resolveWithObject: true });
  const markTight = bboxOpaque(markData, markInfo.width, markInfo.height);
  const mark = await sharp(markCropped).extract(markTight).png().toBuffer();

  await sharp(mark).png().toFile(path.join(out, "pca-logo-mark.png"));
  await writeTiles(mark, "pca-logo-mark");
  console.log(`pca-logo-mark.png ${markTight.width}×${markTight.height}`);

  // White companions: any kept pixel goes solid white, alpha carries the shape.
  await sharp(mark).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
    .then(({ data, info }) => {
      for (let i = 0; i < info.width * info.height; i++) {
        const o = i * 4;
        data[o] = 255; data[o + 1] = 255; data[o + 2] = 255;
      }
      return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
        .png().toFile(path.join(out, "pca-logo-mark-white.png"));
    });

  await sharp(cut.buf, { raw: { width: cut.w, height: cut.h, channels: 4 } })
    .extract(fullBox).png().toBuffer()
    .then((fullCropped) => sharp(fullCropped).ensureAlpha().raw().toBuffer({ resolveWithObject: true }))
    .then(({ data, info }) => {
      for (let i = 0; i < info.width * info.height; i++) {
        const o = i * 4;
        data[o] = 255; data[o + 1] = 255; data[o + 2] = 255;
      }
      return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
        .png().toFile(path.join(out, "pca-logo-white.png"));
    });
  console.log("pca-logo-white.png + pca-logo-mark-white.png written");

  // --- Dr. Ahmad's portraits -------------------------------------------------
  await sharp(COAT).trim().resize({ width: 900, withoutEnlargement: true }).webp({ quality: 90 })
    .toFile(path.join(out, "dr-ahmed-mleha-coat.webp"));
  await sharp(SUIT).trim().resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 85 })
    .toFile(path.join(out, "dr-ahmed-mleha-suit.webp"));
  console.log("dr-ahmed-mleha-coat.webp + dr-ahmed-mleha-suit.webp written");

  // --- Social preview (OG) ----------------------------------------------------
  // White lockup on the 118° ink→teal diagonal, cut at 1200×630.
  const ogSvg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
       <defs>
         <linearGradient id="g" x1="0" y1="0" x2="1" y2="0.72">
           <stop offset="0" stop-color="#13262D"/>
           <stop offset="1" stop-color="#195869"/>
         </linearGradient>
       </defs>
       <rect width="1200" height="630" fill="url(#g)"/>
     </svg>`
  );
  const whiteMark = await sharp(path.join(out, "pca-logo-white.png"))
    .resize(760, null, { fit: "inside" })
    .png().toBuffer();
  const whiteMarkMeta = await sharp(whiteMark).metadata();
  await sharp(ogSvg)
    .composite([{
      input: whiteMark,
      left: Math.round((1200 - whiteMarkMeta.width) / 2),
      top: Math.round((630 - whiteMarkMeta.height) / 2),
    }])
    .png({ quality: 90 })
    .toFile(path.join(out, "pca-og.png"));
  console.log("pca-og.png written");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
