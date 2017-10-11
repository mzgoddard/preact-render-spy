const entries = require('object.entries');

const ATTRIBUTE_PRESENT = {exists: true};

const _isWhere = (where, target) => {
  // Check each key from where
  for (const [key, value] of entries(where)) {

    // If the key is set, but value is undefined, we ignore it
    if (typeof value === 'undefined') {
      continue;
    }

    // Allow a way to check for the pressenece of an attribute with that name.
    if (value === ATTRIBUTE_PRESENT) {
      if (!(key in target)) {
        return false;
      }
      continue;
    }

    // Array checks
    if (Array.isArray(value)) {
      // [x,y,z] - allow the target value to be x, y, OR z
      if (value.length && !value.some(test => target[key] === test)) {
        return false;
      }
      continue;
    }

    // Null check
    if (value === null) {
      if (target[key] !== null) {
        return false;
      }
      continue;
    }

    // Object checks (recursion)
    if (typeof value === 'object') {
      if (!(Boolean(target[key]) && _isWhere(value, target[key]))) {
        return false;
      }
      continue;
    }

    // nodeName attributes
    if (key === 'nodeName') {
      // if the target is a component
      if (typeof target.nodeName === 'function') {
        // match the raw function value, name value, or displayName value
        if (target.nodeName !== value && target.nodeName.name !== value && target.nodeName.displayName !== value) {
          return false;
        }
      }
      else if (/[a-z]/.test(value[0])) {
        // nodeName starts with a lowercase letter = standard string nodenames
        if (target.nodeName !== value) {
          return false;
        }
      }
      else {
        // some unsupported nodeName query
        return false;
      }
      continue;
    }

    if (key === 'class' || key === 'className') {
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
      continue;
    }

    if (!target || target[key] !== value) {
      return false;
    }
  }
  return true;
};

const isWhere = where => value => _isWhere(where, value);

module.exports = {
  _isWhere,
  isWhere,
  ATTRIBUTE_PRESENT,
};
