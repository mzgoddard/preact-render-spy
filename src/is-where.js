const entries = require('object.entries');

const _isWhere = (where, target) => {
  let all = true;
  for (let [key, value] of entries(where)) {
    if (typeof value === 'object') {
      all = all && Boolean(target[key]) && _isWhere(value, target[key]);
    }
    else if (key === 'nodeName') {
      if (typeof target.nodeName === 'function') {
        all = all && (target.nodeName.name === value || target.nodeName.displayName === value);
      }
      else if (/[a-z]/.test(value[0])) {
        all = all && target.nodeName === value;
      }
      else {
        all = false;
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
    // break the loop if we hit any falsyness
    if (!all) {
      break;
    }
  }
  return all;
};

const isWhere = where => value => _isWhere(where, value);

module.exports = {
  _isWhere,
  isWhere,
};
