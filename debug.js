"use strict"

const path = require("path")
const {app, globalShortcut} = require("electron")

require("./init.js")(path.resolve(__dirname, "./debug.html"), win => {
    // Easy way to reload and open dev tools.
    globalShortcut.register("CmdOrCtrl+R", () => win.reload())

    win.webContents.openDevTools()

    globalShortcut.register("CmdOrCtrl+Shift+J", () => {
        win.webContents.toggleDevTools()
    })

    win.webContents.on("devtools-opened", () => {
        win.webContents.addWorkSpace(__dirname)
    })

    app.on("will-quit", () => {
        globalShortcut.unregister("CmdOrCtrl+R")
        globalShortcut.unregister("CmdOrCtrl+Shift+J")
    })
})
