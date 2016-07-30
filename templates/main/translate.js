"use strict"

const path = require("path")
const {Minimatch} = require("minimatch")
const yaml = require("js-yaml")
const {isLink, getParts} = require("./util.js")
const {MissingFile, ConfigError} = require("./errors.js")

function isSpecial(file) {
    return file === "template.yaml" ||
        file === "template.yml" ||
        file === "template.js"
}

function matchOne(matcher, file, isDir) {
    return matcher.set.some(entry => matcher.matchOne(file, entry, isDir))
}

function resolveDep(dep) {
    return dep[0] === "!"
        ? `!${path.posix.resolve("/", dep.slice(1))}`
        : path.posix.resolve("/", dep)
}

function iterateLoop(root, files, acc, test) {
    return root.iterate(name => {
        // Don't add the template metadata or generator script. It's almost
        // assuredly unintentional. Dependencies *may* be added, though, as they
        // might be required for displaying the template.
        if (acc.length === 0 && isSpecial(name)) return undefined
        return root.file(name).then(file => {
            acc.push(name)

            if (file.isFile) {
                if (test(acc, false)) {
                    return root.file(name).then(file => {
                        files.push(file)
                        acc.pop()
                    })
                }
            } else if (test(acc, true)) {
                return root.folder(name)
                .then(root => iterateLoop(root, files, acc, test))
                .then(() => { acc.pop() })
            }

            acc.pop()
            return undefined
        })
    })
}

function iterate(root, test) {
    const files = []
    const acc = getParts(root.path)

    return iterateLoop(root, files, acc, test).then(() => files)
}

function reduceConfig(config) {
    const {name, index} = config
    let {scripts, assets, pages} = config

    if (scripts == null) scripts = []
    else if (!Array.isArray(scripts)) scripts = [scripts]

    if (assets == null) assets = []
    else if (!Array.isArray(assets)) assets = [assets]

    if (pages == null) {
        pages = {"index.html": index != null ? index : "template:index"}
    }

    return {name, scripts, assets, pages}
}

function fixHashes(root, hashes) {
    if (hashes == null) return Promise.resolve(Object.create(null))
    return Object.keys(hashes).reduce((p, res) => p.then(result => {
        if (isLink(res)) {
            result[res] = hashes[res]
            return result
        } else {
            throw new ConfigError(`Unexpected local resource: ${res}`)
        }
    }), Promise.resolve(Object.create(null)))
}

function loadScript(root) {
    return root.file("template.js").then(file => {
        if (file != null) return file
        throw new MissingFile("template.js", root.path)
    })
}

function loadList(root, list) {
    const opts = {
        nocase: process.platform === "win32",
        nocomment: true,
        matchBase: root.path,
    }

    const matchers = list
        .filter(item => !isLink(item))
        .map(item => new Minimatch(resolveDep(item), opts))

    return iterate(root, (file, isDir) =>
        matchers.some(matcher => matchOne(matcher, file, isDir)))
}

module.exports = class Template {
    constructor(root) {
        this.root = root
        this.config = undefined
    }

    read() {
        return this.root.file("template.yaml")
        .then(file => file != null ? file : this.root.file("template.yml"))
        .then(file => {
            if (file != null) return file
            throw new MissingFile("template.yaml", this.root.path)
        })
        .then(file => file.read().then(contents => yaml.safeLoad(contents, {
            filename: file.path,
        })))
        .then(config => {
            this.config = reduceConfig(config)
        })
    }

    load() {
        return Promise.all([
            loadScript(this.root),
            loadList(this.root, this.config.scripts),
            loadList(this.root, this.config.assets),
            fixHashes(this.root, this.config.hashes),
        ])
        .then(([main, local, assets, hashes]) => ({
            main, local, assets, hashes,
            remote: this.config.scripts.filter(isLink),
        }))
    }
}
