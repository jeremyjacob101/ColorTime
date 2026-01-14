/// <reference types="vite/client" />

export {};

type RGB = { r: number; g: number; b: number };
type ColorPayload = { rgb: RGB; ts: number };
type Range = { min: number; max: number };

declare global {
  interface Window {
    colurTime?: {
      getColor?: () => Promise<ColorPayload>;
      onColor?: (cb: (p: ColorPayload) => void) => () => void;

      getRange?: () => Promise<Range>;
      setRange?: (range: Range) => Promise<Range>;
      onRange?: (cb: (r: Range) => void) => () => void;

      onFocusRange?: (cb: () => void) => () => void;
    };
  }
}
