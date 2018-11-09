module.exports = HAPPO_DATA.examples.map(({ component, html }) => {
  return {
    component,
    variants: {
      default: () => html,
    },
  };
});
