const noopUnsub = () => {};

export const colorTime = {
  getColor: async (): Promise<ColorPayload | null> => {
    const p = await window.colorTime?.getColor?.();
    return p ?? null;
  },

  onColor: (cb: (p: ColorPayload) => void): (() => void) => {
    return window.colorTime?.onColor?.(cb) ?? noopUnsub;
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
