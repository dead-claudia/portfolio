"use strict"

const {abstract, attempt} = require("./util.js")

/**
 * @abstract
 * A file in a template.
 *
 * - `path` is the absolute path to the file.
 * - `isFile` is whether this is a normal file.
 */
module.exports = class TemplateFile {
    constructor(path, isFile) {
        this.path = path
        this.isFile = isFile
    }

    /**
     * @abstract
     * Read this file's contents, and return it as a possible promise to a
     * buffer.
     */
    _read() { abstract("TemplateFile.prototype._read") }

    /**
     * Read this file's contents, and return it as a promise to a buffer.
     */
    read() {
        return attempt(() => this._read())
    }
}
