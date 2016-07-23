"use strict"

const path = require("path")
const autosize = require("autosize")
const m = require("mithril")
const model = require("../model.js")
const Page = require("./page.js")
const Loading = require("./loading.js")
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

function cancel(e) {
    e.preventDefault()
    e.stopPropagation()
}

const placeholder = path.resolve(__dirname, "../images/picture-placeholder.svg")

exports.controller = function () {
    this.name = m.prop("")
    this.path = m.prop("")
    this.desc = m.prop("")
    this.fileInput = m.prop()
    this.submit = cancel

    this.acceptFile = e => {
        cancel(e)
        this.path((e.dataTransfer || e.target).files[0].path)
    }

    const serialize = () => {
        return new model.Photo(
            this.path(), this.name(),
            makeShortDescription(this.desc()),
            this.desc())
    }

    const index = m.route.param("index")

    if (index == null) {
        this.loaded = true
        this.submit = e => {
            cancel(e)
            model.addPhoto(serialize())
            .then(() => m.route.set("/listing"))
        }
    } else {
        this.loaded = false
        model.photoAt(index).then(photo => {
            this.loaded = true
            this.name(photo.name)
            this.path(photo.path)
            this.desc(photo.longDescription)
            this.submit = e => {
                cancel(e)
                model.setPhotoAt(index, serialize())
                .then(() => m.route.set("/listing"))
            }
        })
    }
}

exports.view = ctrl => m(Page, !ctrl.loaded ? m(Loading) : m(".edit-page", [
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
                ondrag: cancel,
                ondragstart: cancel,
                ondragend: cancel,
                ondragover: cancel,
                ondragenter: cancel,
                ondragleave: cancel,
                ondrop: ctrl.acceptFile,
            }, [
                m("span.sr-only", "Image"),
                m("input[type=file][accepts=image/*].sr-only", {
                    onchange: ctrl.acceptFile,
                }),
                m("img", {src: ctrl.path() || placeholder}),
            ]),
        ]),

        m(".edit-description", [
            m("em", "Markdown is supported."),
            m("label", [
                m("span.sr-only", "Description"),
                m("textarea", {
                    oncreate: vnode => autosize(vnode.dom),
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
