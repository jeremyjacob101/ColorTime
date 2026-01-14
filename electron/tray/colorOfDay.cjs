
const ANCHORS = [
  { m: 0, c: { r: 128, g: 0, b: 128 } },
  { m: 240, c: { r: 255, g: 0, b: 0 } },
  { m: 480, c: { r: 255, g: 165, b: 0 } },
  { m: 720, c: { r: 255, g: 255, b: 0 } },
  { m: 960, c: { r: 0, g: 128, b: 0 } },
  { m: 1200, c: { r: 0, g: 0, b: 255 } },
  { m: 1440, c: { r: 128, g: 0, b: 128 } },
];

function currentColor() {
  const d = new Date();
  const mm = d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60;

  for (let i = 0; i < ANCHORS.length - 1; i++) {
    const a = ANCHORS[i];
    const b = ANCHORS[i + 1];
    if (mm >= a.m && mm <= b.m) {
      const t = (mm - a.m) / (b.m - a.m);
      return {
        r: Math.round(a.c.r + (b.c.r - a.c.r) * t),
        g: Math.round(a.c.g + (b.c.g - a.c.g) * t),
        b: Math.round(a.c.b + (b.c.b - a.c.b) * t),
      };
    }
  }
  return ANCHORS[0].c;
}

module.exports = { currentColor };

