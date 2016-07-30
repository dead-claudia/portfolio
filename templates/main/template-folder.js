"use strict"

const {abstract, attempt} = require("./util.js")

function navigate(inst, isFile, [path, ...args]) {
    if (args.length === 0) {
        return attempt(() => isFile ? inst._file(path) : inst._folder(path))
    }

    let p = Promise.resolve(inst)

    for (const entry of args) {
        const last = path

        // Check to ignore missing directories
        p = p.then(folder => folder == null ? null : folder._folder(last))
        path = entry
    }

    return p.then(folder => {
        if (folder == null) return null
        if (isFile) return folder._file(path)
        return folder._folder(path)
    })
}

/**
 * @abstract
 * A folder in a template.
 *
 * - `path` is the absolute path to the folder.
 */
module.exports = class TemplateFolder {
    constructor(path) { this.path = path }

    /** @abstract See file() and folder() */
    _file() { abstract("TemplateFolder.prototype._file") }

    /** @abstract See file() and folder() */
    _folder() { abstract("TemplateFolder.prototype._folder") }

    /** @abstract See iterate() */
    _iterate() { abstract("TemplateFolder.prototype._iterate") }

    /**
     * Get a promise to the file (or directory as a file) with this path, or
     * `null` if it doesn't exist. Calls `_folder(name)` and `_file(base)` to
     * get it.
     *
     * - `...path` is the path to the file from this folder. At least one name
     *   must be passed.
     */
    file(path, ...paths) {
        if (Array.isArray(path)) return navigate(this, true, path)
        return navigate(this, true, [path, ...paths])
    }

    /**
     * Get a promise to the folder with this path, or `null` if it doesn't exist
     * or is a file. If the return value isn't already a promise, it's coerced
     * to one. Calls `_folder(name)` to get it.
     *
     * - `...path` is the path to the folder from this folder. At least one name
     *   must be passed.
     */
    folder(path, ...paths) {
        if (Array.isArray(path)) return navigate(this, false, path)
        return navigate(this, false, [path, ...paths])
    }

    /**
     * Iterate all files in this directory in order, serially, and return a
     * Promise when done.
     *
     * - `func` is called with just the file name, without preceding parts, and
     *   it may optionally return a promise.
     */
    iterate(func) {
        return attempt(() => this._iterate(file => attempt(() => func(file))))
    }
}
