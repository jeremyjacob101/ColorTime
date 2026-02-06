from pathlib import Path
import numpy as np
import re


def helix_roundtrip_diagonal(
    start: float = 230.0,
    end: float = 25.0,
    n_points: int = 3200,
    turns_each: float = 12.0,
    r_max: float = 135.0,
    safety: float = 0.98,
):
    if start < end:
        raise ValueError("start should be >= end (e.g. 220 down to 35).")

    # s: 0..2 (down then back)
    s = np.linspace(0.0, 2.0, n_points)

    # Center along diagonal, smooth turnaround at the low end
    mid = (start + end) / 2.0
    delta = (start - end) / 2.0
    v = mid + delta * np.cos(np.pi * s)  # start->end->start
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
    amp = float(
        np.sqrt(u[0] ** 2 + w[0] ** 2)
    )  # same for x,y,z in this basis (~0.8165)

    # Cap radius so ALL points stay within [end, start] on each axis (with a little margin).
    # This keeps the spiral from going "darker than 35" or "brighter than 220" in any channel.
    dist_to_nearest_endpoint = np.minimum(v - end, start - v)  # >= 0
    r_allowed = (dist_to_nearest_endpoint / amp) * safety
    radius = np.minimum(radius, r_allowed)

    # Angle: 12 turns down (s:0->1), 12 turns back (s:1->2), continuous direction
    theta = 2.0 * np.pi * turns_each * s

    offsets = (radius * np.cos(theta))[:, None] * u + (radius * np.sin(theta))[
        :, None
    ] * w
    pts = base + offsets

    return pts[:, 0], pts[:, 1], pts[:, 2]


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
    # simple luminance-ish metric
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

    # Terminal summary
    rs = [c[1] for c in colors]
    gs = [c[2] for c in colors]
    bs = [c[3] for c in colors]
    print(f"Parsed {len(colors)} colors from {ts_path}")
    print(
        f"R range: {min(rs)}..{max(rs)} | G range: {min(gs)}..{max(gs)} | B range: {min(bs)}..{max(bs)}"
    )

    # ---- Interactive 3D plot ----
    import matplotlib.pyplot as plt
    from mpl_toolkits.mplot3d import Axes3D  # noqa: F401  (needed for 3D)

    names = [c[0] for c in colors]
    R = [c[1] for c in colors]
    G = [c[2] for c in colors]
    B = [c[3] for c in colors]

    # Normalize to 0..1 for point colors
    point_colors = [(r / 255.0, g / 255.0, b / 255.0) for r, g, b in zip(R, G, B)]

    fig = plt.figure()
    ax = fig.add_subplot(111, projection="3d")

    ax.set_title("RGB space (R,G,B) — rotate/zoom with mouse")
    ax.set_xlabel("R")
    ax.set_ylabel("G")
    ax.set_zlabel("B")

    # Make axes consistent 0..255
    ax.set_xlim(0, 255)
    ax.set_ylim(0, 255)
    ax.set_zlim(0, 255)

    # Draw scatter
    ax.scatter(R, G, B, c=point_colors, s=30, depthshade=True)
    sx, sy, sz = helix_roundtrip_diagonal(
        start=220.0,
        end=35.0,
        n_points=4000,
        turns_each=12,
        r_max=140.0,  # try bigger/smaller; it will auto-cap to stay within [35..220]
    )

    ax.plot(sx, sy, sz, linewidth=4, color="black", alpha=0.98)

    # Optional: annotate a handful (too many labels becomes unreadable)
    # Here: label the 10 brightest colors
    top = sorted(colors, key=lambda c: brightness(c[1], c[2], c[3]), reverse=True)[:10]
    for name, r, g, b in top:
        ax.text(r, g, b, name, fontsize=8)

    # Optional: show a "selected point" readout when clicking near a point
    # Matplotlib 3D picking is a bit approximate; this is "good enough" for exploration.
    info_text = fig.text(
        0.02, 0.02, "Click near a point to show its name + RGB", fontsize=10
    )

    def on_click(event):
        if event.inaxes != ax:
            return

        # Project 3D points to 2D display coords and find nearest
        # Note: this works well enough for interactive exploration.
        import numpy as np

        x2, y2, _ = proj3d_points(ax, np.array(R), np.array(G), np.array(B))
        mouse = np.array([event.x, event.y])
        pts = np.vstack([x2, y2]).T
        d2 = np.sum((pts - mouse) ** 2, axis=1)
        idx = int(np.argmin(d2))

        # "near enough" threshold (in pixels^2)
        if d2[idx] < 600:  # adjust if you want easier/harder selection
            name = names[idx]
            r, g, b = R[idx], G[idx], B[idx]
            info_text.set_text(f"{name}  ->  ({r}, {g}, {b})")
            fig.canvas.draw_idle()

    def proj3d_points(ax, xs, ys, zs):
        # Projects 3D points to figure pixel coords
        import numpy as np
        from mpl_toolkits.mplot3d import proj3d

        x2, y2, z2 = proj3d.proj_transform(xs, ys, zs, ax.get_proj())
        # transform to display coordinates
        xy_disp = ax.transData.transform(np.vstack([x2, y2]).T)
        return xy_disp[:, 0], xy_disp[:, 1], z2

    fig.canvas.mpl_connect("button_press_event", on_click)

    plt.show()


if __name__ == "__main__":
    main()
