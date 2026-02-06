const noopUnsub = () => {};

export const colur = {
  getColor: async (): Promise<ColorPayload | null> => {
    const p = await window.colurTime?.getColor?.();
    return p ?? null;
  },

  onColor: (cb: (p: ColorPayload) => void): (() => void) => {
    return window.colurTime?.onColor?.(cb) ?? noopUnsub;
  },

  getRange: async (): Promise<ColurRange | null> => {
    const r = await window.colurTime?.getRange?.();
    return r ?? null;
  },

  setRange: async (range: ColurRange): Promise<ColurRange | null> => {
    const r = await window.colurTime?.setRange?.(range);
    return r ?? null;
  },

  onRange: (cb: (r: ColurRange) => void): (() => void) => {
    return window.colurTime?.onRange?.(cb) ?? noopUnsub;
  },

  onFocusRange: (cb: () => void): (() => void) => {
    return window.colurTime?.onFocusRange?.(cb) ?? noopUnsub;
  },

  getMyColors: async (): Promise<MyColor[]> => {
    const items = await window.colurTime?.getMyColors?.();
    return Array.isArray(items) ? items : [];
  },

  onMyColors: (cb: (items: MyColor[]) => void): (() => void) => {
    return window.colurTime?.onMyColors?.(cb) ?? noopUnsub;
  },

  addMyColor: async (name: string): Promise<MyColor[]> => {
    const items = await window.colurTime?.addMyColor?.(name);
    return Array.isArray(items) ? items : [];
  },
};
