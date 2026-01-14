import { useEffect, useState } from "react";
import { ColorsToRGB } from "./colors/ColorList";
import "./MainScreen.css";

// Define types at the top
type RGB = { r: number; g: number; b: number };
type ColorPayload = { rgb: RGB; ts: number };

const toHex = ({ r, g, b }: RGB) =>
  `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`.toUpperCase();

const getLuminance = (bg: RGB) =>
  (0.2126 * bg.r + 0.7152 * bg.g + 0.0722 * bg.b) / 255;

export default function MainScreen() {
  const [payload, setPayload] = useState<ColorPayload | null>(null);

  useEffect(() => {
    window.colurTime?.getColor?.().then(setPayload);
    const unsubscribe = window.colurTime?.onColor?.(setPayload);
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const rgb = payload?.rgb ?? { r: 128, g: 0, b: 128 };

  // Calculate closest name
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

  return (
    <div
      className="screen"
      style={{ backgroundColor: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` }}
    >
      <div className="readout" style={{ color: textColor }}>
        <div className="name-display">{closestName}</div>
        <div className="meta-display">
          rgb({rgb.r}, {rgb.g}, {rgb.b}) <span className="dot">•</span>{" "}
          {toHex(rgb)}
        </div>
      </div>
    </div>
  );
}
