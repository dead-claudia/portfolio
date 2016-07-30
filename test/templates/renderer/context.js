"use strict"

/* eslint max-nested-callbacks: [2, 5] */

const t = require("thallium")
const Context = require("../../../templates/renderer/context.js")
const path = require("path")

t.test("templates/renderer/context", t => {
    t.test("default class Context", t => {
        function create() {
            return new Context("/root", [
                "/main.js",
                "/scripts/local.js",
                "/scripts/other.js",
            ], ["https://remote.com/script.js"])
        }

        t.test("properties are correct", t => {
            t.match(create(), {
                root: "/root",
                local: [
                    "/main.js",
                    "/scripts/local.js",
                    "/scripts/other.js",
                ],
                remote: ["https://remote.com/script.js"],
                stack: [],
                dirnames: ["/"],
            })
        })

        t.test("push() and pop() works", t => {
            const context = create()

            context.push("/scripts/local.js")

            t.hasMatchKeys(context, {
                stack: ["/scripts/local.js"],
                dirnames: ["/", "/scripts"],
            })

            context.push("/scripts/other.js")

            t.hasMatchKeys(context, {
                stack: ["/scripts/local.js", "/scripts/other.js"],
                dirnames: ["/", "/scripts", "/scripts"],
            })

            context.pop()

            t.hasMatchKeys(context, {
                stack: ["/scripts/local.js"],
                dirnames: ["/", "/scripts"],
            })

            context.pop()

            t.hasMatchKeys(context, {
                stack: [],
                dirnames: ["/"],
            })
        })

        t.test("isLocal()", t => {
            const context = create()

            t.test("returns true for known locals")
            .true(context.isLocal("/scripts/local.js"))

            t.test("returns false for known remotes")
            .false(context.isLocal("https://remote.com/script.js"))

            t.test("returns false for unknown locals")
            .false(context.isLocal("/why/is/this/not/working.js"))

            t.test("returns false for unknown remotes")
            .false(context.isLocal("https://remote.com/unknown.js"))
        })

        t.test("isRemote()", t => {
            const context = create()

            t.test("returns false for known locals")
            .false(context.isRemote("/scripts/local.js"))

            t.test("returns true for known remotes")
            .true(context.isRemote("https://remote.com/script.js"))

            t.test("returns false for unknown locals")
            .false(context.isRemote("/why/is/this/not/working.js"))

            t.test("returns false for unknown remotes")
            .false(context.isRemote("https://remote.com/unknown.js"))
        })

        t.test("normalize()", t => {
            t.test("returns the resolved file if not circular", t => {
                const context = create()

                context.push("/scripts/local.js")
                context.push("/scripts/other.js")

                const [resolve, root] = [path.resolve, context.root]

                path.resolve = path.posix.resolve
                context.root = "/root"

                try {
                    t.equal(context.normalize("../main.js"), "/main.js")
                } finally {
                    [path.resolve, context.root] = [resolve, root]
                }
            })

            t.test("throws an error if the resolved file is circular", t => {
                const context = create()

                context.push("/main.js")
                context.push("/scripts/local.js")
                context.push("/scripts/other.js")

                t.throws(() => context.normalize("../main.js"), Error)
                t.throws(() => context.normalize("./local.js"), Error)
            })

            t.test("is immune to directory traversal attacks", t => {
                const context = create()

                t.equal(context.normalize("../../../../../main.js"), "/main.js")
            })
        })

        t.test("resolve()", t => {
            t.test("returns the resolved Windows file", t => {
                const context = create()
                const [resolve, root] = [path.resolve, context.root]

                path.resolve = path.win32.resolve
                context.root = "C:\\root"

                try {
                    t.equal(context.resolve("/main.js"), "C:\\root\\main.js")
                } finally {
                    [path.resolve, context.root] = [resolve, root]
                }
            })

            t.test("returns the resolved POSIX file if not circular", t => {
                const context = create()
                const [resolve, root] = [path.resolve, context.root]

                path.resolve = path.posix.resolve
                context.root = "/root"

                try {
                    t.equal(context.resolve("/main.js"), "/root/main.js")
                } finally {
                    [path.resolve, context.root] = [resolve, root]
                }
            })
        })
    })
})
