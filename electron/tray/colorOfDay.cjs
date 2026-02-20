const TWO_PI = Math.PI * 2;
const EPS = 1e-12;

const DEFAULT_RANGE = { min: 45, max: 210 };
const CUBE_MIN = 0.0;
const CUBE_MAX = 255.0;

// Fixed helix parameters from python/scripts/rgb_helix1.py (main()).
const HELIX_START = 210.0;
const HELIX_END = 45.0;
const TURNS_EACH = 12.0;
const R_MAX = 140.0;
const SAFETY = 0.98;
const THETA0 = Math.PI / 2;
const RADIUS_POWER = 0.5;

function clamp(v, lo, hi) {
  if (!Number.isFinite(v)) return lo;
  return Math.min(hi, Math.max(lo, v));
}

function clampInt(v, lo, hi) {
  return Math.round(clamp(Number(v), lo, hi));
}

function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function cross(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

function norm(a) {
  return Math.hypot(a[0], a[1], a[2]);
}

function normalizeVec(a) {
  const n = norm(a);
  if (n <= 0) return [0, 0, 0];
  return [a[0] / n, a[1] / n, a[2] / n];
}

function buildBasis() {
  const axis = normalizeVec([1.0, 1.0, 1.0]);
  const a = [1.0, 0.0, 0.0];
  const proj = dot(a, axis);
  const u = normalizeVec([
    a[0] - proj * axis[0],
    a[1] - proj * axis[1],
    a[2] - proj * axis[2],
  ]);
  const w = cross(axis, u);
  return { u, w };
}

const BASIS = buildBasis();

function minutesToS(mm) {
  const m = Number(mm);
  if (m <= 720.0) return 1.0 + m / 720.0;
  return (m - 720.0) / 720.0;
}

function helixPointAtS(
  s,
  {
    start = HELIX_START,
    end = HELIX_END,
    turns_each = TURNS_EACH,
    r_max = R_MAX,
    safety = SAFETY,
    theta0 = THETA0,
    radius_power = RADIUS_POWER,
    cube_min = CUBE_MIN,
    cube_max = CUBE_MAX,
  } = {},
) {
  if (start < end) throw new Error("start should be >= end.");
  const ss = Number(s);

  const v =
    ss <= 1.0 ? start + (end - start) * ss : end + (start - end) * (ss - 1.0);

  const t = Math.pow(Math.sin(Math.PI * ss), 2);
  let radius = r_max * Math.pow(t, radius_power);

  const theta = TWO_PI * turns_each * ss + theta0;
  const d = [
    Math.cos(theta) * BASIS.u[0] + Math.sin(theta) * BASIS.w[0],
    Math.cos(theta) * BASIS.u[1] + Math.sin(theta) * BASIS.w[1],
    Math.cos(theta) * BASIS.u[2] + Math.sin(theta) * BASIS.w[2],
  ];

  const lims = d.map((di) => {
    if (di > EPS) return (cube_max - v) / di;
    if (di < -EPS) return (v - cube_min) / -di;
    return Infinity;
  });

  const rAllowed = Math.min(...lims) * safety;
  radius = Math.min(radius, rAllowed);

  const pt = [
    clamp(v + radius * d[0], cube_min, cube_max),
    clamp(v + radius * d[1], cube_min, cube_max),
    clamp(v + radius * d[2], cube_min, cube_max),
  ];
  return pt;
}

function normalizeRange() {
  // Keep renderer sliders and IPC payload pinned to python's fixed endpoints.
  return { min: DEFAULT_RANGE.min, max: DEFAULT_RANGE.max };
}

function currentColor() {
  const d = new Date();
  const mm = d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60.0;
  const s = minutesToS(mm);
  const [r, g, b] = helixPointAtS(s);
  return {
    r: clampInt(r, CUBE_MIN, CUBE_MAX),
    g: clampInt(g, CUBE_MIN, CUBE_MAX),
    b: clampInt(b, CUBE_MIN, CUBE_MAX),
  };
}

module.exports = { currentColor, normalizeRange };
