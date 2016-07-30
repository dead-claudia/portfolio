"use strict"

const t = require("thallium")
const Page = require("../../../templates/renderer/page.js")
// const m = require("mithril")

t.test("templates/renderer/page", t => {
    t.test("default class Page", t => {
        const page = new Page()

        t.test("initial state is correct").match(page, {
            _rendering: false,
            _wrapper: undefined,
            _mapping: {},
        })

        t.test("starts out not rendering").false(page.renderingToStatic())

        t.test("wrapper()", t => {
            const page = new Page()
            const callback = () => {}

            page.wrapper(callback)

            t.match(page, {
                _rendering: false,
                _wrapper: callback,
                _mapping: {},
            })
        })
    })
})
