const {render, rerender} = require('preact');

const {isWhere} = require('./is-where');
const {selToWhere} = require('./sel-to-where');

const SPY_PRIVATE_KEY = 'SPY_PRIVATE_KEY';

const privateKey = () => Math.random().toString(16).substring(2);

const spyWalk = (spy, vdom) => {
  if (typeof vdom.nodeName === 'function' && !vdom.nodeName.isSpy) {
    vdom = Object.assign({}, vdom, {
      nodeName: createSpy(spy, vdom.nodeName),
      attributes: Object.assign({}, vdom.attributes, {
        [SPY_PRIVATE_KEY]: vdom,
      }),
    });
  }
  else {
    vdom = Object.assign({}, vdom, {
      children: vdom.children.map(child => spyWalk(spy, child)),
    });
  }
  return vdom;
};

const popSpyKey = _props => {
  const spyKey = _props[SPY_PRIVATE_KEY];
  delete _props[SPY_PRIVATE_KEY];
  return [spyKey, _props];
};

const setVDom = (spy, spyKey, vdom) => {
  spy.vdomMap.set(spyKey, vdom);
  return vdom;
};

const createFuncSpy = (spy, Component) => {
  return function(_props, ...args) {
    const [spyKey, props] = popSpyKey(_props);
    const output = Component.call(this, props, ...args);
    return spyWalk(spy, setVDom(spy, spyKey, output));
  };
};

const createClassSpy = (spy, Component) => {
  class Spy extends Component {
    constructor(_props, ...args) {
      const [spyKey, props] = popSpyKey(_props);
      super(props, ...args);
      spy.keyMap.set(this, spyKey);
    }

    componentWillReceiveProps(_props, ...args) {
      const [spyKey, props] = popSpyKey(_props);
      spy.keyMap.set(this, spyKey);
      if (super.componentWillReceiveProps) {
        super.componentWillReceiveProps(props, ...args);
      }
    }

    render(...args) {
      const spyKey = spy.keyMap.get(this);
      return spyWalk(spy, setVDom(spy, spyKey, super.render(...args)));
    }
  }
  return Spy;
};

const createSpy = (spy, Component) => {
  if (spy.componentMap.get(Component)) {return spy.componentMap.get(Component);}

  let Spy;
  if (!Component.prototype.render) {
    Spy = createFuncSpy(spy, Component);
  }
  else {
    Spy = createClassSpy(spy, Component);
  }

  Spy.isSpy = true;

  spy.componentMap.set(Component, Spy);

  return Spy;
};

class SpyWrapper {
  constructor(Component) {
    this.keyMap = new Map();
    this.componentMap = new Map();
    this.vdomMap = new Map();
    this.fragment = document.createDocumentFragment();
  }

  find(selector) {
    return new FindWrapper(this, this.vdomMap.get('root'), selector);
  }

  render(vdom) {
    this.component = render(
      spyWalk(this, setVDom(this, 'root', vdom)),
      this.fragment
    );
    return this;
  }
}

// const vdomIter = function* (spy, dom, spydom) {
//
// };

const vdomWalk = (pred, spy, vdom, result = []) => {
  if (pred(vdom)) {
    result.push(vdom);
  }

  if (typeof vdom.nodeName === 'function') {
    vdomWalk(pred, spy, spy.vdomMap.get(vdom), result);
  }
  else {
    vdom.children.forEach(child => vdomWalk(pred, spy, child, result));
  }

  return result;
};

class FindWrapper {
  constructor(spy, root, selector) {
    this.spy = spy;
    this.root = root;
    this.selector = selector;
    vdomWalk(isWhere(selToWhere(selector)), spy, root)
    .forEach((element, index) => {
      this[index] = element;
      this.length = index + 1;
    });
  }

  simulate(event, ...args) {
    for (let i = 0; i < this.length; i++) {
      const vdom = this[i];
      const eventlc = event.toLowerCase();
      const eventKeys = new Set([`on${eventlc}`, `on${eventlc}capture`]);

      for (const key in vdom.attributes) {
        if (eventKeys.has(key.toLowerCase())) {
          vdom.attributes[key](...args);
          break;
        }
      }
    }
    rerender();
  }
}

const renderSpy = vdom => {
  return new SpyWrapper().render(vdom);
};

module.exports = renderSpy;
