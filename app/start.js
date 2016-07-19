"use strict"

const m = require("mithril")
const RouteButton = require("./route-button.js")
const Symbols = require("./symbols.js")
const model = require("./model.js")

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
            onclick: () => {
                model.start()
                m.route("/home")
            },
        }),
    ]),
])
