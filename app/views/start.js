"use strict"

const m = require("mithril")
const model = require("../model.js")
const RouteButton = require("./route-button.js")
const Symbols = require("./symbols.js")

exports.view = () => m(".start-page", [
    m(".start-wrapper", [
        m("h1.start-title", "Portfolio"),
        m("p.start-desc", [
            "A simple, easy-to-use portfolio manager for amateur designers ",
            "like you!",
        ]),
        m(RouteButton, {
            type: "success",
            text: "Get Started",
            class: "btn-lg",
            symbol: Symbols.Plus,
            onclick: () => model.setStarted().then(() => m.route.set("/home")),
        }),
    ]),
])
