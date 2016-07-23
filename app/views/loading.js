"use strict"

const m = require("mithril")

exports.view = () => m(".loading-box", m(".loading-wrapper", [
    m(".loading-text", "Loading"),
    m(".loading-spinner", [
        m(".loading-circle.loading-circle-0"),
        m(".loading-circle.loading-circle-1"),
        m(".loading-circle.loading-circle-2"),
        m(".loading-circle.loading-circle-3"),
        m(".loading-circle.loading-circle-4"),
        m(".loading-circle.loading-circle-5"),
        m(".loading-circle.loading-circle-6"),
        m(".loading-circle.loading-circle-7"),
    ]),
]))
