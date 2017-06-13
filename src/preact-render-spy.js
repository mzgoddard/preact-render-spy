const {render} = require('preact');

const spyComponent = Component => {
  const scratch = document.createDocumentFragment();
  const context = {
    component: null,
    Spy: null,
    scratch,
    output: null,
    render(vdom) {
      vdom.nodeName = context.Spy;
      context.component = render(vdom, context.scratch);
      return context;
    },
  };
  class Spy extends Component {
    render(...args) {
      context.output = super.render(...args);
      return context.output;
    }
  }
  context.Spy = Spy;
  return context;
}

const renderSpy = vdom => {
  return spyComponent(vdom.nodeName).render(vdom);
};

module.exports = renderSpy;
