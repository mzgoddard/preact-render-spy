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
        [SPY_PRIVATE_KEY]: privateKey(),
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

const createSpy = (spy, Component) => {
  if (spy.componentMap.get(Component)) {return spy.componentMap.get(Component);}

  let Spy;
  if (!Component.prototype.render) {
    Spy = function(_props, ...args) {
      const [spyKey, props] = popSpyKey(_props);
      const output = Component.call(this, props, ...args);
      return spy._output(spyKey, output, spyWalk(spy, output));
    };
  }
  else {
    class _Spy extends Component {
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
        const output = super.render(...args);
        return spy._output(spyKey, output, spyWalk(spy, output));
      }
    }
    Spy = _Spy;
  }

  Spy.isSpy = true;

  spy.componentMap.set(Component, Spy);

  return Spy;
};

class SpyWrapper {
  constructor(Component) {
    this.keyMap = new Map();
    this.componentMap = new Map();
    this.domMap = new Map();
    this.vdomMap = new Map();
    this.fragment = document.createDocumentFragment();
  }

  _output(nodeName, vdom, spyVDom) {
    this.domMap.set(nodeName, vdom);
    this.vdomMap.set(nodeName, spyVDom);
    return spyVDom;
  }

  find(selector) {
    return new FindWrapper(this, this.domMap.get('root'), this.vdomMap.get('root'), selector);
  }

  render(vdom) {
    const spyNodeName = this.componentMap.get(vdom.nodeName);
    const spydom = this._output('root', vdom, spyWalk(this, vdom));
    this.component = render(spydom, this.fragment);
    return this;
  }
}

const vdomWalk = (pred, spy, dom, spydom, result = []) => {
  if (pred(dom)) {
    result.push(dom);
  }

  if (typeof dom.nodeName === 'function') {
    const spyKey = spydom.attributes[SPY_PRIVATE_KEY];
    vdomWalk(pred, spy, spy.domMap.get(spyKey), spy.vdomMap.get(spyKey), result);
  }
  else {
    dom.children.forEach((child, i) => (
      vdomWalk(pred, spy, child, spydom.children[i], result)
    ));
  }

  return result;
};

class FindWrapper {
  constructor(spy, root, spyroot, selector) {
    this.spy = spy;
    this.root = root;
    this.spyroot = spyroot;
    this.selector = selector;
    vdomWalk(isWhere(selToWhere(selector)), spy, root, spyroot)
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
