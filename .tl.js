"use strict"

const t = require("thallium")

t.reporter(require("thallium/r/spec")())

// TODO: fix this in Thallium
exports.files = "test/**"
