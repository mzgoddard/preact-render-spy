const {render, rerender} = require('preact');
const isEqual = require('lodash.isequal');

const {isWhere} = require('./is-where');
const {selToWhere} = require('./sel-to-where');

const SPY_PRIVATE_KEY = 'SPY_PRIVATE_KEY';

const spyWalk = (spy, vdom) => {
  if (typeof vdom.nodeName === 'function' && !vdom.nodeName.isSpy) {
    vdom = Object.assign({}, vdom, {
      nodeName: createSpy(spy, vdom.nodeName),
      attributes: Object.assign({}, vdom.attributes, {
        [SPY_PRIVATE_KEY]: vdom,
      }),
    });
  }
  else if (vdom.children) {
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
    return new FindWrapper(this, [this.vdomMap.get('root')], selector);
  }

  render(vdom) {
    this.component = render(
      spyWalk(this, setVDom(this, 'root', vdom)),
      this.fragment
    );
    return this;
  }
}

const vdomIter = function* (vdomMap, vdom) {
  if (vdom) {
    yield vdom;
  }
  if (typeof vdom.nodeName === 'function') {
    yield* vdomIter(vdomMap, vdomMap.get(vdom));
  }
  else {
    for (const child of (vdom.children || [])) {
      yield* vdomIter(vdomMap, child);
    }
  }
};

const vdomWalk = function* (vdomMap, iter) {
  for (const vdom of iter) {
    yield* vdomIter(vdomMap, vdom);
  }
  // // Flatten into one array of all nodes
  // return [].concat(...Array.from(this, vdom => (
  //   Array.from(vdomIter(this.spy.vdomMap, vdom))
  // )));
}

const vdomFilter = (pred, vdomMap, vdom) => {
  return Array.from(vdomIter(vdomMap, vdom)).filter(pred);
};

const vdomContains = (pred, vdomMap, vdom) => {
  return vdomFilter(pred, vdomMap, vdom).length > 0;
};

class FindWrapper {
  constructor(spy, _iter, selector) {
    this.spy = spy;
    this.length = 0;
    let iter = _iter;
    if (selector) {
      this.selector = selector;
      iter = [].concat(...Array.from(iter, root => (
        Array.from(vdomFilter(isWhere(selToWhere(selector)), spy.vdomMap, root))
      )));
    }
    iter
    .forEach((element, index) => {
      this[index] = element;
      this.length = index + 1;
    });
  }

  at(index) {
    return new FindWrapper(this.spy, [this[index]]);
  }

  attr(name) {
    for (const item of Array.from(this)) {
      if (
        typeof item === 'object' &&
        item.attributes &&
        item.attributes[name]
      ) {
        return item.attributes[name];
      }
    }
  }

  /**
   * Return the text of all nested children concatenated together.
   */
  text() {
    return Array.from(vdomWalk(this.spy.vdomMap, Array.from(this)))
    // Filter for strings (text nodes)
    .filter(value => typeof value === 'string')
    // Concatenate all strings together
    .reduce((carry, value) => carry + value);
  }

  contains(vdom) {
    return Array.from(vdomWalk(this.spy.vdomMap, Array.from(this)))
    .filter(value => isEqual(vdom, value))
    .length > 0;
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
