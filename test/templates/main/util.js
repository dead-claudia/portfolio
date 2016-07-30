"use strict"

const t = require("thallium")
const util = require("../../../templates/main/util.js")

t.test("templates/main/util", t => {
    t.test("isLink()", t => {
        t.test("with HTTP URLs", t => {
            t.true(util.isLink("http://code.jquery.com/jquery.min.js"))
        })

        t.test("with HTTPS URLs", t => {
            t.true(util.isLink("https://code.jquery.com/jquery.min.js"))
        })

        t.test("with absolute Windows files", t => {
            t.false(util.isLink("C:\\Users\\Administrator\\file.jpg"))
        })

        t.test("with absolute Windows files + forward slashes", t => {
            t.false(util.isLink("C:/Users/Administrator/file.jpg"))
        })

        t.test("with absolute *nix files", t => {
            t.false(util.isLink("/home/user/Documents/file.jpg"))
        })

        t.test("with absolute *nix files + backslashes", t => {
            t.false(util.isLink("\\home\\user\\Documents\\file.jpg"))
        })
    })

    t.test("getParts()", t => {
        t.test("with Windows roots", t => {
            t.match(util.getParts("C:\\"), ["C:"])
        })

        t.test("with Windows roots + forward slashes", t => {
            t.match(util.getParts("C:\\"), ["C:"])
        })

        t.test("with *nix roots", t => {
            t.match(util.getParts("/"), [""])
        })

        t.test("with *nix roots + backslashes", t => {
            t.match(util.getParts("\\"), [""])
        })

        t.test("with absolute Windows files", t => {
            t.match(util.getParts("C:\\Users\\Administrator\\file.jpg"),
                ["C:", "Users", "Administrator", "file.jpg"])
        })

        t.test("with absolute Windows files using slashes", t => {
            t.match(util.getParts("C:/Users/Administrator/file.jpg"),
                ["C:", "Users", "Administrator", "file.jpg"])
        })

        t.test("with absolute *nix files using slashes", t => {
            t.match(util.getParts("/home/user/Documents/file.jpg"),
                ["", "home", "user", "Documents", "file.jpg"])
        })
    })

    t.test("attempt()", t => {
        t.async("works with sync returns", t => {
            return util.attempt(() => 1).then(res => t.equal(res, 1))
        })

        t.async("works with sync thrown errors", t => {
            const err = new Error("test")

            return util.attempt(() => { throw err }).then(
                () => t.fail("Expected a rejection"),
                e => t.equal(e, err))
        })

        t.async("works with resolved promises", t => {
            return util.attempt(() => Promise.resolve(1))
            .then(res => t.equal(res, 1))
        })

        t.async("works with rejected promises", t => {
            const err = new Error("test")

            return util.attempt(() => Promise.reject(err)).then(
                () => t.fail("Expected a rejection"),
                e => t.equal(e, err))
        })
    })
})
