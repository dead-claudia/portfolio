"use strict"

/**
 * The page manager.
 */

const render = require("./render.js")

module.exports = class Page {
    constructor() {
        this._rendering = false
        this._wrapper = undefined
        this._pages = Object.create(null)
    }

    renderingToStatic() {
        return this._rendering
    }

    add(page, component) {
        this._pages[page] = component
    }

    list() {
        return Object.keys(this._pages)
    }

    get(page) {
        return this._pages[page]
    }

    wrapper(f) {
        this._wrapper = f
    }

    render(page) {
        this._rendering = true

        const component = (0, this._wrapper)(page, this._pages[page])

        return render(component)
    }
}
