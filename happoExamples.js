const styleElem = document.createElement('style');
styleElem.innerHTML = HAPPO_DATA.css;
document.head.appendChild(styleElem);

module.exports = HAPPO_DATA.examples.map(({ component, html }) => {
  return {
    component,
    variants: {
      default: () => html,
    },
  };
});
