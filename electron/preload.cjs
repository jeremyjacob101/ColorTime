const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("colorTime", {
  getColor: () => ipcRenderer.invoke("colorTime:getColor"),
  onColor: (cb) => {
    const handler = (_e, payload) => cb(payload);
    ipcRenderer.on("colorTime:color", handler);
    return () => ipcRenderer.removeListener("colorTime:color", handler);
  },

  getMyColors: () => ipcRenderer.invoke("colorTime:getMyColors"),
  addMyColor: (name) => ipcRenderer.invoke("colorTime:addMyColor", name),
  onMyColors: (cb) => {
    const handler = (_e, items) => cb(items);
    ipcRenderer.on("colorTime:myColors", handler);
    return () => ipcRenderer.removeListener("colorTime:myColors", handler);
  },
});
