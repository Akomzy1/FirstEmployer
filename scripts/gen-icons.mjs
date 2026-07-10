// Generates the PWA icons (192/512 + maskable) programmatically: ink-900
// rounded square with the verified-green check — no image tooling required.
// Run: node scripts/gen-icons.mjs
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";

const INK = [14, 27, 44], GREEN = [30, 158, 106], WHITE = [255, 255, 255];

function crc32(buf) {
  let c, table = [];
  for (let n = 0; n < 256; n++) { c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; table[n] = c >>> 0; }
  let crc = 0xffffffff;
  for (const b of buf) crc = table[(crc ^ b) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function png(width, height, pixels /* RGBA */) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8-bit RGBA
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0;
    pixels.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}
const distSeg = (px, py, x1, y1, x2, y2) => {
  const dx = x2 - x1, dy = y2 - y1;
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)));
  const cx = x1 + t * dx, cy = y1 + t * dy;
  return Math.hypot(px - cx, py - cy);
};
function drawIcon(S, { maskable = false } = {}) {
  const px = Buffer.alloc(S * S * 4);
  const r = maskable ? 0 : S * 0.22;          // rounded corners (maskable = full bleed)
  const pad = maskable ? S * 0.12 : 0;        // safe zone for maskable
  // check geometry (relative to icon box)
  const cx1 = 0.30 * S, cy1 = 0.52 * S, cx2 = 0.45 * S, cy2 = 0.67 * S, cx3 = 0.72 * S, cy3 = 0.36 * S;
  const thick = 0.065 * S;
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const i = (y * S + x) * 4;
      // rounded-rect mask
      let inside = true;
      if (!maskable) {
        const qx = Math.max(Math.abs(x - S / 2) - (S / 2 - r), 0);
        const qy = Math.max(Math.abs(y - S / 2) - (S / 2 - r), 0);
        inside = Math.hypot(qx, qy) <= r;
      }
      if (!inside) { px[i + 3] = 0; continue; }
      let col = INK;
      // circle ring for the seal
      const dc = Math.hypot(x - S / 2, y - S / 2);
      const ringR = S * 0.34 - pad * 0.3;
      if (Math.abs(dc - ringR) < S * 0.022) col = GREEN;
      // the check
      const d = Math.min(distSeg(x, y, cx1, cy1, cx2, cy2), distSeg(x, y, cx2, cy2, cx3, cy3));
      if (d < thick) col = GREEN;
      else if (d < thick * 1.35 && col === INK) col = [Math.round((INK[0]+GREEN[0])/2), Math.round((INK[1]+GREEN[1])/2), Math.round((INK[2]+GREEN[2])/2)];
      px[i] = col[0]; px[i + 1] = col[1]; px[i + 2] = col[2]; px[i + 3] = 255;
    }
  }
  void WHITE;
  return png(S, S, px);
}
mkdirSync("public/icons", { recursive: true });
writeFileSync("public/icons/icon-192.png", drawIcon(192));
writeFileSync("public/icons/icon-512.png", drawIcon(512));
writeFileSync("public/icons/maskable-512.png", drawIcon(512, { maskable: true }));
console.log("icons written");
