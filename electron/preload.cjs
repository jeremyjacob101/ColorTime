
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("colurTime", {
  getColor: () => ipcRenderer.invoke("colur:getColor"),
  onColor: (cb) => {
    const handler = (_event, payload) => cb(payload);
    ipcRenderer.on("colur:color", handler);
    return () => ipcRenderer.removeListener("colur:color", handler);
  },
});
