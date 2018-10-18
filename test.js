const assert = require('assert');
const plugin = require('.');

const { customizeWebpackConfig } = plugin({
  pages: [
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
  const modifiedConfig = await customizeWebpackConfig({
    plugins: [],
    module: { rules: [] },
  });
  assert.ok(!!modifiedConfig.plugins[0].definitions.HAPPO_DATA);
}

test();
