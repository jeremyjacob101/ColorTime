from mpl_toolkits.mplot3d import proj3d
import matplotlib.pyplot as plt
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
):
    if start < end:
        raise ValueError("start should be >= end (e.g. 220 down to 35).")

    # s: 0..2 (down then back)
    s = np.linspace(0.0, 2.0, n_points)

    # Center along diagonal, constant-speed down then back
    v = np.where(
        s <= 1.0,
        start + (end - start) * s,
        end + (start - end) * (s - 1.0),
    )
    base = np.stack([v, v, v], axis=1)

    # Radius profile: 0 at s=0,1,2; max at s=0.5 and 1.5
    radius = r_max * (np.sin(np.pi * s) ** 2)

    # Orthonormal basis perpendicular to (1,1,1)
    axis = np.array([1.0, 1.0, 1.0])
    axis = axis / np.linalg.norm(axis)

    a = np.array([1.0, 0.0, 0.0])
    u = a - np.dot(a, axis) * axis
    u = u / np.linalg.norm(u)
    w = np.cross(axis, u)

    # For any coordinate i, the sinusoid amplitude is radius * sqrt(u_i^2 + w_i^2)
    amp = float(np.sqrt(u[0] ** 2 + w[0] ** 2))  # ~0.8165

    # Cap radius so ALL points stay within [end, start] on each axis (with a little margin).
    dist_to_nearest_endpoint = np.minimum(v - end, start - v)  # >= 0
    r_allowed = (dist_to_nearest_endpoint / amp) * safety
    radius = np.minimum(radius, r_allowed)

    # Angle: turns_each turns down (s:0->1), turns_each turns back (s:1->2)
    theta = 2.0 * np.pi * turns_each * s

    offsets = (radius * np.cos(theta))[:, None] * u + (radius * np.sin(theta))[
        :, None
    ] * w
    pts = base + offsets

    return pts[:, 0], pts[:, 1], pts[:, 2]


def helix_point_at_s(
    s: float,
    start: float = 225.0,
    end: float = 30.0,
    turns_each: float = 12.0,
    r_max: float = 135.0,
    safety: float = 0.98,
):
    """
    Compute ONE point on the same helix for a given s in [0,2].
    """
    if start < end:
        raise ValueError("start should be >= end.")
    s = float(s)

    # start -> end (s:0..1), then end -> start (s:1..2), constant speed
    if s <= 1.0:
        v = start + (end - start) * s
    else:
        v = end + (start - end) * (s - 1.0)

    radius = r_max * (np.sin(np.pi * s) ** 2)

    axis = np.array([1.0, 1.0, 1.0])
    axis = axis / np.linalg.norm(axis)

    a = np.array([1.0, 0.0, 0.0])
    u = a - np.dot(a, axis) * axis
    u = u / np.linalg.norm(u)
    w = np.cross(axis, u)

    amp = float(np.sqrt(u[0] ** 2 + w[0] ** 2))
    dist_to_nearest_endpoint = min(v - end, start - v)
    r_allowed = (dist_to_nearest_endpoint / amp) * safety
    radius = min(radius, r_allowed)

    theta = 2.0 * np.pi * turns_each * s
    offset = radius * np.cos(theta) * u + radius * np.sin(theta) * w
    pt = np.array([v, v, v]) + offset
    pt = np.clip(pt, 0.0, 255.0)
    return float(pt[0]), float(pt[1]), float(pt[2])


def s_for_now():
    """
    Match the Electron mapping:
      noon -> s=0
      midnight -> s=1
      back to noon -> s=2
    """

    d = dt.datetime.now()
    mm = d.hour * 60 + d.minute + d.second / 60 + d.microsecond / 60_000_000

    if mm < 720:
        return 1.0 + mm / 720.0  # 1..2 (midnight -> noon)
    return (mm - 720.0) / 720.0  # 0..1 (noon -> midnight)


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

    rs = [c[1] for c in colors]
    gs = [c[2] for c in colors]
    bs = [c[3] for c in colors]
    print(f"Parsed {len(colors)} colors from {ts_path}")
    print(
        f"R range: {min(rs)}..{max(rs)} | G range: {min(gs)}..{max(gs)} | B range: {min(bs)}..{max(bs)}"
    )

    names = [c[0] for c in colors]
    R = [c[1] for c in colors]
    G = [c[2] for c in colors]
    B = [c[3] for c in colors]

    point_colors = [(r / 255.0, g / 255.0, b / 255.0) for r, g, b in zip(R, G, B)]

    fig = plt.figure()
    ax = fig.add_subplot(111, projection="3d")

    ax.set_title("RGB space (R,G,B) — rotate/zoom with mouse")
    ax.set_xlabel("R")
    ax.set_ylabel("G")
    ax.set_zlabel("B")

    ax.set_xlim(0, 255)
    ax.set_ylim(0, 255)
    ax.set_zlim(0, 255)

    ax.scatter(R, G, B, c=point_colors, s=30, depthshade=True)

    # --- Helix path ---
    start_v = 220.0
    end_v = 35.0
    turns_each = 12
    r_max = 140.0
    safety = 0.98

    sx, sy, sz = helix_roundtrip_diagonal(
        start=start_v,
        end=end_v,
        n_points=4000,
        turns_each=turns_each,
        r_max=r_max,
        safety=safety,
    )
    ax.plot(sx, sy, sz, linewidth=4, color="black", alpha=0.98)

    # --- Current time marker (big dot) ---
    s_now = s_for_now()
    cx, cy, cz = helix_point_at_s(
        s_now,
        start=start_v,
        end=end_v,
        turns_each=turns_each,
        r_max=r_max,
        safety=safety,
    )
    curr_dot = ax.scatter([cx], [cy], [cz], s=220, color="black", depthshade=False)

    # small label near the dot
    label = ax.text(cx, cy, cz, " now", fontsize=10)

    # --- Brightest labels ---
    top = sorted(colors, key=lambda c: brightness(c[1], c[2], c[3]), reverse=True)[:10]
    for name, r, g, b in top:
        ax.text(r, g, b, name, fontsize=8)

    info_text = fig.text(
        0.02, 0.02, "Click near a point to show its name + RGB", fontsize=10
    )

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

    # --- Update the "now" dot once per second ---
    def update_now():
        nonlocal curr_dot, label
        s_now2 = s_for_now()
        x, y, z = helix_point_at_s(
            s_now2,
            start=start_v,
            end=end_v,
            turns_each=turns_each,
            r_max=r_max,
            safety=safety,
        )

        # Update scatter point position
        curr_dot._offsets3d = ([x], [y], [z])

        # Update label position
        label.set_position((x, y))
        label.set_3d_properties(z, zdir="z")

        fig.canvas.draw_idle()

    timer = fig.canvas.new_timer(interval=1000)
    timer.add_callback(update_now)
    timer.start()

    plt.show()


if __name__ == "__main__":
    main()
