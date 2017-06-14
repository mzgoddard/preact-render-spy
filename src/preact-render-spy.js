const {render} = require('preact');

const events = require('./events');

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
  class Spy extends Component {
    render(...args) {
      const output = super.render(...args);
      spy._output(this, output);
      return spyWalk(spy, output);
    }
  }

  Spy.isSpy = true;

  return Spy;
};

class SpyWrapper {
  constructor(Component) {
    this.domMap = new Map();
    this.fragment = document.createDocumentFragment();
  }

  _output(nodeName, vdom) {
    if (typeof nodeName === 'string') {
      this.domMap.set(nodeName, vdom);
    }
    else {
      this.domMap.set(nodeName.constructor, vdom);
    }
  }

  output(selector) {
    return this._getVDom(this.fragment.querySelector(selector));
  }

  find(selector) {
    return new FindWrapper(this, this.fragment, selector);
  }

  _getVDom(element) {
    const indexPath = [];
    while (element.parentNode !== this.fragment) {
      const parentNode = element.parentNode;
      indexPath.unshift(Array.from(parentNode.children).indexOf(element));
      element = parentNode;
    }
    let vdom = this.domMap.get(this._rootConstructor);
    while (indexPath.length) {
      while (typeof vdom.nodeName === 'function') {
        vdom = this.domMap.get(vdom.nodeName);
      }
      vdom = vdom.children[indexPath.shift()];
    }
    while (typeof vdom.nodeName === 'function') {
      vdom = this.domMap.get(vdom.nodeName);
    }
    return vdom;
  }

  render(vdom) {
    vdom = spyWalk(this, vdom);
    this._rootConstructor = vdom.nodeName;
    if (typeof vdom.nodeName === 'string') {
      this._output(vdom.nodeName, vdom);
    }
    this.component = render(vdom, this.fragment);
    return this;
  }
}

class FindWrapper {
  constructor(spy, root, selector) {
    this.spy = spy;
    this.root = root;
    this.selector = selector;
    Array.from(root.querySelectorAll(selector))
    .forEach((element, index) => {
      this[index] = element;
      this.length = index + 1;
    });
  }

  simulate(event, ...args) {
    for (let i = 0; i < this.length; i++) {
      const vdom = this.spy._getVDom(this[i]);
      const handle = vdom.attributes && vdom.attributes[events[event]];
      if (handle) {
        handle(...args);
      }
    }
    return new Promise(resolve => setTimeout(resolve, 0));
  }
}

const renderSpy = vdom => {
  return new SpyWrapper().render(vdom);
};

module.exports = renderSpy;
