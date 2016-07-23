"use strict"

const m = require("mithril")

exports.view = (_, {onclick, type, class: extra, text, symbol}) => {
    return m(`button.route-button.btn.btn-${type}`, {
        onclick,
        class: extra || "",
    }, [
        m("span.button-text", text),
        m("span.button-symbol", symbol),
    ])
}
