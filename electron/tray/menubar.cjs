const { app, Tray, Menu, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");

const { createJiti } = require("jiti");
const jiti = createJiti(__filename);

const { currentColor, normalizeRange } = require("./colorOfDay.cjs");
const { coloredCircleImage, coloredBarImage } = require("./trayIcon.cjs");
const { createMyColorsWindow } = require("./myColorsWindow.cjs");

let tray = null;
let win = null;
let myColorsWin = null;
let lastPayload = null;

async function createMenubarApp() {
  const devServerUrl = process.env.VITE_DEV_SERVER_URL;

  let range = normalizeRange({ min: 30, max: 225 });

  const broadcastRange = () => {
    if (win && !win.isDestroyed()) win.webContents.send("colur:range", range);
  };

  const refreshNow = () => {
    const rgb = currentColor(range);
    lastPayload = { rgb, ts: Date.now() };

    if (tray) tray.setImage(coloredCircleImage(rgb));
    if (win && !win.isDestroyed())
      win.webContents.send("colur:color", lastPayload);

    updateTrayMenu(win?.isVisible?.() ?? false);
  };

  const setRange = (next) => {
    range = normalizeRange(next);
    saveRange(range);
    broadcastRange();
    refreshNow();
  };

  Menu.setApplicationMenu(null);

  // ---- Load ColorList.ts mapping ----
  const colorsPath = path.join(app.getAppPath(), "src/colors/ColorList.ts");
  let ColorsToRGB = {};
  if (fs.existsSync(colorsPath)) {
    try {
      const imported = await jiti.import(colorsPath);
      ColorsToRGB = imported.ColorsToRGB || {};
    } catch {
      ColorsToRGB = {};
    }
  }

  // ---- Range persistence ----
  const rangePath = path.join(app.getPath("userData"), "range.json");

  const loadRange = () => {
    try {
      const raw = fs.readFileSync(rangePath, "utf8");
      return normalizeRange(JSON.parse(raw));
    } catch {
      return normalizeRange({ min: 30, max: 225 });
    }
  };

  const saveRange = (r) => {
    try {
      fs.writeFileSync(rangePath, JSON.stringify(r), "utf8");
    } catch {}
  };

  range = loadRange();

  // ---- My Colors persistence ----
  const myColorsPath = path.join(app.getPath("userData"), "myColors.json");
  let myColorNames = loadMyColors();

  function loadMyColors() {
    try {
      const raw = fs.readFileSync(myColorsPath, "utf8");
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return [];
      // normalize + unique, preserve order
      const seen = new Set();
      const out = [];
      for (const n of arr) {
        const name = String(n || "").trim();
        if (!name) continue;
        if (seen.has(name)) continue;
        seen.add(name);
        out.push(name);
      }
      return out;
    } catch {
      return [];
    }
  }

  function saveMyColors() {
    try {
      fs.writeFileSync(
        myColorsPath,
        JSON.stringify(myColorNames, null, 2),
        "utf8",
      );
    } catch {}
  }

  function buildMyColorsPayload() {
    // Only include names we can map to an RGB from ColorList.ts
    const payload = [];
    for (const name of myColorNames) {
      const rgbArr = ColorsToRGB?.[name];
      if (!rgbArr || rgbArr.length !== 3) continue;
      const [r, g, b] = rgbArr;
      payload.push({ name, rgb: { r, g, b } });
    }
    return payload;
  }

  function broadcastMyColors() {
    const payload = buildMyColorsPayload();
    if (win && !win.isDestroyed())
      win.webContents.send("colur:myColors", payload);
    if (myColorsWin && !myColorsWin.isDestroyed())
      myColorsWin.webContents.send("colur:myColors", payload);
  }

  function addMyColorByName(name) {
    const clean = String(name || "").trim();
    if (!clean) return false;
    if (clean === "Unknown") return false;

    // Must exist in ColorList.ts mapping (so the list can render accurately)
    if (!ColorsToRGB?.[clean]) return false;

    if (myColorNames.includes(clean)) return false;

    myColorNames = [...myColorNames, clean];
    saveMyColors();
    broadcastMyColors();
    return true;
  }

  // ---- Color matching (for current helix color -> closest named color) ----
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

  // ---- Window helpers ----
  function positionUnderTray(targetWin) {
    if (!tray || !targetWin) return;
    const trayBounds = tray.getBounds();
    const winBounds = targetWin.getBounds();

    const x = Math.round(
      trayBounds.x + trayBounds.width / 2 - winBounds.width / 2,
    );
    const y = Math.round(trayBounds.y + trayBounds.height + 6);
    targetWin.setPosition(x, y, false);
  }

  function ensureMyColorsWindow() {
    if (myColorsWin && !myColorsWin.isDestroyed()) return myColorsWin;

    myColorsWin = createMyColorsWindow({
      appPath: app.getAppPath(),
      devServerUrl,
    });

    myColorsWin.webContents.on("did-finish-load", () => {
      broadcastMyColors();
    });

    myColorsWin.on("blur", () => {
      if (myColorsWin && myColorsWin.isVisible()) {
        myColorsWin.hide();
        updateTrayMenu(win?.isVisible?.() ?? false);
      }
    });

    myColorsWin.on("hide", () => updateTrayMenu(win?.isVisible?.() ?? false));

    return myColorsWin;
  }

  function toggleMyColorsWindow() {
    const w = ensureMyColorsWindow();

    if (w.isVisible()) {
      w.hide();
      updateTrayMenu(win?.isVisible?.() ?? false);
      return;
    }

    // Hide the color window so they don't overlap
    if (win && win.isVisible()) win.hide();

    positionUnderTray(w);
    w.show();
    w.focus();
    updateTrayMenu(win?.isVisible?.() ?? false);
  }

  /**
   * Helper: Toggle Color Window Visibility and Position
   */
  function toggleWindow() {
    if (!win || !tray) return;

    if (win.isVisible()) {
      win.hide();
    } else {
      // If My Colors is showing, hide it
      if (myColorsWin && myColorsWin.isVisible()) myColorsWin.hide();

      positionUnderTray(win);
      win.show();
      win.focus();
      updateTrayMenu(true);
    }
  }

  // ---- Tray menu ----
  const updateTrayMenu = (isColorShown) => {
    if (!tray) return;

    const rgb = lastPayload?.rgb || currentColor(range);
    const colorName = getClosestColorName(rgb);
    const alreadyAdded = myColorNames.includes(colorName);
    const canAdd =
      colorName !== "Unknown" && !!ColorsToRGB?.[colorName] && !alreadyAdded;

    const contextMenu = Menu.buildFromTemplate([
      {
        label: "",
        icon: coloredBarImage(rgb),
        enabled: false,
      },
      {
        label: `${colorName}`,
        submenu: [
          {
            label: alreadyAdded ? "Added ✓" : "Add to My Colors",
            enabled: canAdd,
            click: () => {
              addMyColorByName(colorName);
              updateTrayMenu(win?.isVisible?.() ?? false);
            },
          },
        ],
      },
      { type: "separator" },
      {
        label: isColorShown ? "Hide Color" : "Show Color",
        click: toggleWindow,
      },
      {
        label: "My Colors",
        click: toggleMyColorsWindow,
      },
      { type: "separator" },
      {
        label: "Quit ColorTime",
        click: () => app.quit(),
      },
    ]);

    tray.setContextMenu(contextMenu);
  };

  // ---- Create main color window ----
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

    if (devServerUrl) {
      win.loadURL(devServerUrl);
    } else {
      win.loadFile(path.join(app.getAppPath(), "dist/index.html"));
    }

    win.webContents.on("did-finish-load", () => {
      broadcastRange();
      broadcastMyColors();
    });

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
      const rgb = currentColor(range);
      lastPayload = { rgb, ts: Date.now() };

      if (tray) tray.setImage(coloredCircleImage(rgb));
      if (win && !win.isDestroyed())
        win.webContents.send("colur:color", lastPayload);

      setTimeout(tick, 1000 - (Date.now() % 1000));
    };
    tick();
  }

  createWindow();

  // ---- IPC ----
  ipcMain.handle("colur:getColor", () => {
    return lastPayload || { rgb: currentColor(range), ts: Date.now() };
  });

  ipcMain.handle("colur:getRange", () => range);

  ipcMain.handle("colur:setRange", (_evt, next) => {
    setRange(next);
    return range;
  });

  ipcMain.handle("colur:getMyColors", () => {
    return buildMyColorsPayload();
  });

  ipcMain.handle("colur:addMyColor", (_evt, name) => {
    addMyColorByName(name);
    return buildMyColorsPayload();
  });

  // ---- Tray ----
  const initialColor = currentColor(range);
  tray = new Tray(coloredCircleImage(initialColor));
  tray.setToolTip("ColorTime");
  tray.on("mouse-enter", () => updateTrayMenu(win?.isVisible?.() ?? false));
  updateTrayMenu(false);

  if (process.platform === "darwin") {
    app.dock.hide();
  }

  // Send initial payloads
  broadcastMyColors();

  startClockLoop();
  return { tray, win };
}

module.exports = { createMenubarApp };
