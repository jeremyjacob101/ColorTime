const TWO_PI = Math.PI * 2;

// Basis vectors perpendicular to the diagonal axis (1,1,1).
const U = {
  x: 0.816496580927726,
  y: -0.408248290463863,
  z: -0.408248290463863,
};
const W = { x: 0.0, y: 0.707106781186548, z: -0.707106781186548 };

// Amplitude factor used for radius capping (same as sqrt(u_x^2 + w_x^2)).
const AMP = 0.816496580927726;

const DEFAULT_RANGE = { min: 30, max: 225 };

// Helix shape tuning
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

// Constant-speed centerline: start -> end (s:0..1), then end -> start (s:1..2)
function centerVAtS(s, start, end) {
  if (s <= 1.0) {
    return start + (end - start) * s;
  }
  return end + (start - end) * (s - 1.0);
}

function helixColorAtS(s, start, end) {
  // Center along diagonal with constant speed (no eased slowdown at the ends)
  const v = centerVAtS(s, start, end);

  // Radius profile: 0 at s=0,1,2; max at s=0.5 and 1.5
  let radius = R_MAX * Math.pow(Math.sin(Math.PI * s), 2);

  // Cap radius so all channels stay inside [end, start] (with margin)
  const distToNearest = Math.min(v - end, start - v); // should be >= 0
  const rAllowed = (distToNearest / AMP) * SAFETY;
  if (Number.isFinite(rAllowed))
    radius = Math.min(radius, Math.max(0, rAllowed));

  // Spiral angle: 12 turns per leg (0..1 and 1..2)
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
  const end = min; // midnight

  const d = new Date();
  const mm =
    d.getHours() * 60 +
    d.getMinutes() +
    d.getSeconds() / 60 +
    d.getMilliseconds() / 60000;

  let s;
  if (mm < 720) {
    s = 1 + mm / 720; // 1..2  (midnight -> noon)
  } else {
    s = (mm - 720) / 720; // 0..1 (noon -> midnight)
  }

  return helixColorAtS(s, start, end);
}

module.exports = { currentColor, normalizeRange };
