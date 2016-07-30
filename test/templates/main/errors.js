"use strict"

const t = require("thallium")
const errors = require("../../../templates/main/errors.js")

t.test("template/main/errors", t => {
    t.test("class MissingFile", t => {
        const err = new errors.MissingFile("foo.js", "/foo/bar.zip")

        t.test("is an error").instanceof(err, Error)
        t.test("has correct keys").hasKeys(err, {
            file: "foo.js",
            source: "/foo/bar.zip",
        })
    })

    t.test("class MissingFile", t => {
        const err = new errors.ConfigError("foo didn't foo right")

        t.test("is an error").instanceof(err, Error)
        t.test("has correct keys").hasKeys(err, {
            reason: "foo didn't foo right",
        })
    })
})
