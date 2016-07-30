"use strict"

const path = require("path")
const t = require("thallium")
const Template = require("../../../templates/main/translate.js")
const TemplateFile = require("../../../templates/main/template-file.js")
const TemplateFolder = require("../../../templates/main/template-folder.js")

t.test("templates/main/translate", t => {
    t.test("default class Translate", t => {
        class File extends TemplateFile {
            constructor(path, isFile, contents) {
                super(path, isFile)
                this.contents = isFile ? `${contents}` : undefined
            }

            _read() {
                if (this.isFile) return this.contents
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

        t.async("read()", t => {
            const root = new Folder("/", {
                "template.yaml": `
                    name: My Awesome Template

                    scripts:
                        - util.js

                    assets:
                        - style.css
                        - script.js
                        - images/**/*.*
                        - static/jquery.js

                    pages:
                        index.html: template:index
                        about.html: template:about person = me
                `,

                "template.js": "",
            })

            const template = new Template(root)

            return template.read().then(() => {
                t.test("reads config correctly").match(template.config, {
                    name: "My Awesome Template",
                    scripts: ["util.js"],
                    assets: [
                        "style.css",
                        "script.js",
                        "images/**/*.*",
                        "static/jquery.js",
                    ],

                    pages: {
                        "index.html": "template:index",
                        "about.html": "template:about person = me",
                    },
                })
            })
        })

        t.async("simple load()", t => {
            const root = new Folder("/", {
                "template.yaml": `
                    name: My Awesome Template
                    index: template:index
                `,

                "template.js": "template()",
                "util.js": "util()",

                "style.css": "@charset 'utf-8'",
                "script.js": "!function(){'use strict'}()",
                "images": {
                    "logo.png": "png...",
                    "static": {"sprite.svg": "<svg></svg>"},
                    "noext-file": "contents",
                },

                "static": {
                    "jquery.js": "!function(){jQuery = $}()",
                    "bootstrap.js": "!function($){}(jQuery)",
                    "bootstrap.css": "@charset 'utf-8'",
                },
            })

            const template = new Template(root)

            return template.read()
            .then(() => Promise.all([
                template.load(),
                root.file("template.js"),
            ]))
            .then(([data, templateJs]) => {
                t.test("loads correct `main`").match(data.main, templateJs)
                t.test("loads correct `local`").match(data.local, [])
                t.test("loads correct `remote`").match(data.remote, [])
                t.test("loads correct `assets`").match(data.assets, [])
            })
        })

        t.async("complex load()", t => {
            /* eslint-disable max-len */

            const root = new Folder("/", {
                "template.yaml": `
                    name: My Awesome Template

                    scripts:
                        - util.js
                        - https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js

                    assets:
                        - style.css
                        - script.js
                        - images/**/*.*
                        - static/jquery.js
                        - https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css
                        - https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js

                    hashes:
                        https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js: sha384-Tc5IQib027qvyjSMfHjOMaLkfuWVxZxUPnCJA7l2mCWNIpG9mGCD8wGNIcPD7Txa

                    pages:
                        index.html: template:index
                        about.html: template:about person = me
                `,

                "template.js": "template()",
                "util.js": "util()",

                "style.css": "@charset 'utf-8'",
                "script.js": "!function(){'use strict'}()",
                "images": {
                    "logo.png": "png...",
                    "static": {"sprite.svg": "<svg></svg>"},
                    "noext-file": "contents",
                },

                "static": {
                    "jquery.js": "!function(){jQuery = $}()",
                    "bootstrap.js": "!function($){}(jQuery)",
                    "bootstrap.css": "@charset 'utf-8'",
                },
            })

            /* eslint-enable max-len */

            const template = new Template(root)

            return template.read()
            .then(() => Promise.all([
                template.load(),
                root.file("template.js"),
                root.file("util.js"),
                root.file("style.css"),
                root.file("script.js"),
                root.file("images", "logo.png"),
                root.file("images", "static", "sprite.svg"),
                root.folder("static", "jquery.js"),
            ]))
            .then(([
                data,
                templateJs, util,
                style, script, logo, sprite, jQuery,
            ]) => {
                t.test("loads correct `main`").match(data.main, templateJs)
                t.test("loads correct `local`").match(data.local, [util])
                t.test("loads correct `remote`").match(data.remote, [
                    "https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js",
                ])
                t.testSkip("loads correct `assets`").match(data.assets, [
                    style, script, logo, sprite, jQuery,
                ])
            })
        })
    })
})
