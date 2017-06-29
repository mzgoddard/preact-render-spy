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

  return {nodeName: sel};

};

module.exports = {
  selToWhere,
};
