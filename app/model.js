"use strict"

// TODO: use a backing JSON file

const path = require("path")

let started = false

exports.hasStarted = () => Promise.resolve(started)
exports.setStarted = () => Promise.resolve(started = true)

class Photo {
    constructor(path, name, shortDescription, longDescription) {
        this.path = path
        this.name = name
        this.shortDescription = shortDescription
        this.longDescription = longDescription
    }
}
exports.Photo = Photo

const photos = [
    new Photo(
        path.resolve(__dirname, "../images/picture-placeholder.svg"),
        "Photo 1",
        "Short Description 1",
        "Long Description 1"),

    new Photo(
        path.resolve(__dirname, "../images/picture-placeholder.svg"),
        "Photo 2",
        "Short Description 2",
        "Long Description 2"),

    new Photo(
        path.resolve(__dirname, "../images/picture-placeholder.svg"),
        "Photo 3",
        "Short Description 3",
        "Long Description 3"),

    new Photo(
        path.resolve(__dirname, "../images/picture-placeholder.svg"),
        "Photo 4",
        "Short Description 4",
        "Long Description 4"),

    new Photo(
        path.resolve(__dirname, "../images/picture-placeholder.svg"),
        "Photo 5",
        "Short Description 5",
        "Long Description 5"),
]

exports.getPhotos = () => Promise.resolve(photos)

exports.setPhotoAt = (index, photo) => {
    photos[index] = photo
    return Promise.resolve()
}

exports.addPhoto = photo => {
    photos.push(photo)
    return Promise.resolve()
}

exports.getPhotoAt = index => Promise.resolve(photos[index])
