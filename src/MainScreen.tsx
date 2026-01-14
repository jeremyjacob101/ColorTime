import { useEffect, useState } from "react";
import { ColorsToRGB } from "./colors/ColorList";
import "./MainScreen.css";

type RGB = { r: number; g: number; b: number };
type ColorPayload = { rgb: RGB; ts: number };
type Range = { min: number; max: number };

const toHex = ({ r, g, b }: RGB) =>
  `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`.toUpperCase();

const getLuminance = (bg: RGB) =>
  (0.2126 * bg.r + 0.7152 * bg.g + 0.0722 * bg.b) / 255;

export default function MainScreen() {
  const [payload, setPayload] = useState<ColorPayload | null>(null);
  const [range, setRange] = useState<Range>({ min: 50, max: 200 });

  useEffect(() => {
    window.colurTime?.getColor?.().then(setPayload);
    const unsubColor = window.colurTime?.onColor?.(setPayload);

    window.colurTime?.getRange?.().then((r: Range) => r && setRange(r));
    const unsubRange = window.colurTime?.onRange?.(
      (r: Range) => r && setRange(r),
    );

    return () => {
      unsubColor?.();
      unsubRange?.();
    };
  }, []);

  const rgb = payload?.rgb ?? { r: 128, g: 0, b: 128 };

  let minDistance = Infinity;
  let closestName = "Unknown";
  for (const [name, [r, g, b]] of Object.entries(ColorsToRGB)) {
    const dist = (rgb.r - r) ** 2 + (rgb.g - g) ** 2 + (rgb.b - b) ** 2;
    if (dist < minDistance) {
      minDistance = dist;
      closestName = name;
    }
  }

  const textColor =
    getLuminance(rgb) > 0.65 ? "rgba(0,0,0,0.8)" : "rgba(255,255,255,0.9)";

  const applyRange = (next: Range) => {
    setRange(next);
    window.colurTime?.setRange?.(next);
  };

  const onMinChange = (v: number) => {
    const nextMin = Math.max(0, Math.min(255, v));
    // don't touch max; just prevent crossing
    applyRange({ min: Math.min(nextMin, range.max - 1), max: range.max });
  };

  const onMaxChange = (v: number) => {
    const nextMax = Math.max(0, Math.min(255, v));
    // don't touch min; just prevent crossing
    applyRange({ min: range.min, max: Math.max(nextMax, range.min + 1) });
  };

  return (
    <div
      className="screen"
      style={{ backgroundColor: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` }}
    >
      <div className="readout" style={{ color: textColor }}>
        <div className="name">{closestName}</div>
        <div className="values">
          rgb({rgb.r}, {rgb.g}, {rgb.b}) <span className="dot">•</span>{" "}
          {toHex(rgb)}
        </div>

        <div className="range-panel">
          <div className="range-title">Range</div>

          <div className="range-values">
            <span>Low: {range.min}</span>
            <span>High: {range.max}</span>
          </div>

          <div className="range-sliders">
            <div className="range-row">
              <span className="range-row-label">Low</span>
              <input
                id="range-min"
                type="range"
                min={0}
                max={255}
                value={range.min}
                onChange={(e) => onMinChange(Number(e.target.value))}
              />
            </div>

            <div className="range-row">
              <span className="range-row-label">High</span>
              <input
                type="range"
                min={0}
                max={255}
                value={range.max}
                onChange={(e) => onMaxChange(Number(e.target.value))}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
