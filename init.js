"use strict"

const {app, BrowserWindow} = require("electron")
const first = process.defaultApp ? 0 : 1
const args = require("minimist")(process.argv.slice(first + 1), {
    boolean: ["help"],
    string: ["cwd"],
    alias: {h: "help"},
})

module.exports = (url, init) => {
    if (args.help) {
        console.log(`Portfolio

-h, --help
    Show this help prompt

--cwd [directory]
    Run this as if it were run in \`directory\`.`)
        process.exit() // eslint-disable-line no-process-exit
    }

    let win

    function createWindow() {
        win = new BrowserWindow({title: "Portfolio"})
        win.loadURL(`file://${url}`)
        win.on("closed", () => win = undefined)
        win.setMenu(null)
        win.maximize()
        if (init != null) init(win)
    }

    app.on("ready", createWindow)
    app.on("activate", () => {
        if (win == null) createWindow()
    })
}
