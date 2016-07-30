"use strict"

const model = require("../model.js")
const m = require("mithril")
const Page = require("./page.js")
const Loading = require("./loading.js")

let photos

model.getPhotos().then(listing => photos = listing)

exports.view = () => m(Page, m(".listing-page", [
    photos == null ? m(Loading) : photos.map((photo, i) => m(".listing-item", {
        onclick: () => m.route(`/edit?index=${i}`),
    }, [
        m("img", {src: photo.path}),
        m("h2", photo.name),
        m("p", photo.shortDescription),
    ])),
]))
