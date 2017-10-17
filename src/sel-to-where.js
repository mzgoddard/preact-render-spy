const {ATTRIBUTE_PRESENT} = require('./is-where');

const selToWhere = sel => {
  if (typeof sel === 'object') {
    return sel;
  }
  if (/^\./.test(sel)) {
    return {attributes: {class: sel.substring(1)}};
  }
  else if (/^#/.test(sel)) {
    return {attributes: {id: sel.substring(1)}};
  }
  else if (/^\[/.test(sel)) {
    return {attributes: {[sel.substring(1, sel.length - 1)]: ATTRIBUTE_PRESENT}};
  }

  return {nodeName: sel};
};

module.exports = {
  selToWhere,
};
