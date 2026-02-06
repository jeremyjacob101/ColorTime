const { BrowserWindow } = require("electron");
const path = require("path");

function buildMyColorsDataUrl() {
  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta
      http-equiv="Content-Security-Policy"
      content="default-src 'self' 'unsafe-inline' data:; script-src 'self' 'unsafe-inline' data:;"
    />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>My Colors</title>
    <style>
      :root {
        --bg: #0b0b0c;
        --panel: rgba(255, 255, 255, 0.06);
        --text: rgba(255, 255, 255, 0.92);
        --muted: rgba(255, 255, 255, 0.55);
      }

      html, body {
        margin: 0;
        padding: 0;
        height: 100%;
        background: var(--bg);
        color: var(--text);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
        overflow: hidden;
      }

      .wrap {
        height: 100%;
        display: flex;
        flex-direction: column;
      }

      .header {
        padding: 14px 14px 10px 14px;
        border-bottom: 1px solid rgba(255,255,255,0.08);
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 12px;
      }

      .title {
        font-size: 14px;
        font-weight: 600;
        letter-spacing: 0.2px;
      }

      .count {
        font-size: 12px;
        color: var(--muted);
      }

      .list {
        padding: 12px;
        overflow-y: auto;
        flex: 1;
      }

      .empty {
        margin-top: 18px;
        padding: 14px;
        border-radius: 12px;
        background: var(--panel);
        color: var(--muted);
        font-size: 12px;
        line-height: 1.35;
      }

      .pill {
        border-radius: 12px;
        padding: 12px 14px;
        margin-bottom: 10px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;

        box-shadow: 0 6px 18px rgba(0,0,0,0.35);
        border: 1px solid rgba(255,255,255,0.14);
      }

      .name {
        font-size: 13px;
        font-weight: 600;
        letter-spacing: 0.15px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 210px;
      }

      .rgb {
        font-size: 11px;
        font-variant-numeric: tabular-nums;
        opacity: 0.85;
        white-space: nowrap;
      }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="header">
        <div class="title">My Colors</div>
        <div id="count" class="count">0</div>
      </div>
      <div id="list" class="list"></div>
    </div>

    <script>
      function clamp(n, lo, hi) {
        n = Number(n);
        if (!Number.isFinite(n)) return lo;
        return Math.min(hi, Math.max(lo, n));
      }

      function luminance(r, g, b) {
        // same weights you used elsewhere
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      }

      function textColorFor(rgb) {
        const L = luminance(rgb.r, rgb.g, rgb.b);
        return L > 150 ? "rgba(0,0,0,0.82)" : "rgba(255,255,255,0.92)";
      }

      function render(items) {
        const list = document.getElementById("list");
        const count = document.getElementById("count");

        const safe = Array.isArray(items) ? items : [];
        count.textContent = safe.length === 1 ? "1 color" : safe.length + " colors";

        list.innerHTML = "";

        if (!safe.length) {
          const empty = document.createElement("div");
          empty.className = "empty";
          empty.textContent =
            "No saved colors yet. Use the tray menu → the current color name → “Add to My Colors”.";
          list.appendChild(empty);
          return;
        }

        for (const item of safe) {
          const rgb = item?.rgb || { r: 0, g: 0, b: 0 };
          const r = clamp(rgb.r, 0, 255);
          const g = clamp(rgb.g, 0, 255);
          const b = clamp(rgb.b, 0, 255);

          const pill = document.createElement("div");
          pill.className = "pill";
          pill.style.background = "rgb(" + r + "," + g + "," + b + ")";
          pill.style.color = textColorFor({ r, g, b });

          const left = document.createElement("div");
          left.className = "name";
          left.textContent = item?.name || "Unknown";

          const right = document.createElement("div");
          right.className = "rgb";
          right.textContent = "(" + r + ", " + g + ", " + b + ")";

          pill.appendChild(left);
          pill.appendChild(right);
          list.appendChild(pill);
        }
      }

      async function refresh() {
        try {
          const items = await window.colurTime.getMyColors();
          render(items);
        } catch {
          render([]);
        }
      }

      window.colurTime.onMyColors((items) => {
        render(items);
      });

      refresh();
    </script>
  </body>
</html>`;

  return "data:text/html;charset=utf-8," + encodeURIComponent(html);
}

function createMyColorsWindow(appPath) {
  const win = new BrowserWindow({
    width: 300,
    height: 360,
    show: false,
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    webPreferences: {
      preload: path.join(appPath, "electron/preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadURL(buildMyColorsDataUrl());
  return win;
}

module.exports = { createMyColorsWindow };
