"use strict"

const path = require("path")

/**
 * Paths are all POSIX paths relative to package root to simplify/streamline
 * handling, and to make protection against directory traversal attacks much
 * easier to defend against.
 */

module.exports = class Context {
    constructor(root, local, remote) {
        this.root = root
        this.local = local.map(p => path.posix.resolve("/", p))
        this.remote = remote
        this.stack = []
        this.dirnames = ["/"]
    }

    push(file) {
        this.stack.push(file)
        this.dirnames.push(path.dirname(file))
    }

    pop() {
        this.stack.pop()
        this.dirnames.pop()
    }

    isLocal(file) {
        return this.local.indexOf(file) !== -1
    }

    isRemote(file) {
        return this.remote.indexOf(file) !== -1
    }

    normalize(file) {
        if (!/^https?:\/\//.test(file)) {
            file = path.posix.resolve(
                this.dirnames[this.dirnames.length - 1],
                file)
        }

        // Blow up if a circular load is attempted. It's likely a developer
        // error, and if the template's *that* complex, they should be using
        // `simple-require-loader` (or another module loader) instead.
        if (this.stack.indexOf(file) >= 0) {
            const last = this.stack[this.stack.length - 1]

            throw new Error(`Circular load detected for ${file} from ${last}`)
        }

        return file
    }

    resolve(file) {
        return path.resolve(this.root, file.slice(1))
    }
}
