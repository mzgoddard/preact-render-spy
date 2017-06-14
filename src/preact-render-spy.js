const {render} = require('preact');

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

  // output(selector) {
  //   return this._getVDom(this.fragment.querySelector(selector));
  // }

  find(selector) {
    return new FindWrapper(this, this.domMap.get('root'), this.vdomMap.get('root'), selector);
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
    const spydom = this._output('root', vdom, spyWalk(this, vdom));
    this._rootConstructor = vdom.nodeName;
    if (typeof vdom.nodeName === 'string') {
      this._output(vdom.nodeName, vdom, spydom);
    }
    this.component = render(spydom, this.fragment);
    return this;
  }
}

const _isWhere = (where, target) => {
  let all = true;
  for (let [key, value] of Object.entries(where)) {
    if (typeof value === 'object') {
      all = all && Boolean(target[key]) && _isWhere(value, target[key]);
    }
    else if (key === 'nodeName') {
      if (/[a-z]/.test(value[0])) {
        all = all && target.nodeName === value;
      }
      else {
        all = all && Boolean(target.nodeName.constructor) &&
          target.nodeName.constructor.name === value;
      }
    }
    else {
      if (value === null) {
        all = all && key in target;
      }
      else if (Array.isArray(value)) {
        all = value.reduce((carry, value) => (
          carry && target[key].indexOf(value) !== -1
        ), all);
      }
      else {
        all = all && Boolean(target) && target[key] === value;
      }
    }
  }
  return all;
};

const isWhere = where => value => _isWhere(where, value);

const selToWhere = sel => {
  if (/^\./.test(sel)) {
    return {attributes: {class: sel.substring(1)}};
  }
  else if (/^#/.test(sel)) {
    return {attributes: {id: sel.substring(1)}};
  }
  else if (/^\[/.test(sel)) {
    return {attributes: {[sel.substring(1, sel.length - 1)]: null}};
  }
  else {
    return {nodeName: sel};
  }
};

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
    return new Promise(resolve => setTimeout(resolve, 0));
  }
}

const renderSpy = vdom => {
  return new SpyWrapper().render(vdom);
};

module.exports = renderSpy;
