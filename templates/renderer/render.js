"use strict"

// TODO: check boolean values to minify result further

/**
 * Based on mithril-node-render, with several major edits and differences:
 *
 * 1. I changed `m("!doctype", ...)` handling to be more sensible and flexible.
 * 2. I normalized the tags to lowercase when in a pure HTML context.
 * 3. I made this lazily generate the output as a sequence of bytes encoded in
 *    UTF-8 so it can be converted to a stream instead of having the whole
 *    output in memory when I write it to the output zip file.
 * 4. I made the types a little more explicit throughout.
 * 5. I also fixed some of the abstractions to DRY up the code a bit.
 *
 * Here's a basic structure:
 *
 * - `type`, the current type context, is kept on the stack. This is whether
 *   it's currently rendering SVG, HTML, XHTML (for SVG and embedded MathML) or
 *   MathML.
 * - `initial`, whether it's the initial call for a child node, is also kept on
 *   the stack. This is necessary for determining if detecting if the start tag
 *   needs closed (which is required for HTML, but not for XML child-less
 *   elements).
 * - The boolean return value for most generators represents whether the node
 *   has children after it's printed.
 *
 * It was just much easier to do things that way.
 *
 * `emit` is to serialize strings to a UTF-8 byte stream. It's easier to make
 * that just use `Buffer` instead of rolling my own generator for UCS-2 to UTF-8
 * conversion, although I could do that if it became a performance or security
 * problem.
 */

const HTML = 0
const XHTML = 1
const SVG = 2
const MathML = 3

function isVoid(tag) {
    return tag === "!doctype" || tag === "area" || tag === "base" ||
        tag === "br" || tag === "col" || tag === "command" || tag === "embed" ||
        tag === "hr" || tag === "img" || tag === "input" || tag === "keygen" ||
        tag === "link" || tag === "meta" || tag === "param" ||
        tag === "source" || tag === "track" || tag === "wbr"
}

function *emit(str) {
    if (str.length !== 0) yield* Buffer.from(str, "utf-8")
}

function escapeString(str, isAttr) {
    return `${str}`.replace(isAttr ? /[&<>"]/g : /[&<>]/g, match => {
        switch (match) {
        case "&": return "&amp;"
        case "<": return "&lt;"
        case ">": return "&gt;"
        default: return "&#34;"
        }
    })
}

function camelToDash(str) {
    return str.replace(/\W+/g, "-")
    .replace(/([a-z\d])([A-Z])/g, "$1-$2")
    .toLowerCase()
}

function getKeep(style, keys) {
    const keep = []

    for (let i = 0; i < keys.length; i++) {
        if (style[keys[i]] !== "") keep.push(keys[i])
    }

    return keep
}

function *printStyleEntry(style, prop) {
    yield* emit(camelToDash(prop))
    yield* emit(":")
    yield* emit(style[prop])
}

function *printStyleObject(style) {
    const keys = Object.keys(style)

    if (keys.length !== 0) {
        const keep = getKeep(style, keys)

        if (keep.length !== 0) {
            yield* emit(' style="')
            yield* printStyleEntry(style, keep[0])

            for (let i = 1; i < keep.length; i++) {
                yield* emit(";")
                yield* printStyleEntry(style, keep[i])
            }

            yield* emit('"')
        }
    }
}

function *addSingleAttr(type, tag, key, value) {
    if (value != null && typeof value !== "function") {
        if (key === "style" && typeof value === "object") {
            yield* printStyleObject(value)
        } else {
            yield* emit(" ")

            if (type === SVG && key === "href" && tag === "use") {
                // Add the `xlink` namespace to SVG <use> elements correctly.
                yield* emit("xlink:href")
            } else {
                yield* emit(key === "className" ? "class" : key)
            }

            const real = `${value}`

            if (real !== "") {
                yield* emit('="')
                yield* emit(escapeString(real, true))
                yield* emit('"')
            }
        }
    }
}

function *addAttrs(type, tag, attrs) {
    if (attrs != null) {
        for (const key of Object.keys(attrs)) {
            yield* addSingleAttr(type, tag, key, attrs[key])
        }
    }
}

function *visitEach(ref, type, initial, children) {
    if (children.length === 0) return false

    let res = yield* visit(ref, type, initial, children[0])

    for (let i = 1; i < children.length; i++) {
        if (yield* visit(ref, type, false, children[i])) res = true
    }

    return res
}

// Note that this yields to ensure the whole inner tree is generated *before*
// the `onunload` hook is called.
function *visitComponent(ref, type, initial, view) {
    const ctrl = typeof view.controller === "function"
        ? new view.controller() // eslint-disable-line new-cap
        : {}

    const res = yield* visitView(ref, type, initial, view.view(ctrl))

    if (typeof ctrl.onunload === "function") ctrl.onunload()

    return res
}

function checkTag(type, tag, attrs) {
    switch (type) {
    case HTML: case XHTML:
        if (tag === "svg") return SVG
        if (tag === "math") return MathML
        return type

    case SVG:
        if (tag === "foreignObject") {
            const ns = attrs.requiredExtensions

            if (ns === "http://www.w3.org/1999/xhtml") {
                return XHTML
            }

            if (ns === "http://www.w3.org/1998/Math/MathML") {
                return MathML
            }
        }
        return type

    default: // case MathML:
        if (tag === "annotation-xml") {
            if (attrs.encoding === "application/xhtml+xml") {
                return XHTML
            }
        }
        return type
    }
}

function *visitNormal(ref, type, initial, node) {
    if (initial) yield* emit(">")

    let tag = node.tag

    if (type === HTML) tag = tag.toLowerCase()

    if (tag === "!doctype") {
        yield* emit("<!DOCTYPE html>")
        ref.init = true
    } else {
        if (!ref.init) {
            ref.init = true
            yield* emit("<!DOCTYPE html>")
        }
        type = checkTag(type, tag, node.attrs)

        yield* emit(`<${tag}`)
        yield* addAttrs(type, tag, node.attrs)

        if (type === HTML && isVoid(tag)) {
            yield* emit(">")
        } else if (type === XHTML && isVoid(tag)) {
            yield* emit("/>")
        } else if (yield* visit(ref, type, true, node.children)) {
            yield* emit(`</${tag}>`)
        } else if (type === HTML || type === XHTML) {
            yield* emit(`></${tag}>`)
        } else {
            yield* emit("/>")
        }
    }

    return true
}

function *visitString(ref, initial, str) {
    // This can only happen at the top level, where the return value is ignored.
    if (!ref.init) {
        ref.init = true
        yield* emit("<!DOCTYPE html>")
    }
    if (str.length === 0) return false
    if (initial) yield* emit(">")
    yield* emit(str)
    return true
}

function isObject(value) {
    return value != null && typeof value === "object"
}

function isNode(node) {
    return (typeof node.tag === "string" || isObject(node.tag)) &&
        isObject(node.attrs) &&
        isObject(node.children)
}

// Mithril pre-rewrite requires views to return actual DOM nodes, so let's be
// consistent with that. The error message was yanked from there.
function *visitView(ref, type, initial, node) {
    if (isObject(node)) {
        if (typeof node.view === "function") {
            return yield* visitComponent(ref, type, initial, node)
        } else if (node.subtree === "retain") {
            // Don't vomit if this is used. Just silently ignore the likely
            // mistake.
            return false
        } else if (isNode(node)) {
            return yield* visitNormal(ref, type, initial, node)
        }
    }

    throw new Error("Component template must return a virtual element, not " +
        "an array, string, etc.")
}

function *visit(ref, type, initial, node) {
    if (node == null) {
        return false
    } else if (typeof node !== "object") {
        return yield* visitString(ref, initial, escapeString(`${node}`, false))
    } else if (Array.isArray(node)) {
        return yield* visitEach(ref, type, initial, node)
    } else if (typeof node.view === "function") {
        return yield* visitComponent(ref, type, initial, node)
    } else if (node.$trusted) {
        return yield* visitString(ref, initial, `${node}`)
    } else if (isNode(node)) {
        return yield* visitNormal(ref, type, initial, node)
    } else if (node.subtree === "retain") {
        // Don't vomit if this is used. Just silently ignore the likely mistake.
        return false
    } else {
        return yield* visitString(ref, initial, escapeString(`${node}`, false))
    }
}

exports.render = render
function *render(tree) {
    if (!(yield* visit({init: false}, HTML, false, tree))) {
        // If the doctype hasn't been yielded, it must.
        yield* emit("<!DOCTYPE html>")
    }
}
