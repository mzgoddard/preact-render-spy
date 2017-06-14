const {render, rerender} = require('preact');

const {isWhere} = require('./is-where');
const {selToWhere} = require('./sel-to-where');

const spyWalk = (spy, vdom) => {
  if (typeof vdom.nodeName === 'function' && !vdom.nodeName.isSpy) {
    vdom = Object.assign({}, vdom, {nodeName: createSpy(spy, vdom.nodeName)});
  }
  else {
    vdom = Object.assign({}, vdom, {
      children: vdom.children.map(child => spyWalk(spy, child)),
    });
  }
  return vdom;
};

const createSpy = (spy, Component) => {
  let Spy;
  if (!Component.prototype.render) {
    Spy = function(...args) {
      const output = Component.call(this, ...args);
      return spy._output(Spy, output), spyWalk(spy, output);
    };
  }
  else {
    class _Spy extends Component {
      render(...args) {
        const output = super.render(...args);
        return spy._output(this.constructor, output, spyWalk(spy, output));
      }
    }
    Spy = _Spy;
  }

  Spy.isSpy = true;

  return Spy;
};

class SpyWrapper {
  constructor(Component) {
    this.map = new Map();
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
    const spydom = this._output('root', vdom, spyWalk(this, vdom));
    this._rootConstructor = vdom.nodeName;
    if (typeof vdom.nodeName === 'string') {
      this._output(vdom.nodeName, vdom, spydom);
    }
    this.component = render(spydom, this.fragment);
    return this;
  }
}

const vdomWalk = (pred, spy, dom, spydom, result = []) => {
  if (pred(dom)) {
    result.push(dom);
  }

  if (typeof dom.nodeName === 'function') {
    vdomWalk(pred, spy, spy.domMap.get(spydom.nodeName), spy.vdomMap.get(spydom.nodeName), result);
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
