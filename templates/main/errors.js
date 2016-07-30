"use strict"

exports.MissingFile = class MissingFile extends Error {
    constructor(file, source) {
        super(`'${file}' file missing in template at '${source}'`)
        this.file = file
        this.source = source
    }
}

exports.ConfigError = class ConfigError extends Error {
    constructor(reason) {
        super(`Error in processing template: ${reason}`)
        this.reason = reason
    }
}
