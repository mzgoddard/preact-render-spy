const entries = require('object.entries');

const _isWhere = (where, target) => {
  for (let [key, value] of entries(where)) {
    if (typeof value === 'object') {
      if (!(Boolean(target[key]) && _isWhere(value, target[key]))) {
        return false;
      }
    }
    else if (key === 'nodeName') {
      if (typeof target.nodeName === 'function') {
        if (target.nodeName.name !== value && target.nodeName.displayName !== value) {
          return false;
        }
      }
      else if (/[a-z]/.test(value[0])) {
        if (target.nodeName !== value) {
          return false;
        }
      }
      else {
        return false;
      }
    }
    else if (key === 'class') {
      let attr = target.class || target.className;
      if (typeof attr === 'object') {
        attr = Object.keys(attr).filter(key => attr[key]);
      }
      else if (typeof attr === 'string') {
        attr = attr.split(/\s+/);
      }

      if (!attr || attr.indexOf(value) === -1) {
        return false;
      }
    }
    else if (value === null) {
      if (!(key in target)) {
        return false;
      }
    }
    else if (Array.isArray(value)) {
      if (!value.some(test => target[key] === test)) {
        return false;
      }
    }
    else if (!target || target[key] !== value) {
      return false;
    }
  }
  return true;
};

const isWhere = where => value => _isWhere(where, value);

module.exports = {
  _isWhere,
  isWhere,
};
