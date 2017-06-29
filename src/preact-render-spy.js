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
  if (typeof vdom.nodeName === 'function' && !vdom.nodeName.isSpy) {
    vdom = Object.assign({}, vdom, {
      nodeName: (depth > context.renderedDepth ? createNoopSpy : createSpy)(
        context, vdom.nodeName,
      ),
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

class RenderContext {
  constructor({depth}) {
    this.renderedDepth = (depth || Infinity) - 1;

    this.keyMap = new Map();
    this.depthMap = new Map();
    this.componentMap = new Map();
    this.componentNoopMap = new Map();
    this.vdomMap = new Map();
    this.fragment = document.createDocumentFragment();
  }

  find(selector) {
    return new FindWrapper(this, [this.vdomMap.get('root')], selector);
  }

  render(vdom) {
    this.component = render(
      spyWalk(this, setVDom(this, 'root', vdom), 0),
      this.fragment
    );
    return this;
  }
}

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

const vdomFilter = (pred, vdomMap, vdom) => {
  return Array.from(vdomIter(vdomMap, vdom)).filter(pred);
};

class FindWrapper {
  constructor(context, _iter, selector) {
    this.context = context;
    this.length = 0;
    let iter = _iter;
    if (selector) {
      this.selector = selector;
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
    return new FindWrapper(this.context, [this[index]]);
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
   * Return an object copy of the attributes from the first node that matched.
   */
  attrs() {
    if (!this[0]) {
      return null;
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
}

const deep = (vdom, {depth = Infinity} = {}) => new RenderContext({depth}).render(vdom);
const shallow = vdom => deep(vdom, {depth: 1});

exports = module.exports = deep;

exports.config = config;
exports.deep = deep;
exports.default = deep;
exports.render = deep;
exports.shallow = shallow;
