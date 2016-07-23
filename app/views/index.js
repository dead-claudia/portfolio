"use strict"

const m = require("mithril")
const model = require("../model.js")
const Listing = require("./listing.js")
const Start = require("./start.js")
const Edit = require("./edit.js")
const Loading = require("./loading.js")

m.route.mode = "hash"

let loaded = false

model.hasStarted().then(started => {
    loaded = true
    if (started) m.route("/listing")
    else m.redraw()
})

const guard = Component => ({view: () => loaded ? m(Component) : m(Loading)})

m.route(document.getElementById("app"), "/start", {
    "/start": guard(Start),
    "/listing": guard(Listing),
    "/edit": guard(Edit),
})
