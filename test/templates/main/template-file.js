"use strict"

const t = require("thallium")
const TemplateFile = require("../../../templates/main/template-file.js")

t.test("template/main/template-file", t => {
    t.test("default class TemplateFile", t => {
        const file = new TemplateFile("/foo.js", true)

        t.test("has `path`").hasOwn(file, "path", "/foo.js")
        t.test("has `isFile`").hasOwn(file, "isFile", true)

        t.test("has an abstract `_read()`", t => {
            t.throws(() => file._read(), ReferenceError)
        })

        t.test("read()", t => {
            class File extends TemplateFile {
                constructor(name, buffer) {
                    super(name, true)
                    this.buffer = buffer
                }
                _read() { return this.buffer }
            }

            t.async("works with sync _read()", t => {
                const file = new File("/foo.js", Buffer.from("foo"))
                const promise = file.read()

                t.instanceof(promise, Promise)
                return promise.then(buf => t.match(buf, Buffer.from("foo")))
            })

            t.async("works with async _read()", t => {
                const read = Promise.resolve(Buffer.from("foo"))
                const file = new File("/foo.js", read)
                const promise = file.read()

                t.instanceof(promise, Promise)
                return promise.then(buf => t.match(buf, Buffer.from("foo")))
            })
        })
    })
})
