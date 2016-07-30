"use strict"

const t = require("thallium")
const render = require("../../../templates/renderer/render.js")
const m = require("mithril")

t.test("templates/renderer/render", t => {
    function generate(component) {
        return Buffer.from(Array.from(render.render(component)))
        .toString("utf-8")
    }

    t.test("basic", t => { // eslint-disable-line max-statements
        t.test("renders nothing", t => {
            t.equal(generate(undefined), "<!DOCTYPE html>")
        })

        t.test("renders tag", t => {
            t.equal(generate(m("span", "content")),
                "<!DOCTYPE html><span>content</span>")
        })

        t.test("renders classname", t => {
            t.equal(generate(m(".foo", "content")),
                '<!DOCTYPE html><div class="foo">content</div>')
        })

        t.test("renders id", t => {
            t.equal(generate(m("#bar", "content")),
                '<!DOCTYPE html><div id="bar">content</div>')
        })

        t.test("renders nodes with no children", t => {
            t.equal(generate(m("br")), "<!DOCTYPE html><br>")
        })

        t.test("renders nodes with no children + uppercase tag name", t => {
            t.equal(generate(m("HR")), "<!DOCTYPE html><hr>")
        })

        t.test("renders doctype", t => {
            t.equal(generate(m("!doctype")), "<!DOCTYPE html>")
        })

        t.test("renders doctype HTML5", t => {
            t.equal(generate(m("!doctype", "html")), "<!DOCTYPE html>")
        })

        t.test("renders attributes", t => {
            t.equal(
                generate(m("span", {
                    "data-foo": "bar",
                    "selected": "selected",
                })),
                "<!DOCTYPE html>" +
                '<span data-foo="bar" selected="selected"></span>')
        })

        t.test("renders string", t => {
            t.equal(generate(m("ul", "huhu")), "<!DOCTYPE html><ul>huhu</ul>")
        })

        t.test("renders arrays", t => {
            t.equal(generate([m("span", "foo"), m("div", "bar")]),
                "<!DOCTYPE html><span>foo</span><div>bar</div>")
        })

        t.test("renders children", t => {
            t.equal(generate(m("span", m("div"))),
                "<!DOCTYPE html><span><div></div></span>")
        })

        t.test("doesn't render function handlers", t => {
            t.equal(generate(m("span", {onmousemove() {}})),
                "<!DOCTYPE html><span></span>")
        })

        t.test("renders children", t => {
            t.equal(
                generate(m("span", {
                    style: {paddingLeft: "10px", color: "red"},
                })),
                "<!DOCTYPE html>" +
                '<span style="padding-left:10px;color:red"></span>')
        })

        t.test("renders numbers as text nodes", t => {
            t.equal(generate(m("div", [1, m("span"), "2"])),
                "<!DOCTYPE html><div>1<span></span>2</div>")
        })

        t.test("renders number body", t => {
            t.equal(generate(m("div", 0)), "<!DOCTYPE html><div>0</div>")
        })

        t.test("renders boolean body", t => {
            t.equal(generate(m("div", false)),
                "<!DOCTYPE html><div>false</div>")
        })

        t.test("renders `true` attr literally", t => {
            t.equal(generate(m("div", {a: true})),
                '<!DOCTYPE html><div a="true"></div>')
        })

        t.test("renders `false` attr literally", t => {
            t.equal(generate(m("div", {a: false})),
                '<!DOCTYPE html><div a="false"></div>')
        })

        t.test("doesn't render `undefined` attr", t => {
            t.equal(generate(m("div", {a: undefined})),
                "<!DOCTYPE html><div></div>")
        })

        t.test("doesn't render `null` attr", t => {
            t.equal(generate(m("div", {style: null})),
                "<!DOCTYPE html><div></div>")
        })

        t.test("renders boolean attr", t => {
            t.equal(generate(m("div", {contenteditable: ""})),
                "<!DOCTYPE html><div contenteditable></div>")
        })

        t.test("renders string `style`", t => {
            t.equal(generate(m("div", {style: "height: 20px; width: 10px"})),
                '<!DOCTYPE html><div style="height: 20px; width: 10px"></div>')
        })

        t.test("renders object `style` with all empty string properties", t => {
            t.equal(generate(m("div", {style: {color: ""}})),
                "<!DOCTYPE html><div></div>")
        })

        t.test("renders object `style` with non-empty property", t => {
            t.equal(generate(m("div", {style: {height: "20px", color: ""}})),
                '<!DOCTYPE html><div style="height:20px"></div>')
        })

        t.test("renders object `style` with 2 non-empty properties", t => {
            t.equal(
                generate(m("div", {
                    style: {height: "20px", color: "", width: "10px"},
                })),
                '<!DOCTYPE html><div style="height:20px;width:10px"></div>')
        })

        t.test("renders non-empty attr", t => {
            t.equal(generate(m("div", {a: "foo"})),
                '<!DOCTYPE html><div a="foo"></div>')
        })

        t.test("renders trusted strings", t => {
            t.equal(generate(m("div", m.trust("<foo></foo>"))),
                "<!DOCTYPE html><div><foo></foo></div>")
        })

        t.test("escapes untrusted strings", t => {
            t.equal(generate(m("div", "<foo></foo>")),
                "<!DOCTYPE html><div>&lt;foo&gt;&lt;/foo&gt;</div>")
        })

        t.test("escapes attributes", t => {
            t.equal(generate(m("div", {style: '"></div><div a="'})),
                "<!DOCTYPE html>" +
                '<div style="&#34;&gt;&lt;/div&gt;&lt;div a=&#34;"></div>')
        })

        t.test("doesn't escape quotes in body", t => {
            t.equal(generate(m("pre", `var = ${JSON.stringify({foo: 1})}`)),
                '<!DOCTYPE html><pre>var = {"foo":1}</pre>')
        })

        t.test("adds namespace to `use` href within SVG", t => {
            t.equal(generate(m("svg", m("use", {href: "fooga.com"}))),
                '<!DOCTYPE html><svg><use xlink:href="fooga.com"/></svg>')
        })

        t.test("doesn't add namespace to `use` href outside SVG", t => {
            t.equal(generate(m("div", m("use", {href: "fooga.com"}))),
                '<!DOCTYPE html><div><use href="fooga.com"></use></div>')
        })
    })

    t.test("components", t => {
        t.test("renders component view", t => {
            const Component = {
                view(_, bar) {
                    return m("div", ["hello", bar])
                },
            }

            t.equal(generate(m("div", m(Component, "bar"))),
                "<!DOCTYPE html><div><div>hellobar</div></div>")
        })

        t.test("calls controller's `onunload`", t => {
            let called = 0
            const Component = {
                controller: function () { // eslint-disable-line object-shorthand, max-len
                    this.onunload = () => { called++ }
                },
                view() {
                    return m("div", ["hello"])
                },
            }

            t.equal(generate(m("span", m(Component))),
                "<!DOCTYPE html><span><div>hello</div></span>")
            t.equal(called, 1)
        })

        t.test("constructs controller and passes it to the view", t => {
            t.equal(generate(m("div", {
                controller: function () { // eslint-disable-line object-shorthand, max-len
                    this.foo = "bar"
                },
                view(ctrl) {
                    return m("span", ctrl.foo)
                },
            })), "<!DOCTYPE html><div><span>bar</span></div>")
        })

        t.test("works with no controller", t => {
            t.equal(generate(m("div", {
                view() {
                    return m("span", "huhu")
                },
            })), "<!DOCTYPE html><div><span>huhu</span></div>")
        })
    })

    t.test("works with very complex stuff", t => {
        const Symbols = Object.freeze({
            Check: "✓", // U+2713
            Plus: "+", // U+002B
            Gear: "⛭", // U+26ED
            Arrow: "▶", // U+25B6
            Info: "🛈", // U+1F6C8
        })

        const RouteButton = {
            view: (_, {onclick, type, class: extra, text, symbol}) => {
                return m(`button.route-button.btn.btn-${type}`, {
                    onclick,
                    class: extra || "",
                }, [
                    m("span.button-text", text),
                    m("span.button-symbol", symbol),
                ])
            },
        }

        const current = "/listing"
        const button = (route, type, text, symbol) =>
            current === route ? m(RouteButton, {
                type, text, symbol,
                class: "navbar-btn",
            }) : m(RouteButton, {
                type, text, symbol,
                class: "navbar-btn",
                onclick: `m.route("${route}")`,
            })

        const Page = {
            view: (_, children) => m(".base-page", [
                m(".base-header", [
                    m("nav.navbar.navbar-default.navbar-fixed-top", m(".container-fluid", [ // eslint-disable-line max-len
                        m(".navbar-header", [
                            m("a.navbar-brand", "Portfolio"),
                        ]),
                        m(".navbar-collapse.collapse", [
                            button("/edit", "success", "Add", Symbols.Plus),
                            button("/preview", "primary", "Preview", Symbols.Arrow), // eslint-disable-line max-len
                            button("/manage", "warning", "Manage", Symbols.Gear), // eslint-disable-line max-len
                            button("/help", "info", "Help", Symbols.Info),
                        ]),
                    ])),
                ]),
                m(".base-content", [
                    m(".base-body", [children]),
                    m(".base-push"),
                ]),
                m(".base-footer", [
                    "App by ", m("a[href=http://www.isiahmeadows.com]", "Isiah Meadows"),
                ]),
            ]),
        }

        class Photo {
            constructor(path, name, shortDescription, longDescription) {
                this.path = path
                this.name = name
                this.shortDescription = shortDescription
                this.longDescription = longDescription
            }
        }

        const photos = [
            new Photo(
                "/images/picture-placeholder.svg",
                "Photo 1",
                "Short Description 1",
                "Long Description 1"),

            new Photo(
                "/images/picture-placeholder.svg",
                "Photo 2",
                "Short Description 2",
                "Long Description 2"),

            new Photo(
                "/images/picture-placeholder.svg",
                "Photo 3",
                "Short Description 3",
                "Long Description 3"),

            new Photo(
                "/images/picture-placeholder.svg",
                "Photo 4",
                "Short Description 4",
                "Long Description 4"),

            new Photo(
                "/images/picture-placeholder.svg",
                "Photo 5",
                "Short Description 5",
                "Long Description 5"),
        ]

        const Listing = {
            view: () => m(Page, m(".listing-page", [
                photos.map((photo, i) => m(".listing-item", {
                    onclick: `m.route("/edit?index=${i}")`,
                }, [
                    m("img", {src: photo.path}),
                    m("h2", photo.name),
                    m("p", photo.shortDescription),
                ])),
            ])),
        }

        const result = generate([
            m("!doctype"),
            m("head", [
                m("link[rel=stylesheet][href=style.css]"),
                m("script[src=mithril.js]"),
                m("script[src=bundle.js]"),
            ]),
            m("body", m(Listing)),
        ])

        /* eslint-disable indent, max-len */

        t.equal(result, [
            "<!DOCTYPE html>",
            "<head>",
            '<link rel="stylesheet" href="style.css">',
            '<script src="mithril.js"></script>',
            '<script src="bundle.js"></script>',
            "</head>",
            "<body>",
            '<div class="base-page">',
                '<div class="base-header">',
                    '<nav class="navbar navbar-default navbar-fixed-top">',
                        '<div class="container-fluid">',
                            '<div class="navbar-header">',
                                '<a class="navbar-brand">Portfolio</a>',
                            "</div>",
                            '<div class="navbar-collapse collapse">',
                                '<button onclick="m.route(&#34;/edit&#34;)" class="route-button btn btn-success navbar-btn">',
                                    '<span class="button-text">Add</span>',
                                    `<span class="button-symbol">${Symbols.Plus}</span>`,
                                "</button>",
                                '<button onclick="m.route(&#34;/preview&#34;)" class="route-button btn btn-primary navbar-btn">',
                                    '<span class="button-text">Preview</span>',
                                    `<span class="button-symbol">${Symbols.Arrow}</span>`,
                                "</button>",
                                '<button onclick="m.route(&#34;/manage&#34;)" class="route-button btn btn-warning navbar-btn">',
                                    '<span class="button-text">Manage</span>',
                                    `<span class="button-symbol">${Symbols.Gear}</span>`,
                                "</button>",
                                '<button onclick="m.route(&#34;/help&#34;)" class="route-button btn btn-info navbar-btn">',
                                    '<span class="button-text">Help</span>',
                                    `<span class="button-symbol">${Symbols.Info}</span>`,
                                "</button>",
                            "</div>",
                        "</div>",
                    "</nav>",
                "</div>",
                '<div class="base-content">',
                    '<div class="base-body">',
                        '<div class="listing-page">',
                            '<div onclick="m.route(&#34;/edit?index=0&#34;)" class="listing-item">',
                                '<img src="/images/picture-placeholder.svg">',
                                "<h2>Photo 1</h2>",
                                "<p>Short Description 1</p>",
                            "</div>",
                            '<div onclick="m.route(&#34;/edit?index=1&#34;)" class="listing-item">',
                                '<img src="/images/picture-placeholder.svg">',
                                "<h2>Photo 2</h2>",
                                "<p>Short Description 2</p>",
                            "</div>",
                            '<div onclick="m.route(&#34;/edit?index=2&#34;)" class="listing-item">',
                                '<img src="/images/picture-placeholder.svg">',
                                "<h2>Photo 3</h2>",
                                "<p>Short Description 3</p>",
                            "</div>",
                            '<div onclick="m.route(&#34;/edit?index=3&#34;)" class="listing-item">',
                                '<img src="/images/picture-placeholder.svg">',
                                "<h2>Photo 4</h2>",
                                "<p>Short Description 4</p>",
                            "</div>",
                            '<div onclick="m.route(&#34;/edit?index=4&#34;)" class="listing-item">',
                                '<img src="/images/picture-placeholder.svg">',
                                "<h2>Photo 5</h2>",
                                "<p>Short Description 5</p>",
                            "</div>",
                        "</div>",
                    "</div>",
                    '<div class="base-push"></div>',
                "</div>",
                '<div class="base-footer">',
                    'App by <a href="http://www.isiahmeadows.com">Isiah Meadows</a>',
                "</div>",
            "</div>",
            "</body>",
        ].join(""))

        /* eslint-enable indent, max-len */
    })
})
