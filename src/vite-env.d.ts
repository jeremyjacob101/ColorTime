type RGB = { r: number; g: number; b: number };
type ColorPayload = { rgb: RGB; ts: number };

interface Window {
  colurTime?: {
    getColor?: () => Promise<ColorPayload>;
    onColor?: (cb: (p: ColorPayload) => void) => () => void;
  };
}
