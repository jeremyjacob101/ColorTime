/// <reference types="vite/client" />
export {};

declare global {
  type RGB = { r: number; g: number; b: number };
  type ColorPayload = { rgb: RGB; ts: number };
  type ColurRange = { min: number; max: number };
  type MyColor = { name: string; rgb: RGB };

  interface Window {
    colurTime?: {
      getColor?: () => Promise<ColorPayload>;
      onColor?: (cb: (p: ColorPayload) => void) => () => void;

      getRange?: () => Promise<ColurRange>;
      setRange?: (range: ColurRange) => Promise<ColurRange>;
      onRange?: (cb: (r: ColurRange) => void) => () => void;

      onFocusRange?: (cb: () => void) => () => void;

      getMyColors?: () => Promise<MyColor[]>;
      addMyColor?: (name: string) => Promise<MyColor[]>;
      onMyColors?: (cb: (items: MyColor[]) => void) => () => void;
    };
  }
}
