const {render, rerender} = require('preact');
const isEqual = require('lodash.isequal');

const {isWhere} = require('./is-where');
const {selToWhere} = require('./sel-to-where');

const config = {
  SPY_PRIVATE_KEY: 'SPY_PRIVATE_KEY',
};

const spyWalk = (context, vdom, depth) => {
  if (!vdom) {
    return vdom;
  }
  const spyCreator = depth > context.renderedDepth ? createNoopSpy : createSpy;
  if (typeof vdom.nodeName === 'function' && !vdom.nodeName.isSpy) {
    vdom = Object.assign({}, vdom, {
      nodeName: spyCreator(context, vdom.nodeName),
      attributes: Object.assign({}, vdom.attributes, {
        [config.SPY_PRIVATE_KEY]: {vdom, depth},
      }),
    });
  }
  else if (vdom.children) {
    vdom = Object.assign({}, vdom, {
      children: vdom.children.map(child => spyWalk(context, child, depth)),
    });
  }
  return vdom;
};

const popSpyKey = _props => {
  const {vdom: spyKey, depth: spyDepth} = _props[config.SPY_PRIVATE_KEY];
  delete _props[config.SPY_PRIVATE_KEY];
  return [spyKey, spyDepth, _props];
};

const setVDom = (context, spyKey, vdom) => {
  context.vdomMap.set(spyKey, vdom);
  return vdom;
};

const NoopSpy = ()=>{};

const _createNoopSpy = (context, Component) => {
  return function(_props) {
    const [,, props] = popSpyKey(_props);
    const vdom = {
      nodeName: NoopSpy,
      attributes: Object.assign({
        component: Component,
      }, props),
      children: props.children,
    };
    delete vdom.attributes.children;
    return vdom;
  };
};

const createFuncSpy = (context, Component) => {
  return function(_props, ...args) {
    const [spyKey, depth, props] = popSpyKey(_props);
    const output = Component.call(this, props, ...args);
    return spyWalk(context, setVDom(context, spyKey, output), depth + 1);
  };
};

const createClassSpy = (context, Component) => {
  class Spy extends Component {
    constructor(_props, ...args) {
      const [spyKey, spyDepth, props] = popSpyKey(_props);
      super(props, ...args);
      context.keyMap.set(this, spyKey);
      context.depthMap.set(this, spyDepth);
    }

    componentWillReceiveProps(_props, ...args) {
      const [spyKey, spyDepth, props] = popSpyKey(_props);
      context.keyMap.set(this, spyKey);
      context.depthMap.set(this, spyDepth);
      if (super.componentWillReceiveProps) {
        super.componentWillReceiveProps(props, ...args);
      }
    }

    render(...args) {
      const spyKey = context.keyMap.get(this);
      const spyDepth = context.depthMap.get(this);
      return spyWalk(context, setVDom(context, spyKey, super.render(...args)), spyDepth + 1);
    }
  }
  return Spy;
};

const createNoopSpy = (context, Component) => {
  if (context.componentNoopMap.get(Component)) {return context.componentNoopMap.get(Component);}

  const Spy = _createNoopSpy(context, Component);
  Spy.isSpy = true;

  context.componentNoopMap.set(Component, Spy);

  return Spy;
};

const createSpy = (context, Component) => {
  if (context.componentMap.get(Component)) {return context.componentMap.get(Component);}

  let Spy;
  if (!Component.prototype.render) {
    Spy = createFuncSpy(context, Component);
  }
  else {
    Spy = createClassSpy(context, Component);
  }

  Spy.isSpy = true;

  context.componentMap.set(Component, Spy);

  return Spy;
};

const vdomIter = function* (vdomMap, vdom) {
  if (!vdom) {
    return;
  }
  yield vdom;
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
};

const skip = function* (count, iter) {
  for (let i = 0; i < count; i++) {
    if (iter.next().done) {break;}
  }
  yield* iter;
};

const vdomFilter = (pred, vdomMap, vdom) => {
  return Array.from(skip(1, vdomIter(vdomMap, vdom))).filter(pred);
};

class FindWrapper {
  constructor(context, _iter, selector) {
    // Set a non-enumerable property for context. In case a user does an deep
    // equal comparison this removes the chance for recursive comparisons.
    Object.defineProperty(this, 'context', {configurable: true, enumerable: false, value: context});
    this.length = 0;
    let iter = _iter;
    if (selector) {
      Object.defineProperty(this, 'selector', {enumerable: false, value: selector});
      iter = [].concat(...Array.from(iter, root => (
        Array.from(vdomFilter(isWhere(selToWhere(selector)), context.vdomMap, root))
      )));
    }
    iter
      .forEach((element, index) => {
        this[index] = element;
        this.length = index + 1;
      });
  }

  at(index) {
    if (index >= this.length) {
      throw new Error(`preact-render-spy: Must have enough results for .at(${index}).`);
    }

    return new FindWrapper(this.context, [this[index]]);
  }

  attr(name) {
    if (this.length > 1 || this.length === 0) {
      throw new Error(`preact-render-spy: Must have only 1 result for .attr(${name})`);
    }

    const item = this[0];
    if (
      typeof item === 'object' &&
      item.attributes &&
      item.attributes[name]
    ) {
      return item.attributes[name];
    }
  }

  /**
   * Return an object copy of the attributes from the first node that matched.
   */
  attrs() {
    if (this.length > 1 || this.length === 0) {
      throw new Error('preact-render-spy: Must have only 1 result for .attrs().');
    }

    return Object.assign({}, this[0].attributes);
  }

  /**
   * Return the text of all nested children concatenated together.
   */
  text() {
    return Array.from(vdomWalk(this.context.vdomMap, Array.from(this)))
      // Filter for strings (text nodes)
      .filter(value => typeof value === 'string')
      // Concatenate all strings together
      .join('');
  }

  contains(vdom) {
    return Array.from(vdomWalk(this.context.vdomMap, Array.from(this)))
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

  find(selector) {
    return new FindWrapper(this.context, Array.from(this), selector);
  }

  filter(selector) {
    return new FindWrapper(
      this.context,
      Array.from(this).filter(isWhere(selToWhere(selector)))
    );
  }

  output() {
    if (this.length > 1 || this.length === 0) {
      throw new Error('preact-render-spy: Must have only 1 result for .output().');
    }

    if (typeof this[0].nodeName !== 'function') {
      throw new Error('preact-render-spy: Must have a result of a preact class or function component for .output()');
    }

    return this.context.vdomMap.get(this[0]);
  }
}

class RenderContext extends FindWrapper {
  constructor({depth}) {
    super(null, []);

    Object.defineProperties(this, {
      context: {
        value: this,
        configurable: true,
        enumerable: false,
      },
      renderedDepth: {
        value: (depth || Infinity) - 1,
        enumerable: false,
      },
      keyMap: {
        value: new Map(),
        enumerable: false,
      },
      depthMap: {
        value: new Map(),
        enumerable: false,
      },
      componentMap: {
        value: new Map(),
        enumerable: false,
      },
      componentNoopMap: {
        value: new Map(),
        enumerable: false,
      },
      vdomMap: {
        value: new Map(),
        enumerable: false,
      },
      fragment: {
        value: document.createDocumentFragment(),
        enumerable: false,
      },
    });
  }

  render(vdom) {
    this[0] = vdom;
    this.length = 1;
    Object.defineProperty(this, 'component', {
      enumerable: false,
      configurable: true,
      value: render(
        spyWalk(this, setVDom(this, 'root', vdom), 0),
        this.fragment
      ),
    });
    return this;
  }
}

const deep = (vdom, {depth = Infinity} = {}) => new RenderContext({depth}).render(vdom);
const shallow = vdom => deep(vdom, {depth: 1});

exports = module.exports = deep;

exports.config = config;
exports.deep = deep;
exports.default = deep;
exports.render = deep;
exports.shallow = shallow;
