const ANCHORS = [
  { m: 0, c: { r: 128, g: 0, b: 128 } },
  { m: 240, c: { r: 255, g: 0, b: 0 } },
  { m: 480, c: { r: 255, g: 165, b: 0 } },
  { m: 720, c: { r: 255, g: 255, b: 0 } },
  { m: 960, c: { r: 0, g: 128, b: 0 } },
  { m: 1200, c: { r: 0, g: 0, b: 255 } },
  { m: 1440, c: { r: 128, g: 0, b: 128 } },
];

function clampInt(v, lo, hi) {
  v = Math.round(Number(v));
  if (!Number.isFinite(v)) return lo;
  return Math.min(hi, Math.max(lo, v));
}

function normalizeRange(range) {
  const r = range || {};
  let min = clampInt(r.min ?? 0, 0, 255);
  let max = clampInt(r.max ?? 255, 0, 255);

  if (min > max) [min, max] = [max, min];
  if (min === max) max = Math.min(255, min + 1); // ensure non-zero span

  return { min, max };
}

function remap(rgb, range) {
  const { min, max } = normalizeRange(range);
  const span = max - min;
  const map = (v) => Math.round(min + (v / 255) * span);

  return { r: map(rgb.r), g: map(rgb.g), b: map(rgb.b) };
}

function currentColor(range) {
  const d = new Date();
  const mm = d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60;

  for (let i = 0; i < ANCHORS.length - 1; i++) {
    const a = ANCHORS[i];
    const b = ANCHORS[i + 1];
    if (mm >= a.m && mm <= b.m) {
      const t = (mm - a.m) / (b.m - a.m);
      const raw = {
        r: Math.round(a.c.r + (b.c.r - a.c.r) * t),
        g: Math.round(a.c.g + (b.c.g - a.c.g) * t),
        b: Math.round(a.c.b + (b.c.b - a.c.b) * t),
      };
      return remap(raw, range);
    }
  }
  return remap(ANCHORS[0].c, range);
}

module.exports = { currentColor };
