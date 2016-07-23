"use strict"

/* eslint-env browser */

// So Stylus files are watched and recompiled correctly.

const fs = require("fs")
const path = require("path")
const chokidar = require("chokidar")
const stylus = require("stylus")
const autoprefixer = require("autoprefixer-stylus")
const style = path.resolve(__dirname, "../app/styles/index.styl")
const el = document.createElement("style")

function compile(message) {
    if (message != null) console.log(message)

    const source = fs.readFileSync(style, "utf-8")

    el.innerHTML = stylus(source)
        .set("filename", style)
        .use(autoprefixer())
        .render()
}

// Don't create reflows *yet*.
compile()
document.head.appendChild(el)

chokidar.watch(path.resolve(__dirname, "../**/*.styl"), {
    atomic: true,
    ignored: [path.resolve(__dirname, "../node_modules/**/*.*")],
})
.on("ready", () => console.log("Initial scan completed"))
.on("add", file => compile(`File added: ${file}`))
.on("change", file => compile(`File changed: ${file}`))
.on("unlink", file => compile(`File deleted: ${file}`))
