const nodePath = require('path');
const url = require('url');

const matchAll = require('string.prototype.matchall');
const puppeteer = require('puppeteer');
const request = require('request-promise-native');
const webpack = require('webpack');

function makeUrlsAbsolute(css, hrefOfCssFile) {
  const matches = Array.from(matchAll(css, /url\(['"]?([^)'"]+)['"]?\)/g));
  let modified = css;
  const { protocol, hostname, path } = url.parse(hrefOfCssFile);
  const baseUrl = [protocol, '//', hostname].join('');
  const relativeBase = [baseUrl, path.replace(/\/[^/]+$/, '/')].join('');
  matches.forEach(([matched, potentialUrl]) => {
    if (potentialUrl.startsWith('data:')) {
      // data uri
      return;
    }
    if (/^https?:/.test(potentialUrl)) {
      // absolute url
      return;
    }
    if (potentialUrl.startsWith('%23')) {
      // potential `url()` inside an inlined svg
      return;
    }
    if (/^\//.test(potentialUrl)) {
      modified = modified.split(matched).join(`url(${baseUrl}${potentialUrl})`);
    } else {
      // path.normalize will transform things like '/a/b/c/../d.js' to '/a/b/d.js'
      const fullUrl = nodePath.normalize(`${relativeBase}${potentialUrl}`);
      modified = modified.split(matched).join(`url(${fullUrl})`);
    }
  });
  return modified;
}

async function extractCSSChunks(page) {
  const baseUrl = await page.evaluate(() => window.location.origin);
  const protocol = await page.evaluate(() => window.location.protocol);
  const inline = await page.evaluate(() =>
    Array.from(document.querySelectorAll('style')).map(el => {
      return el.innerHTML || Array.from(el.sheet.cssRules).map((r) => r.cssText).join('\n')
;
    }),
  );
  const hrefs = (await page.evaluate(() =>
    Array.from(document.querySelectorAll('link[rel="stylesheet"][href]')).map(el =>
      el.getAttribute('href'),
    ),
  )).map(href => {
    if (href.startsWith('http')) {
      return href;
    }
    if (href.startsWith('//')) {
      return protocol + href;
    }
    return baseUrl + href;
  });
  const external = await Promise.all(hrefs.map(async href => {
    const content = await request({ method: 'GET', url: href, gzip: true });
    return makeUrlsAbsolute(content, href);
  }));
  return external.concat(inline);
}

async function waitFor(page, selector, attempt = 0) {
  const ready = await page.evaluate(
    sel => {
      const el = document.body.querySelector(sel);
      if (!el) {
        return false;
      }
      return true;
    },
    selector,
  );

  if (ready) return true;
  if (attempt > 50) {
    throw new Error(`Timeout while waiting for selector "${selector}"`);
  }
  await new Promise((resolve) => setTimeout(resolve, 50));
  return waitFor(page, selector, attempt + 1);
}

async function logIn(page, { url, username, password }) {
  await page.goto(url);
  const usernameInputSelector = 'input[name=email],input[type=email]';
  const passwordInputSelector = 'input[type=password]';
  await waitFor(page, usernameInputSelector);
  await page.type(usernameInputSelector, username);
  await page.type(passwordInputSelector, password);
  await page.keyboard.press('Enter');
  await page.waitForNavigation({ waitUntil: 'load' });
}

module.exports = function happoScrapePlugin({ pages }) {
  const plugin = {};
  plugin.customizeWebpackConfig = async config => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const cssChunks = new Set();
    const result = [];

    for (const { url, auth, examples, wrapper = (html) => html } of pages) {
      console.log(`\nLoading ${url}...`);
      if (auth) {
        await logIn(page, auth);
      }
      await page.goto(url);
      for (const { name, selector, waitForSelector } of examples) {
        console.log(`Preparing selector ${selector}...`);
        await waitFor(page, selector);
        if (waitForSelector) {
          await waitFor(page, waitForSelector);
        }
        const html = await page.evaluate(sel => document.body.querySelector(sel).outerHTML, selector);
        result.push({ html: wrapper(html), component: name });
      }
      (await extractCSSChunks(page)).forEach(chunk => cssChunks.add(chunk));
    }
    config.plugins.push(
      new webpack.DefinePlugin({
        HAPPO_DATA: JSON.stringify({
          examples: result,
        }),
      }),
    );
    plugin.css = Array.from(cssChunks).join('\n');
    await browser.close();
    return config;
  };
  plugin.pathToExamplesFile = nodePath.resolve(__dirname, 'happoExamples.js');
  return plugin;
};
