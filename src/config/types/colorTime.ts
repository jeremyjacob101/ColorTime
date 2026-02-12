const noopUnsub = () => {};

export const colorTime = {
  getColor: async (): Promise<ColorPayload | null> => {
    const p = await window.colorTime?.getColor?.();
    return p ?? null;
  },

  onColor: (cb: (p: ColorPayload) => void): (() => void) => {
    return window.colorTime?.onColor?.(cb) ?? noopUnsub;
  },

  getRange: async (): Promise<ColorRange | null> => {
    const r = await window.colorTime?.getRange?.();
    return r ?? null;
  },

  setRange: async (range: ColorRange): Promise<ColorRange | null> => {
    const r = await window.colorTime?.setRange?.(range);
    return r ?? null;
  },

  onRange: (cb: (r: ColorRange) => void): (() => void) => {
    return window.colorTime?.onRange?.(cb) ?? noopUnsub;
  },

  onFocusRange: (cb: () => void): (() => void) => {
    return window.colorTime?.onFocusRange?.(cb) ?? noopUnsub;
  },

  getMyColors: async (): Promise<MyColor[]> => {
    const items = await window.colorTime?.getMyColors?.();
    return Array.isArray(items) ? items : [];
  },

  onMyColors: (cb: (items: MyColor[]) => void): (() => void) => {
    return window.colorTime?.onMyColors?.(cb) ?? noopUnsub;
  },

  addMyColor: async (name: string): Promise<MyColor[]> => {
    const items = await window.colorTime?.addMyColor?.(name);
    return Array.isArray(items) ? items : [];
  },
};
