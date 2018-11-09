const assert = require('assert');
const plugin = require('.');

const { USERNAME: username, PASSWORD: password } = process.env;
if (!username || !password) {
  throw new Error('Missing USERNAME and/or PASSWORD env variables');
}

const initializedPlugin = plugin({
  pages: [
    {
      url: 'https://brigade.com/profiles/henric-trotzig',
      auth: {
        url: 'https://brigade.com/log-in',
        username,
        password,
      },
      examples: [
        {
          name: 'Profile box',
          selector: '[class*="Card--component"]',
        },
      ],
    },
    {
      url: 'https://www.naturalcycles.com/en/signup',
      examples: [
        {
          name: 'Registration Box',
          selector: '.registrationBox',
          waitForSelector: '.product-YEAR',
        },
      ],
    },
  ],
});

async function test() {
  const modifiedConfig = await initializedPlugin.customizeWebpackConfig({
    plugins: [],
    module: { rules: [] },
  });
  assert.ok(!!initializedPlugin.css);
  assert.ok(!!modifiedConfig.plugins[0].definitions.HAPPO_DATA);
}

test();
