"use strict"

const {Readable} = require("stream")

function callNext(iter) {
    try {
        return {caught: false, value: iter.next()}
    } catch (e) {
        return {caught: true, error: e}
    }
}

function pushError(stream, error) {
    process.nextTick(() => {
        stream.emit("error", error)
        stream.page._rendering = false
    })
}

module.exports = class IterStream extends Readable {
    constructor(page, iter) {
        super()

        this.page = page
        this.iter = iter
    }

    _read(size) {
        if (size === 0) return

        const buf = Buffer.alloc(size)
        let i = 0

        while (i < size) {
            const attempt = callNext(this.iter)

            if (attempt.caught) {
                pushError(this, attempt.value)
                return
            }

            const next = attempt.value

            if (next.done) break

            buf[i++] = next.value
        }

        // Buffer completely filled
        if (i === size) {
            this.push(buf)
        } else {
            this.push(buf.slice(0, i))
            this.page._rendering = false
            this.push(null)
        }
    }
}
