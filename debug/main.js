"use strict"

const path = require("path")
const {app, globalShortcut} = require("electron")

require("../app/init.js")(path.resolve(__dirname, "./index.html"), win => {
    // Easy way to reload and open dev tools.
    globalShortcut.register("CmdOrCtrl+R", () => {
        win.webContents.reloadIgnoringCache()
    })

    globalShortcut.register("CmdOrCtrl+Shift+R", () => {
        app.relaunch()
        app.exit(0)
    })

    win.webContents.openDevTools()

    globalShortcut.register("CmdOrCtrl+Shift+I", () => {
        win.webContents.toggleDevTools()
    })

    win.webContents.on("devtools-opened", () => {
        win.webContents.addWorkSpace(__dirname)
    })

    app.on("will-quit", () => {
        globalShortcut.unregister("CmdOrCtrl+R")
        globalShortcut.unregister("CmdOrCtrl+Shift+I")
    })
})
