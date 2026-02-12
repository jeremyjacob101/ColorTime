/// <reference types="vite/client" />
export {};

declare global {
  type RGB = { r: number; g: number; b: number };
  type ColorPayload = { rgb: RGB; ts: number };
  type ColorRange = { min: number; max: number };
  type MyColor = { name: string; rgb: RGB };

  interface Window {
    colorTime?: {
      getColor?: () => Promise<ColorPayload>;
      onColor?: (cb: (p: ColorPayload) => void) => () => void;

      getRange?: () => Promise<ColorRange>;
      setRange?: (range: ColorRange) => Promise<ColorRange>;
      onRange?: (cb: (r: ColorRange) => void) => () => void;

      onFocusRange?: (cb: () => void) => () => void;

      getMyColors?: () => Promise<MyColor[]>;
      addMyColor?: (name: string) => Promise<MyColor[]>;
      onMyColors?: (cb: (items: MyColor[]) => void) => () => void;
    };
  }
}
