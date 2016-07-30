# Templates

Templates are folders, optionally packaged in a zip file, with the following format:

- `template.yaml` (or `template.yml`) - A basic YAML file with the following keys:

    ```yaml
    # The name of your template. This is the only required field.
    name: My Awesome Template

    # One or more scripts that may be loaded. Globs are acceptable, although dot
    # files are not matched unless you use something like `foo/.*`. Negated globs can
    # filter out files, too. Remote URLs are also permitted, but they must be
    # exact, and can't be matched.
    scripts:
        - util.js

    # One or more assets to include. Globs are acceptable, although dot files
    # are not matched unless you use something like `foo/.*`. Negated globs can
    # filter out files, too.
    assets:
        - style.css
        - script.js
        - images/**/*.*
        - static/jquery.js # doesn't have to match

    # A mapping of components -> pages
    pages:
        index.html: template:index # normal
        about.html: template:about person = me # with string args
    ```

    Note that you can also use `index: template:component` as a shorthand for this:

    ```yaml
    pages:
        index.html: template:component
    ```

    If it's omitted altogether, it defaults to `index: template:index`

- `template.js` - A JavaScript file used to generate the web site. If it's missing, the default is just `page.loadAll()`, so you can just list what you're using in your `scripts` field. Exported global components are referenced in the `template.yaml` file. Note that XML support with Pug is planned.

## Components

Templates automatically have [Mithril](https://mithril.js.org) (with routing disabled) and [`simple-require-loader`](https://www.npmjs.com/package/simple-require-loader) loaded globally, and they additionally have the following functions available under the `page` global:

- `page.load(file)` - Synchronously load a local `scripts` file in your `template.yaml`. The file is relative to the loading script itself, *not* the `template.yaml`.
- `page.loadAll()` - Synchronously load all local `scripts` files in your `template.yaml`. It's a space-saving shorthand in case you're using e.g. `simple-require-loader`.
- `page.loadAsync(file).then(() => ...)` - Load any local *or* remote `scripts` file asynchronously. Returns a promise.
- `page.renderingToStatic()` - `true` if the template is rendering to a static string, `false` when just viewing.
- `page.wrapper((name, component) => tree)` - Set the page wrapper when rendering to a string. This wrapper isn't shown in the preview, so it's mainly for adding header stuff.
- `page.add(name, component)` - Export a page `component` referenced by `name` in your `template.yaml`. You can also use an object like this: `page.add({name: component})`. If the `component` is a string, it actually loads the module instead.

Note that `page.load`, `page.loadAll`, and `page.loadAsync` are all uncached, and work globally. Also, you can't use the `file:` protocol, as it's blocked.

Additionally, templates have the following components available to them:

- `page.Link` - A routing link component. You'll need this for tab switching or other routing needs, as other things won't work as intended. The `element` attribute is the DOM element to used to represent it (defaults to `<a>`), and everything else is passed straight through.
- `page.Header` - The designer's name.
- `page.Text` - Text file, accepts a `type` of one of the following:
    - `"summary"` - The designer's personal summary.
    - `"about"` - The designer's about page.
    - `"other"` - Customizable text, not associated with any special type.
- `page.Gallery` - A gallery of photos, optionally editable.
- `page.Photo` - A single photo inside a gallery.

Each component accepts a common set of options, all optional:

- `selector` - An added selector used for deriving extra attributes and possibly the tag of the underlying component. If a tag is given, it is used for the outer component for `Header` and `Text`, but ignored otherwise.
- `remember` - Remember the value for this field, unless it's a `Text type: "other"` component, in which it's ignored. This defaults to `true`.
