# happo-plugin-scrape

A [happo.io](https://github.com/happo/happo.io) plugin that allow you to grab
Happo examples from an existing website.

*Note: If you came here looking to screenshot full pages, consider using [the full-page support](https://github.com/happo/happo.io#full-page-support) built into happo.io instead.*

## Usage

Add the following to your `.happo.js` configuration file:

```js
// .happo.js
const happoPluginScrape = require('happo-plugin-scrape');

module.exports = {
  // ...
  type: 'plain',
  plugins: [
    happoPluginScrape({
      pages: [
        {
          url: 'http://google.com',
          examples: [
            {
              name: 'Search box',
              selector: 'form[role="search"]',
            },
            {
              name: 'Logo box',
              selector: '#lga',
            },
          ],
        },
      ],
    }),
  ],
}
```

## Configuration

### `pages` (required)

The `pages` option specifies what URLs to scrape. In each page you specify a
`url` and a list of `examples`. Each example has the following form:

- `name` A name you give the example, e.g. `'Navbar'`
- `selector` A query selector locating the element on the page
- `waitForSelector` (optional) a query selector locating an element which needs
  to be rendered before the example is ready. This is useful if your examples
  have asynchronous content inside them.

In addition to `url` and `examples`, each `page` can also have a `wrapper`
function. Happo will cut out the example markup from the page and render
in isolation, and the `wrapper` function allows you to bring along any
dependencies on outside wrapper elements to the screenshooting process. Here's
an example injecting a `#page` wrapper:

```js
{
  url: 'http://google.com',
  wrapper: (html) => `<div id="page">${html}</div>`,
  examples: [
    {
      name: 'Search box',
      selector: 'form[role="search"]',
    },
  ],
},
```
