const styleElem = document.createElement('style');
styleElem.innerHTML = HAPPO_DATA.css + `

  @media (max-width: 1024px) and (min-width: 991px) {
    #page-top.nc-consumer .home-header.us-header {
        min-height: 630px;
        background-position: -80px bottom;
    }
  }


`;
document.head.appendChild(styleElem);

module.exports = HAPPO_DATA.examples.map(({ component, html }) => {
  return {
    component,
    variants: {
      default: () => html,
    },
  };
});
