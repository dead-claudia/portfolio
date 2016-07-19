"use strict"

const m = require("mithril")
const model = require("./model.js")
const Listing = require("./listing.js")
const Start = require("./start.js")
const Edit = require("./edit.js")

m.route.mode = "hash"

function rewire(component) {
    return {
        controller: class {
            constructor() {
                if (!model.started()) m.route("/start")
            }
        },
        view: () => m(component),
    }
}

m.route(document.getElementById("app"), "/edit", {
    "/start": Start,
    "/listing": rewire(Listing),
    "/edit": rewire(Edit),
})
