/// <reference types="vite/client" />
export {};

declare global {
  type RGB = { r: number; g: number; b: number };
  type ColorPayload = { rgb: RGB; ts: number };
  type MyColor = { name: string; rgb: RGB };

  interface Window {
    colorTime?: {
      getColor?: () => Promise<ColorPayload>;
      onColor?: (cb: (p: ColorPayload) => void) => () => void;

      getMyColors?: () => Promise<MyColor[]>;
      addMyColor?: (name: string) => Promise<MyColor[]>;
      onMyColors?: (cb: (items: MyColor[]) => void) => () => void;
    };
  }
}
