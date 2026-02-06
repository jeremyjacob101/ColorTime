const { BrowserWindow } = require("electron");
const path = require("path");

function createMyColorsWindow({ appPath, devServerUrl }) {
  const win = new BrowserWindow({
    width: 300,
    height: 360,
    show: false,
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    backgroundColor: "#0b0b0c",
    webPreferences: {
      preload: path.join(appPath, "electron/preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (devServerUrl) {
    win.loadURL(`${devServerUrl}?view=my-colors`);
  } else {
    win.loadFile(path.join(appPath, "dist/index.html"), {
      query: { view: "my-colors" },
    });
  }

  return win;
}

module.exports = { createMyColorsWindow };
