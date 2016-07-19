"use strict"

const autosize = require("autosize")
const m = require("mithril")
const Page = require("./page.js")
const model = require("./model.js")
const RouteButton = require("./route-button.js")
const Symbols = require("./symbols.js")

// Max characters for short description
const shortDescriptionLimit = 400

function makeShortDescription(str) {
    str = str.trim()

    if (str.length <= shortDescriptionLimit) return str

    // Totally naïve here...
    const last = str[shortDescriptionLimit]
    const sliced = str.slice(0, shortDescriptionLimit)

    if (/^\s$/.test(last) || /\s$/.test(sliced)) return sliced.trim()
    return sliced.slice(0, /\w+$/.exec(sliced)[0].length)
}

exports.controller = function () {
    const index = m.route.param("index")
    const existing = index != null ? model.photos[index] : undefined

    this.isNew = existing == null
    this.name = m.prop(this.isNew ? "" : existing.name)
    this.path = m.prop(this.isNew ? "" : existing.path)
    this.desc = m.prop(this.isNew ? "" : existing.longDescription)
    this.fileInput = m.prop()

    this.submit = e => {
        e.preventDefault()
        e.stopPropagation()

        const replacement = {
            path: this.path(),
            name: this.name(),
            shortDescription: makeShortDescription(this.desc()),
            longDescription: this.desc(),
        }

        if (this.isNew) {
            model.photos.push(replacement)
        } else {
            model.photos[index] = replacement
        }

        m.route("/listing")
    }

    this.cancel = e => {
        e.preventDefault()
        e.stopPropagation()
    }

    this.acceptFile = e => {
        e.preventDefault()
        e.stopPropagation()
        this.path((e.dataTransfer || e.target).files[0].path)
    }
}

exports.view = ctrl => m(Page, m(".edit-page", [
    // It's not really submittable, anyways.
    m("form", {onsubmit: ctrl.submit}, [
        m("label.edit-title", [
            m("span.sr-only", "Title"),
            m("input[type=text][autocomplete=off]", {
                placeholder: "Some awesome picture",
                onchange: m.withAttr("value", ctrl.name),
                value: ctrl.name(),
            }),
        ]),

        m(".edit-file-upload", [
            m("label", {
                ondrag: ctrl.cancel,
                dragstart: ctrl.cancel,
                dragend: ctrl.cancel,
                dragover: ctrl.cancel,
                dragenter: ctrl.cancel,
                dragleave: ctrl.cancel,
                drop: ctrl.acceptFile,
            }, [
                m("span.sr-only", "Image"),
                m("input[type=file][accepts=image/*].sr-only", {
                    onchange: ctrl.acceptFile,
                }),
                m("img", {src: ctrl.path() || "images/picture-icon.svg"}),
            ]),
        ]),

        m(".edit-description", [
            m("em", "Markdown is supported."),
            m("label", [
                m("span.sr-only", "Description"),
                m("textarea", {
                    config: (el, isInit) => isInit || autosize(el),
                    placeholder: "And this is why it's awesome...",
                    oninput: m.withAttr("value", ctrl.desc),
                    value: ctrl.desc(),
                }),
            ]),
        ]),

        m(".edit-save", m(RouteButton, {
            // Brittle hack...
            type: "success[type=submit]",
            text: "Save",
            symbol: Symbols.Check,
        })),
    ]),
]))
