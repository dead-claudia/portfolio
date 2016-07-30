"use strict"

const t = require("thallium")
const path = require("path").posix
const TemplateFile = require("../../../templates/main/template-file.js")
const TemplateFolder = require("../../../templates/main/template-folder.js")

t.test("template/main/template-folder", t => {
    t.test("default class TemplateFolder", t => {
        {
            const folder = new TemplateFolder("/")

            t.test("has `path`").hasOwn(folder, "path", "/")

            t.test("has abstract `_file()`", t => {
                t.throws(() => folder._file(), ReferenceError)
            })

            t.test("has abstract `_folder()`", t => {
                t.throws(() => folder._folder(), ReferenceError)
            })

            t.test("has abstract `_iterate()`", t => {
                t.throws(() => folder._iterate(), ReferenceError)
            })
        }

        class File extends TemplateFile {
            _read() {
                if (this.isFile) return "contents"
                throw Object.assign(
                    new Error("EISDIR: illegal operation on a directory, read"),
                    {
                        errno: -21,
                        code: "EISDIR",
                        syscall: "read",
                    })
            }
        }

        class Folder extends TemplateFolder {
            constructor(path, tree) {
                super(path)
                this.tree = tree
            }

            _file(name) {
                const entry = this.tree[name]

                if (entry == null) return null

                if (typeof entry === "object") {
                    return new File(path.resolve(this.path, name), false)
                }

                return new File(path.resolve(this.path, name), true, entry)
            }

            _folder(name) {
                const entry = this.tree[name]

                if (entry == null) return null
                if (typeof entry !== "object") return null

                return new Folder(path.resolve(this.path, name), entry)
            }

            _iterate(callback) {
                return Object.keys(this.tree).reduce(
                    (p, file) => p.then(() => callback(file)),
                    Promise.resolve())
            }
        }

        const folder = new Folder("/", {
            "foo.js": "",
            "directory": {"foo.js": ""},
            "home": {
                bob: {
                    scripts: {
                        "nested-foo.js": "",
                        "dependencies": {},
                    },
                },
            },
        })

        t.test("file()", t => {
            function test(name, {args, file}) {
                t.async(`${name} (as array)`, function *(t) {
                    t.match(yield folder.file(args), file)
                })

                t.async(`${name} (as arguments)`, function *(t) {
                    t.match(yield folder.file(...args), file)
                })
            }

            test("top-level file", {
                args: ["foo.js"],
                file: new File("/foo.js", true),
            })

            test("top-level directory", {
                args: ["directory"],
                file: new File("/directory", false),
            })

            test("top-level missing", {
                args: ["missing"],
                file: null,
            })

            test("second-level file", {
                args: ["directory", "foo.js"],
                file: new File("/directory/foo.js", true),
            })

            test("second-level directory", {
                args: ["home", "bob"],
                file: new File("/home/bob", false),
            })

            test("second-level missing", {
                args: ["home", "missing"],
                file: null,
            })

            test("second-level all missing", {
                args: ["missing", "missing"],
                file: null,
            })

            test("many-level file", {
                args: ["home", "bob", "scripts", "nested-foo.js"],
                file: new File("/home/bob/scripts/nested-foo.js", true),
            })

            test("many-level directory", {
                args: ["home", "bob", "scripts", "dependencies"],
                file: new File("/home/bob/scripts/dependencies", false),
            })

            test("many-level missing", {
                args: ["home", "bob", "scripts", "missing"],
                file: null,
            })

            test("many-level all missing", {
                args: ["missing", "missing", "missing", "missing"],
                file: null,
            })
        })

        t.test("folder()", t => {
            function test(name, {args, file}) {
                t.async(`${name} (as array)`, function *(t) {
                    t.match(yield folder.folder(args), file)
                })

                t.async(`${name} (as arguments)`, function *(t) {
                    t.match(yield folder.folder(...args), file)
                })
            }

            test("top-level file", {
                args: ["foo.js"],
                file: null,
            })

            test("top-level directory", {
                args: ["directory"],
                file: new Folder("/directory", {"foo.js": ""}),
            })

            test("top-level missing", {
                args: ["missing"],
                file: null,
            })

            test("second-level file", {
                args: ["directory", "foo.js"],
                file: null,
            })

            test("second-level directory", {
                args: ["home", "bob"],
                file: new Folder("/home/bob", {
                    scripts: {
                        "nested-foo.js": "",
                        "dependencies": {},
                    },
                }),
            })

            test("second-level missing", {
                args: ["home", "missing"],
                file: null,
            })

            test("second-level all missing", {
                args: ["missing", "missing"],
                file: null,
            })

            test("many-level file", {
                args: ["home", "bob", "scripts", "nested-foo.js"],
                file: null,
            })

            test("many-level directory", {
                args: ["home", "bob", "scripts", "dependencies"],
                file: new Folder("/home/bob/scripts/dependencies", {}),
            })

            test("many-level missing", {
                args: ["home", "bob", "scripts", "missing"],
                file: null,
            })

            test("many-level all missing", {
                args: ["missing", "missing", "missing", "missing"],
                file: null,
            })
        })

        t.test("iterate()", t => {
            function test(name, {path, listing}) {
                const child = path.length ? folder.folder(path) : folder

                t.async(`${name} (returns raw)`, function *(t) {
                    const items = []

                    yield (yield child).iterate(file => { items.push(file) })
                    t.match(items, listing)
                })

                t.async(`${name} (returns promise)`, function *(t) {
                    const items = []

                    yield (yield child).iterate(file => {
                        items.push(file)
                        return Promise.resolve()
                    })
                    t.match(items, listing)
                })
            }

            test("top-level", {
                path: [],
                listing: ["foo.js", "directory", "home"],
            })

            test("second-level single file", {
                path: ["directory"],
                listing: ["foo.js"],
            })

            test("second-level single directory", {
                path: ["home"],
                listing: ["bob"],
            })

            test("many-level single directory", {
                path: ["home", "bob", "scripts"],
                listing: ["nested-foo.js", "dependencies"],
            })
        })
    })
})
