"use strict"

/**
 * The script loader.
 */

const fs = require("fs")
const vm = require("vm")

module.exports = class Loader {
    constructor(document, context) {
        this.document = document
        this.context = context
    }

    execute(file, data) {
        this.context.push(file)

        try {
            vm.runInThisContext(data, {
                filename: file,
                displayErrors: true,
            })
        } finally {
            this.context.pop()
        }
    }

    load(file) {
        file = this.context.normalize(file)

        // Blow up if an undeclared file is loaded.
        if (this.context.isLocal(file)) {
            const resolved = this.context.resolve(file)

            return this.execute(file, fs.readFileSync(resolved, "utf-8"))
        } else if (this.context.isRemote(file)) {
            throw new Error(`Synchronous remote load rejected: ${file}`)
        } else {
            throw new Error(`Unknown file loaded: ${file}`)
        }
    }

    loadAll() {
        for (const script of this.context.local) {
            this.load(script)
        }
    }

    loadAsync(file) {
        file = this.context.normalize(file)

        if (this.context.isLocal(file)) {
            return new Promise((resolve, reject) => {
                const resolved = this.context.resolve(file)

                return fs.readFile(resolved, "utf-8", (err, data) => {
                    return err != null ? reject(err) : resolve(data)
                })
            })
            .then(data => this.execute(file, data))
        }

        if (this.context.isRemote(file)) {
            return new Promise((resolve, reject) =>
                this.loadScript(file, resolve, reject))
        }

        // Blow up if an undeclared file is loaded.
        throw new Error(`Unknown file loaded: ${file}`)
    }

    loadScript(file, resolve, reject) {
        const pre = this.document.createElement("script")
        const script = this.document.createElement("script")
        const post = this.document.createElement("script")
        let next, nextArg

        script.src = file
        pre.onload = ev => {
            ev.preventDefault()
            ev.stopPropagation()
            pre.onload = undefined
            this.context.push(file)
        }

        script.onload = ev => {
            ev.preventDefault()
            ev.stopPropagation()
            script.onload = script.onerror = undefined
            if (next == null) next = resolve
        }

        script.onerror = ev => {
            ev.preventDefault()
            ev.stopPropagation()
            script.onload = script.onerror = undefined
            if (next == null) {
                next = reject
                nextArg = ev
            }
        }

        post.onload = ev => {
            ev.preventDefault()
            ev.stopPropagation()
            post.onload = undefined
            this.context.pop()
            // Remove the nodes after they load.
            this.document.head.removeChild(pre)
            this.document.head.removeChild(script)
            this.document.head.removeChild(post)
            return next(nextArg)
        }

        this.document.head.appendChild(pre)
        this.document.head.appendChild(script)
        this.document.head.appendChild(post)
    }
}
