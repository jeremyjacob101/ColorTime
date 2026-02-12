const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("colorTime", {
  getColor: () => ipcRenderer.invoke("colorTime:getColor"),
  onColor: (cb) => {
    const handler = (_e, payload) => cb(payload);
    ipcRenderer.on("colorTime:color", handler);
    return () => ipcRenderer.removeListener("colorTime:color", handler);
  },

  getRange: () => ipcRenderer.invoke("colorTime:getRange"),
  setRange: (range) => ipcRenderer.invoke("colorTime:setRange", range),
  onRange: (cb) => {
    const handler = (_e, r) => cb(r);
    ipcRenderer.on("colorTime:range", handler);
    return () => ipcRenderer.removeListener("colorTime:range", handler);
  },

  onFocusRange: (cb) => {
    const handler = () => cb();
    ipcRenderer.on("colorTime:focusRange", handler);
    return () => ipcRenderer.removeListener("colorTime:focusRange", handler);
  },

  getMyColors: () => ipcRenderer.invoke("colorTime:getMyColors"),
  addMyColor: (name) => ipcRenderer.invoke("colorTime:addMyColor", name),
  onMyColors: (cb) => {
    const handler = (_e, items) => cb(items);
    ipcRenderer.on("colorTime:myColors", handler);
    return () => ipcRenderer.removeListener("colorTime:myColors", handler);
  },
});
