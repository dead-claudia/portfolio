"use strict"

const m = require("mithril")
const Page = require("./page.js")
const model = require("./model.js")

exports.view = () => m(Page, m(".listing-page", m(".listing-wrapper", [
    model.photos.map((photo, i) => m(".listing-item", {
        onclick: () => m.route(`/edit?index=${i}`),
    }, [
        m("img", {src: photo.path}),
        m("h2", photo.name),
        m("p", photo.shortDescription),
    ])),
])))
