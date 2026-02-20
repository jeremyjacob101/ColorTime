from mpl_toolkits.mplot3d import proj3d
import matplotlib.pyplot as plt
from matplotlib.widgets import Slider
from matplotlib.patches import Circle
from pathlib import Path
import datetime as dt
import numpy as np
import re


def helix_roundtrip_diagonal(
    start: float = 225.0,
    end: float = 30.0,
    n_points: int = 3200,
    turns_each: float = 12.0,
    r_max: float = 135.0,
    safety: float = 0.98,
    theta0: float = 0.0,  # NEW: initial angle offset (radians)
    radius_power: float = 1.0,  # NEW: <1 ramps outward faster near endpoints
    cube_min: float = 0.0,  # NEW: clamp to RGB cube
    cube_max: float = 255.0,  # NEW: clamp to RGB cube
):
    if start < end:
        raise ValueError("start should be >= end (e.g. 220 down to 35).")

    s = np.linspace(0.0, 2.0, n_points)

    # Diagonal value v goes start -> end -> start
    v = np.where(
        s <= 1.0,
        start + (end - start) * s,
        end + (start - end) * (s - 1.0),
    )
    base = np.stack([v, v, v], axis=1)

    # Radius envelope (peaks mid-way, 0 at ends), with faster ramp if radius_power < 1
    t = np.sin(np.pi * s) ** 2
    radius = r_max * (t**radius_power)

    # Orthonormal basis for plane perpendicular to axis (1,1,1)
    axis = np.array([1.0, 1.0, 1.0])
    axis = axis / np.linalg.norm(axis)

    a = np.array([1.0, 0.0, 0.0])
    u = a - np.dot(a, axis) * axis
    u = u / np.linalg.norm(u)
    w = np.cross(axis, u)

    # Helix angle + initial phase
    theta = 2.0 * np.pi * turns_each * s + theta0
    d = (np.cos(theta))[:, None] * u + (np.sin(theta))[
        :, None
    ] * w  # direction in plane

    # Clamp radius so that base + radius*d stays inside the RGB cube (0..255)
    eps = 1e-12
    vcol = v[:, None]

    pos_lim = (cube_max - vcol) / np.clip(d, eps, None)  # for d > 0
    neg_lim = (vcol - cube_min) / np.clip(-d, eps, None)  # for d < 0

    lim = np.where(d > 0, pos_lim, np.where(d < 0, neg_lim, np.inf))
    r_allowed = lim.min(axis=1) * safety

    radius = np.minimum(radius, r_allowed)

    pts = base + radius[:, None] * d
    pts = np.clip(pts, cube_min, cube_max)
    return pts[:, 0], pts[:, 1], pts[:, 2]


def helix_point_at_s(
    s: float,
    start: float = 225.0,
    end: float = 30.0,
    turns_each: float = 12.0,
    r_max: float = 135.0,
    safety: float = 0.98,
    theta0: float = 0.0,  # NEW
    radius_power: float = 1.0,  # NEW
    cube_min: float = 0.0,  # NEW
    cube_max: float = 255.0,  # NEW
):
    if start < end:
        raise ValueError("start should be >= end.")
    s = float(s)

    if s <= 1.0:
        v = start + (end - start) * s
    else:
        v = end + (start - end) * (s - 1.0)

    t = np.sin(np.pi * s) ** 2
    radius = r_max * (t**radius_power)

    axis = np.array([1.0, 1.0, 1.0])
    axis = axis / np.linalg.norm(axis)

    a = np.array([1.0, 0.0, 0.0])
    u = a - np.dot(a, axis) * axis
    u = u / np.linalg.norm(u)
    w = np.cross(axis, u)

    theta = 2.0 * np.pi * turns_each * s + theta0
    d = np.cos(theta) * u + np.sin(theta) * w  # direction in plane

    # Clamp radius to stay inside RGB cube
    lims = []
    for di in d:
        if di > 1e-12:
            lims.append((cube_max - v) / di)
        elif di < -1e-12:
            lims.append((v - cube_min) / (-di))
        else:
            lims.append(float("inf"))

    r_allowed = min(lims) * safety
    radius = min(radius, r_allowed)

    pt = np.array([v, v, v]) + radius * d
    pt = np.clip(pt, cube_min, cube_max)
    return float(pt[0]), float(pt[1]), float(pt[2])


def minutes_to_s(mm: float) -> float:
    """
    Map minutes since midnight (0..1440) to helix parameter s (0..2),
    with midnight at s=1 (helix "bottom"), noon at s=0/2 (top).
      00:00 -> s=1
      12:00 -> s=2 (equivalent to s=0)
      24:00 -> s=1
    """
    mm = float(mm)
    if mm <= 720.0:
        return 1.0 + (mm / 720.0)  # 1..2  (midnight -> noon)
    else:
        return (mm - 720.0) / 720.0  # 0..1 (noon -> midnight)


def s_for_now_midnight_based() -> float:
    d = dt.datetime.now()
    mm = d.hour * 60 + d.minute + d.second / 60 + d.microsecond / 60_000_000
    return minutes_to_s(mm)


def find_repo_root(start: Path) -> Path:
    cur = start.resolve()
    for _ in range(12):
        if (cur / "package.json").exists():
            return cur
        cur = cur.parent
    return start.resolve()


def parse_colors_from_ts(ts_text: str):
    pattern = re.compile(
        r'"([^"]+)"\s*:\s*\[\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\]\s*,?'
    )
    out = []
    for m in pattern.finditer(ts_text):
        name = m.group(1)
        r, g, b = map(int, (m.group(2), m.group(3), m.group(4)))
        out.append((name, r, g, b))
    return out


def brightness(r: int, g: int, b: int) -> float:
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def mm_to_hhmm(mm: float) -> str:
    mm = int(round(mm))
    mm = max(0, min(1440, mm))
    h = mm // 60
    m = mm % 60
    return f"{h:02d}:{m:02d}"


def main():
    repo = find_repo_root(Path(__file__).parent)
    ts_path = repo / "src" / "colors" / "ColorList.ts"

    if not ts_path.exists():
        print(f"Could not find: {ts_path}")
        print("Edit ts_path in the script if your file lives elsewhere.")
        return

    text = ts_path.read_text(encoding="utf-8")
    colors = parse_colors_from_ts(text)

    if not colors:
        print("No colors parsed. Make sure the file has entries like:")
        print('"Name": [r, g, b],')
        return

    names = [c[0] for c in colors]
    R = [c[1] for c in colors]
    G = [c[2] for c in colors]
    B = [c[3] for c in colors]

    point_colors = [(r / 255.0, g / 255.0, b / 255.0) for r, g, b in zip(R, G, B)]

    # ---- Figure layout: leave room at bottom for slider + swatch
    fig = plt.figure()
    fig.subplots_adjust(left=0.05, right=0.95, top=0.93, bottom=0.20)

    ax = fig.add_subplot(111, projection="3d")
    ax.set_title("RGB space (R,G,B) — rotate/zoom with mouse")
    ax.set_xlabel("R")
    ax.set_ylabel("G")
    ax.set_zlabel("B")
    ax.set_xlim(0, 255)
    ax.set_ylim(0, 255)
    ax.set_zlim(0, 255)

    ax.scatter(R, G, B, c=point_colors, s=30, depthshade=True)

    # --- Helix params ---
    # Inward endpoints (so you aren't near pure white/black around noon/midnight)
    start_v = 210.0
    end_v = 45.0

    turns_each = 12
    r_max = 140.0
    safety = 0.98

    # NEW knobs:
    theta0 = np.pi / 2  # initial angle offset (rotates the helix direction right away)
    radius_power = 0.5  # <1 => reaches outward faster near endpoints (try 0.4..0.7)

    # --- Helix path ---
    sx, sy, sz = helix_roundtrip_diagonal(
        start=start_v,
        end=end_v,
        n_points=4000,
        turns_each=turns_each,
        r_max=r_max,
        safety=safety,
        theta0=theta0,
        radius_power=radius_power,
    )
    ax.plot(sx, sy, sz, linewidth=4, color="black", alpha=0.98)

    # --- Marker dot (controlled by slider / timer) ---
    s_now = s_for_now_midnight_based()
    cx, cy, cz = helix_point_at_s(
        s_now,
        start=start_v,
        end=end_v,
        turns_each=turns_each,
        r_max=r_max,
        safety=safety,
        theta0=theta0,
        radius_power=radius_power,
    )
    curr_dot = ax.scatter([cx], [cy], [cz], s=220, color="black", depthshade=False)
    label3d = ax.text(cx, cy, cz, " time", fontsize=10)

    # --- Brightest labels ---
    top = sorted(colors, key=lambda c: brightness(c[1], c[2], c[3]), reverse=True)[:10]
    for name, r, g, b in top:
        ax.text(r, g, b, name, fontsize=8)

    info_text = fig.text(
        0.02, 0.02, "Click near a point to show its name + RGB", fontsize=10
    )

    # ---- 2D UI axes for swatch + slider
    swatch_ax = fig.add_axes([0.82, 0.04, 0.13, 0.12])  # [left, bottom, width, height]
    swatch_ax.set_aspect("equal", adjustable="box")
    swatch_ax.set_xlim(0, 1)
    swatch_ax.set_ylim(0, 1)
    swatch_ax.axis("off")

    r0, g0, b0 = int(round(cx)), int(round(cy)), int(round(cz))
    swatch_circle = Circle(
        (0.5, 0.5),
        radius=0.45,
        facecolor=(r0 / 255.0, g0 / 255.0, b0 / 255.0),
        edgecolor="black",
        linewidth=1.5,
    )
    swatch_ax.add_patch(swatch_circle)

    now_mm_int = dt.datetime.now().hour * 60 + dt.datetime.now().minute
    swatch_label = fig.text(
        0.62,
        0.09,
        f"{mm_to_hhmm(now_mm_int)} -> ({r0}, {g0}, {b0})",
        fontsize=10,
    )

    slider_ax = fig.add_axes([0.12, 0.07, 0.65, 0.04])
    time_slider = Slider(
        ax=slider_ax,
        label="Time of day",
        valmin=0.0,
        valmax=1440.0,
        valinit=now_mm_int,
        valstep=1.0,
    )

    # Manual mode: user touched slider => freeze "live" updates
    manual_mode = {"active": False}

    def proj3d_points(ax_, xs, ys, zs):
        x2, y2, z2 = proj3d.proj_transform(xs, ys, zs, ax_.get_proj())
        xy_disp = ax_.transData.transform(np.vstack([x2, y2]).T)
        return xy_disp[:, 0], xy_disp[:, 1], z2

    def on_click(event):
        if event.inaxes != ax:
            return
        x2, y2, _ = proj3d_points(ax, np.array(R), np.array(G), np.array(B))
        mouse = np.array([event.x, event.y])
        pts = np.vstack([x2, y2]).T
        d2 = np.sum((pts - mouse) ** 2, axis=1)
        idx = int(np.argmin(d2))
        if d2[idx] < 600:
            name = names[idx]
            r, g, b = R[idx], G[idx], B[idx]
            info_text.set_text(f"{name}  ->  ({r}, {g}, {b})")
            fig.canvas.draw_idle()

    fig.canvas.mpl_connect("button_press_event", on_click)

    def set_marker_from_minutes(mm: float):
        s = minutes_to_s(mm)
        x, y, z = helix_point_at_s(
            s,
            start=start_v,
            end=end_v,
            turns_each=turns_each,
            r_max=r_max,
            safety=safety,
            theta0=theta0,
            radius_power=radius_power,
        )

        curr_dot._offsets3d = ([x], [y], [z])
        label3d.set_position((x, y))
        label3d.set_3d_properties(z, zdir="z")

        rr, gg, bb = int(round(x)), int(round(y)), int(round(z))
        swatch_circle.set_facecolor((rr / 255.0, gg / 255.0, bb / 255.0))
        swatch_label.set_text(f"{mm_to_hhmm(mm)} -> ({rr}, {gg}, {bb})")

        fig.canvas.draw_idle()

    def on_slider_change(val):
        set_marker_from_minutes(val)

    time_slider.on_changed(on_slider_change)

    def on_press(event):
        # If user clicks/presses in the slider area, go manual
        if event.inaxes == slider_ax:
            manual_mode["active"] = True

    fig.canvas.mpl_connect("button_press_event", on_press)

    def on_key(event):
        # Press "l" to return to live mode
        if event.key == "l":
            manual_mode["active"] = False

    fig.canvas.mpl_connect("key_press_event", on_key)

    def update_now():
        if manual_mode["active"]:
            return
        mm_now = (
            dt.datetime.now().hour * 60
            + dt.datetime.now().minute
            + dt.datetime.now().second / 60.0
        )
        # Update marker directly (avoid setting slider val triggering manual)
        set_marker_from_minutes(mm_now)
        time_slider.set_val(mm_now)

    timer = fig.canvas.new_timer(interval=1000)
    timer.add_callback(update_now)
    timer.start()

    plt.show()


if __name__ == "__main__":
    main()
