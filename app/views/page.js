"use strict"

const m = require("mithril")
const RouteButton = require("./route-button.js")
const Symbols = require("./symbols.js")

// only enable the button if and only if we're on the correct route.
const button = (route, type, text, symbol) =>
    m.route() === route ? m(RouteButton, {
        type, text, symbol,
        class: "navbar-btn",
    }) : m(RouteButton, {
        type, text, symbol,
        class: "navbar-btn",
        onclick: () => m.route(route),
    })

exports.view = (_, children) => m(".base-page", [
    m(".base-header", [
        m("nav.navbar.navbar-default.navbar-fixed-top", m(".container-fluid", [
            m(".navbar-header", [
                m.route().startsWith("/listing")
                    ? m("a.navbar-brand", "Portfolio")
                    : m("a.navbar-brand", {
                        href: "/listing",
                        config: m.route,
                    }, "Portfolio"),
            ]),
            m(".navbar-collapse.collapse", [
                button("/edit", "success", "Add", Symbols.Plus),
                button("/preview", "primary", "Preview", Symbols.Arrow),
                button("/manage", "warning", "Manage", Symbols.Gear),
                button("/help", "info", "Help", Symbols.Info),
            ]),
        ])),
    ]),
    m(".base-content", [
        m(".base-body", [children]),
        m(".base-push"),
    ]),
    m(".base-footer", [
        "App by ", m("a[href=http://www.isiahmeadows.com]", "Isiah Meadows"),
    ]),
])
