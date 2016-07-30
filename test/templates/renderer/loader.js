"use strict"

const path = require("path")
const t = require("thallium")
const proxyquire = require("proxyquire")

t.test("templates/renderer/loader", t => {
    function getLoader(files = {}, runInThisContext) {
        function notFoundError(path) {
            const err = new Error(
                `ENOENT: no such file or directory, open '${path}'`)

            err.errno = -2
            err.code = "ENOENT"
            err.syscall = "open"
            err.path = path
            return err
        }

        function isDirectoryError() {
            const err = new Error(
                "EISDIR: illegal operation on a directory, read")

            err.errno = -21
            err.code = "EISDIR"
            err.syscall = "read"
            return err
        }

        const Context = proxyquire("../../../templates/renderer/context.js", {
            path: path.posix,
        })

        const Loader = proxyquire("../../../templates/renderer/loader.js", {
            fs: {
                readFile(file, _, callback) {
                    if (files[file] != null) {
                        process.nextTick(callback, undefined, files[file])
                    } else if (file !== "/scripts") {
                        process.nextTick(callback, notFoundError(file))
                    } else {
                        process.nextTick(callback, isDirectoryError())
                    }
                },

                readFileSync(file) {
                    if (files[file] != null) {
                        return files[file]
                    } else if (file !== "/scripts") {
                        throw notFoundError(file)
                    } else {
                        throw isDirectoryError()
                    }
                },
            },

            vm: {runInThisContext},
        })

        const context = new Context("/root", [
            "/main.js",
            "/scripts/local.js",
            "/scripts/other.js",
        ], ["https://remote.com/script.js"])

        const scripts = []
        const head = {
            appendChild(el) { scripts.push({add: Object.assign({}, el)}) },
            removeChild(el) { scripts.push({remove: Object.assign({}, el)}) },
        }
        const createElement = type => ({type})
        const document = {scripts, head, createElement}
        const loader = new Loader(document, context)

        return {loader, document, context}
    }

    t.test("default class Loader", t => {
        t.test("has correct properties", t => {
            const {loader, document, context} = getLoader()

            t.hasKeys(loader, {document, context})
        })

        t.test("load()", t => {
            t.test("loads known local file synchronously", t => {
                let loaded, file
                const {loader} = getLoader({
                    "/root/main.js": "contents",
                }, (data, {filename}) => [loaded, file] = [data, filename])

                t.undefined(loader.load("main.js"))
                t.equal(loaded, "contents")
                t.equal(file, "/main.js")
            })

            t.test("fails to load unknown local file synchronously", t => {
                const {loader} = getLoader()

                t.throws(() => loader.load("/unknown.js"), Error)
            })

            t.test("fails to load known remote file synchronously", t => {
                const {loader} = getLoader()

                t.throws(() => loader.load("https://remote.com/script.js"),
                    Error)
            })

            t.test("fails to load unknown remote file synchronously", t => {
                const {loader} = getLoader()

                t.throws(() => loader.load("https://remote.com/unknown.js"),
                    Error)
            })

            t.test("is immune to directory traversal attacks", t => {
                let loaded, file
                const {loader} = getLoader({
                    "/root/main.js": "contents",
                }, (data, {filename}) => [loaded, file] = [data, filename])

                t.undefined(loader.load("../../../../../../../../main.js"))
                t.equal(loaded, "contents")
                t.equal(file, "/main.js")
            })
        })

        t.test("loadAsync()", t => {
            t.async("loads known local file asynchronously", t => {
                let loaded, file
                const {loader} = getLoader({
                    "/root/main.js": "contents",
                }, (data, {filename}) => [loaded, file] = [data, filename])

                return loader.loadAsync("/main.js").then(res => {
                    t.undefined(res)
                    t.equal(loaded, "contents")
                    t.equal(file, "/main.js")
                })
            })

            t.test("fails to load unknown local file asynchronously", t => {
                const {loader} = getLoader()

                t.throws(() => loader.loadAsync("/unknown.js"), Error)
            })

            t.async("loads known remote file asynchronously", t => {
                const {loader, document} = getLoader()
                const ev = {
                    preventDefault() {},
                    stopPropagation() {},
                }

                const p = loader.loadAsync("https://remote.com/script.js")
                .then(res => {
                    t.equal(res, undefined)

                    const add = []
                    const remove = []

                    for (const item of document.scripts) {
                        if (item.add) add.push(item.add)
                        if (item.remove) remove.push(item.remove)
                    }

                    t.length(add, 3)
                    t.length(remove, 3)

                    t.equal(add[0].type, "script")
                    t.equal(add[1].type, "script")
                    t.equal(add[1].src, "https://remote.com/script.js")
                    t.equal(add[2].type, "script")

                    t.equal(remove[0].type, "script")
                    t.equal(remove[1].type, "script")
                    t.equal(remove[1].src, "https://remote.com/script.js")
                    t.equal(remove[2].type, "script")
                })

                const add = []
                const remove = []

                for (const item of document.scripts) {
                    if (item.add) add.push(item.add)
                    if (item.remove) remove.push(item.remove)
                }

                t.length(add, 3)
                t.length(remove, 0)

                t.equal(add[0].type, "script")
                t.equal(add[1].type, "script")
                t.equal(add[1].src, "https://remote.com/script.js")
                t.equal(add[2].type, "script")

                add[0].onload(ev)
                add[1].onload(ev)
                add[2].onload(ev)

                return p
            })

            t.async("rejects on network error for remote loading", t => {
                const {loader, document} = getLoader()
                const ev = {
                    preventDefault() {},
                    stopPropagation() {},
                }

                const p = loader.loadAsync("https://remote.com/script.js")
                .then(() => t.fail("Expected a rejection"), res => {
                    t.equal(res, ev)

                    const add = []
                    const remove = []

                    for (const item of document.scripts) {
                        if (item.add) add.push(item.add)
                        if (item.remove) remove.push(item.remove)
                    }

                    t.length(add, 3)
                    t.length(remove, 3)

                    t.equal(add[0].type, "script")
                    t.equal(add[1].type, "script")
                    t.equal(add[1].src, "https://remote.com/script.js")
                    t.equal(add[2].type, "script")

                    t.equal(remove[0].type, "script")
                    t.equal(remove[1].type, "script")
                    t.equal(remove[1].src, "https://remote.com/script.js")
                    t.equal(remove[2].type, "script")
                })

                const add = []
                const remove = []

                for (const item of document.scripts) {
                    if (item.add) add.push(item.add)
                    if (item.remove) remove.push(item.remove)
                }

                t.length(add, 3)
                t.length(remove, 0)

                t.equal(add[0].type, "script")
                t.equal(add[1].type, "script")
                t.equal(add[1].src, "https://remote.com/script.js")
                t.equal(add[2].type, "script")

                add[0].onload(ev)
                add[1].onerror(ev)
                add[2].onload(ev)

                return p
            })

            t.test("fails to load unknown remote file synchronously", t => {
                const {loader} = getLoader()

                t.throws(
                    () => loader.loadAsync("https://remote.com/unknown.js"),
                    Error)
            })

            t.async("is immune to directory traversal attacks", t => {
                let loaded, file
                const {loader} = getLoader({
                    "/root/main.js": "contents",
                }, (data, {filename}) => [loaded, file] = [data, filename])

                return loader.loadAsync("../../../../../../../../main.js")
                .then(res => {
                    t.undefined(res)
                    t.equal(loaded, "contents")
                    t.equal(file, "/main.js")
                })
            })
        })

        t.test("loadAll()", t => {
            t.test("works", t => {
                const args = []
                const {loader} = getLoader({
                    "/root/main.js": "contents 1",
                    "/root/scripts/local.js": "contents 2",
                    "/root/scripts/other.js": "contents 3",
                }, (data, {filename}) => args.push({data, filename}))

                loader.loadAll()
                t.match(args, [
                    {filename: "/main.js", data: "contents 1"},
                    {filename: "/scripts/local.js", data: "contents 2"},
                    {filename: "/scripts/other.js", data: "contents 3"},
                ])
            })
        })
    })
})
