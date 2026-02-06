const TWO_PI = Math.PI * 2;

// Basis vectors perpendicular to the diagonal axis (1,1,1).
// These match the Python construction you used (a=[1,0,0], u normalized, w = axis x u).
const U = { x: 0.816496580927726, y: -0.408248290463863, z: -0.408248290463863 };
const W = { x: 0.0, y: 0.707106781186548, z: -0.707106781186548 };

// Amplitude factor used for radius capping (same as sqrt(u_x^2 + w_x^2)).
const AMP = 0.816496580927726;

const DEFAULT_RANGE = { min: 30, max: 225 };

// Helix shape tuning (matches your working Python defaults closely).
const TURNS_EACH = 12.0;
const R_MAX = 135.0;
const SAFETY = 0.98;

function clampInt(v, lo, hi) {
  v = Math.round(Number(v));
  if (!Number.isFinite(v)) return lo;
  return Math.min(hi, Math.max(lo, v));
}

function normalizeRange(range) {
  const r = range || {};
  let min = clampInt(r.min ?? DEFAULT_RANGE.min, 0, 255);
  let max = clampInt(r.max ?? DEFAULT_RANGE.max, 0, 255);

  if (min > max) [min, max] = [max, min];
  return { min, max };
}

function helixColorAtS(s, start, end) {
  // Center along diagonal (start -> end -> start) using cosine
  const mid = (start + end) / 2.0;
  const delta = (start - end) / 2.0;
  const v = mid + delta * Math.cos(Math.PI * s);

  // Radius profile: 0 at s=0,1,2; max at s=0.5 and 1.5
  let radius = R_MAX * Math.pow(Math.sin(Math.PI * s), 2);

  // Cap radius so all channels stay inside [end, start] (with margin)
  const distToNearest = Math.min(v - end, start - v); // >= 0 in ideal math
  const rAllowed = (distToNearest / AMP) * SAFETY;
  if (Number.isFinite(rAllowed)) radius = Math.min(radius, Math.max(0, rAllowed));

  // Spiral angle: 12 turns per leg (0..1 and 1..2), continuous direction
  const theta = TWO_PI * TURNS_EACH * s;
  const c = Math.cos(theta);
  const sn = Math.sin(theta);

  const r = v + radius * (c * U.x + sn * W.x);
  const g = v + radius * (c * U.y + sn * W.y);
  const b = v + radius * (c * U.z + sn * W.z);

  return {
    r: clampInt(r, 0, 255),
    g: clampInt(g, 0, 255),
    b: clampInt(b, 0, 255),
  };
}

function currentColor(range) {
  const { min, max } = normalizeRange(range);
  const start = max; // noon
  const end = min;   // midnight

  const d = new Date();
  const mm =
    d.getHours() * 60 +
    d.getMinutes() +
    d.getSeconds() / 60 +
    d.getMilliseconds() / 60000;

  // Map clock time to s in [0..2] such that:
  // - noon (720) => s = 0  (start)
  // - midnight (0 / 1440) => s = 1 (end)
  // - midnight -> noon => s: 1..2 (return leg)
  // - noon -> midnight => s: 0..1 (down leg)
  let s;
  if (mm < 720) {
    s = 1 + mm / 720; // 1..2  (midnight -> noon)
  } else {
    s = (mm - 720) / 720; // 0..1 (noon -> midnight)
  }

  return helixColorAtS(s, start, end);
}

module.exports = { currentColor, normalizeRange };
