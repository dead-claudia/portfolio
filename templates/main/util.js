"use strict"

exports.isLink = str => {
    return /^(https?:)?\/\//i.test(str)
}

exports.getParts = str => {
    return str.replace(/[\\\/]+$/, "").split(/[\\\/]/g)
}

exports.abstract = name => {
    throw new ReferenceError(`${name} is abstract`)
}

exports.attempt = f => {
    return new Promise(resolve => resolve(f()))
}
