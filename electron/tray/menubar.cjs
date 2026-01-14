const { app, Tray, Menu, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");

const { createJiti } = require("jiti");
const jiti = createJiti(__filename);

const { currentColor } = require("./colorOfDay.cjs");
const { coloredCircleImage, coloredBarImage } = require("./trayIcon.cjs");

let tray = null;
let win = null;
let lastPayload = null;

async function createMenubarApp() {
  Menu.setApplicationMenu(null);
  const colorsPath = path.join(app.getAppPath(), "src/colors/ColorList.ts");
  console.log("Looking for colors at:", colorsPath);
  if (!fs.existsSync(colorsPath)) {
    var ColorsToRGB = {};
  } else {
    try {
      const imported = await jiti.import(colorsPath);
      var ColorsToRGB = imported.ColorsToRGB || {};
    } catch (e) {
      var ColorsToRGB = {};
    }
  }

  const getClosestColorName = (rgb) => {
    let minDistance = Infinity;
    let match = "Unknown";
    for (const [name, [r, g, b]] of Object.entries(ColorsToRGB)) {
      const dist = (rgb.r - r) ** 2 + (rgb.g - g) ** 2 + (rgb.b - b) ** 2;
      if (dist < minDistance) {
        minDistance = dist;
        match = name;
      }
    }
    return match;
  };

  const updateTrayMenu = (isShown) => {
    if (!tray) return;
    const rgb = lastPayload?.rgb || currentColor();
    const colorName = getClosestColorName(rgb);

    const contextMenu = Menu.buildFromTemplate([
      {
        label: "",
        icon: coloredBarImage(rgb),
        enabled: false,
      },
      {
        label: ` ${colorName}`,
        submenu: [{ label: "Add to My Colors", click: () => {} }],
      },
      { type: "separator" },
      {
        label: isShown ? "Hide Color" : "Show Color",
        click: toggleWindow,
      },
      {
        label: "Quit ColurTime",
        click: () => app.quit(),
      },
    ]);

    tray.setContextMenu(contextMenu);
  };

  /**
   * Helper: Toggle Window Visibility and Position
   */
  function toggleWindow() {
    if (!win || !tray) return;

    if (win.isVisible()) {
      win.hide();
    } else {
      const trayBounds = tray.getBounds();
      const winBounds = win.getBounds();

      // Center window under the tray icon
      const x = Math.round(
        trayBounds.x + trayBounds.width / 2 - winBounds.width / 2,
      );
      const y = Math.round(trayBounds.y + trayBounds.height + 6);

      win.setPosition(x, y, false);
      win.show();
      win.focus();
      updateTrayMenu(true);
    }
  }

  function createWindow() {
    win = new BrowserWindow({
      width: 300,
      height: 360,
      show: false,
      frame: false,
      resizable: false,
      alwaysOnTop: true,
      webPreferences: {
        preload: path.join(app.getAppPath(), "electron/preload.cjs"),
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    const devServer = process.env.VITE_DEV_SERVER_URL;
    if (devServer) {
      win.loadURL(devServer);
    } else {
      win.loadFile(path.join(app.getAppPath(), "dist/index.html"));
    }

    win.on("blur", () => {
      if (win && win.isVisible()) {
        win.hide();
        updateTrayMenu(false);
      }
    });

    win.on("hide", () => updateTrayMenu(false));
  }

  function startClockLoop() {
    const tick = () => {
      const rgb = currentColor();
      lastPayload = { rgb, ts: Date.now() };

      if (tray) {
        tray.setImage(coloredCircleImage(rgb));
      }
      if (win && !win.isDestroyed()) {
        win.webContents.send("colur:color", lastPayload);
      }

      setTimeout(tick, 1000 - (Date.now() % 1000));
    };
    tick();
  }
  createWindow();

  ipcMain.handle("colur:getColor", () => {
    return lastPayload || { rgb: currentColor(), ts: Date.now() };
  });

  const initialColor = currentColor();
  tray = new Tray(coloredCircleImage(initialColor));
  tray.setToolTip("ColurTime");
  tray.on("mouse-enter", () => updateTrayMenu(win.isVisible()));
  updateTrayMenu(false);

  if (process.platform === "darwin") {
    app.dock.hide();
  }

  startClockLoop();
  return { tray, win };
}

module.exports = { createMenubarApp };
