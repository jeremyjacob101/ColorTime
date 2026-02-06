export {};

declare global {
  type RGB = { r: number; g: number; b: number };
  type MyColor = { name: string; rgb: RGB };

  interface Window {
    colurTime?: Window["colurTime"] & {
      getMyColors?: () => Promise<MyColor[]>;
      onMyColors?: (cb: (items: MyColor[]) => void) => () => void;
      addMyColor?: (name: string) => Promise<MyColor[]>;
    };
  }
}
