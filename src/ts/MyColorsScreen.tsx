import { useEffect, useMemo, useState } from "react";
import "../css/MyColorsScreen.css";
import { colur } from "../config/types/colorTime";

const clamp = (n: number, lo: number, hi: number) =>
  Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : lo;

const luminance = (c: RGB) =>
  (0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b) / 255;

export default function MyColorsScreen() {
  const [items, setItems] = useState<MyColor[]>([]);

  useEffect(() => {
    const unsub = colur.onMyColors((next: MyColor[]) => {
      setItems(Array.isArray(next) ? next : []);
    });

    colur.getMyColors().then(setItems);

    return () => {
      unsub();
    };
  }, []);

  const countLabel = useMemo(() => {
    if (items.length === 1) return "1 color";
    return `${items.length} colors`;
  }, [items.length]);

  return (
    <div className="mycolors-screen">
      <div className="mycolors-header">
        <div className="mycolors-title">My Colors</div>
        <div className="mycolors-count">{countLabel}</div>
      </div>

      <div className="mycolors-list">
        {items.length === 0 ? (
          <div className="mycolors-empty">
            No saved colors yet. Use the tray menu → the current color name →
            “Add to My Colors”.
          </div>
        ) : (
          items.map((it) => {
            const r = clamp(it.rgb?.r ?? 0, 0, 255);
            const g = clamp(it.rgb?.g ?? 0, 0, 255);
            const b = clamp(it.rgb?.b ?? 0, 0, 255);

            const fg =
              luminance({ r, g, b }) > 0.65
                ? "rgba(0,0,0,0.82)"
                : "rgba(255,255,255,0.92)";

            return (
              <div
                key={it.name}
                className="mycolors-pill"
                style={{
                  backgroundColor: `rgb(${r}, ${g}, ${b})`,
                  color: fg,
                }}
              >
                <div className="mycolors-name" title={it.name}>
                  {it.name}
                </div>
                <div className="mycolors-rgb">
                  ({r}, {g}, {b})
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
