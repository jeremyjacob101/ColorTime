const { app } = require("electron");
const { createMenubarApp } = require("./tray/menubar.cjs");

app.whenReady().then(async () => {
  await createMenubarApp();
});

app.on("window-all-closed", (e) => {});
