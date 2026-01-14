const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("colurTime", {
  getColor: () => ipcRenderer.invoke("colur:getColor"),
  onColor: (cb) => {
    const handler = (_e, payload) => cb(payload);
    ipcRenderer.on("colur:color", handler);
    return () => ipcRenderer.removeListener("colur:color", handler);
  },

  getRange: () => ipcRenderer.invoke("colur:getRange"),
  setRange: (range) => ipcRenderer.invoke("colur:setRange", range),
  onRange: (cb) => {
    const handler = (_e, r) => cb(r);
    ipcRenderer.on("colur:range", handler);
    return () => ipcRenderer.removeListener("colur:range", handler);
  },

  onFocusRange: (cb) => {
    const handler = () => cb();
    ipcRenderer.on("colur:focusRange", handler);
    return () => ipcRenderer.removeListener("colur:focusRange", handler);
  },
});
