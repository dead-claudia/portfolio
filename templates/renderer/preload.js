"use strict"

/* eslint-env browser */

const vm = require("vm")
const fs = require("fs")
const path = require("path")
const {ipcRenderer} = require("electron")

const Page = require("./page.js")
const Context = require("./context.js")
const Loader = require("./loader.js")
const IterStream = require("./iter-stream.js")

function resolve(file) {
    return path.resolve(__dirname, file)
}

function loadScript(file, name) {
    return new Promise((resolve, reject) => {
        return fs.readFile(file, "utf-8", (err, data) =>
            err != null ? reject(err) : resolve(data))
    })
    .then(data => {
        vm.runInThisContext(data, {
            filename: name,
            displayErrors: true,
        })
    })
}

Promise.all([
    new Promise(resolve => {
        ipcRenderer.send("template.context.get")
        ipcRenderer.on("template.context.get", (_, args) => resolve(args))
    }),
    loadScript(
        resolve("../../node_modules/mithril/mithril.min.js"),
        "assets/mithril/mithril.min.js"),
    loadScript(
        resolve("../../node_modules/mithril/mithril.min.js"),
        "assets/simple-require-loader/combined.min.js"),
])
.then(([args]) => {
    const {root, local, remote, main} = args
    const context = new Context(root, local, remote)
    const loader = new Loader(context, document)
    const page = new Page()

    // Routing is disabled, as the app takes care of that itself.
    delete window.m.route

    window.page = Object.freeze({
        renderingToStatic() {
            return page.renderingToStatic()
        },

        wrapper(f) {
            page.wrapper(f)
        },

        add(page, component) {
            page.add(page, component)
        },

        load(file) {
            loader.load(file)
        },

        loadAll() {
            loader.loadAll()
        },

        loadAsync(file) {
            return loader.loadAsync(file)
        },
    })

    return loadScript(main, "/template.js")
})
