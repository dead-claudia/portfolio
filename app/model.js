"use strict"

const path = require("path")

// TODO: use a backing JSON file

let started = true

exports.started = () => started
exports.start = () => { started = true }

class Photo {
    constructor(path, name, shortDescription, longDescription) {
        this.path = path
        this.name = name
        this.shortDescription = shortDescription
        this.longDescription = longDescription
    }
}
exports.Photo = Photo

exports.photos = [
    new Photo(
        path.resolve(__dirname, "../images/picture-icon.svg"),
        "Photo 1",
        "Short Description 1",
        "Long Description 1"),

    new Photo(
        path.resolve(__dirname, "../images/picture-icon.svg"),
        "Photo 2",
        "Short Description 2",
        "Long Description 2"),

    new Photo(
        path.resolve(__dirname, "../images/picture-icon.svg"),
        "Photo 3",
        "Short Description 3",
        "Long Description 3"),

    new Photo(
        path.resolve(__dirname, "../images/picture-icon.svg"),
        "Photo 4",
        "Short Description 4",
        "Long Description 4"),

    new Photo(
        path.resolve(__dirname, "../images/picture-icon.svg"),
        "Photo 5",
        "Short Description 5",
        "Long Description 5"),
]
