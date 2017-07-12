const renderToString = require('preact-render-to-string/jsx');
const FindWrapper = require('./src/preact-render-spy').FindWrapper;

module.exports = {
  test(object) {
    const isObject = object && typeof object==='object';
    const isVNode = isObject && 'nodeName' in object && 'attributes' in object && 'children' in object && !('nodeType' in object);
    const isFindWrapper = isObject && object instanceof FindWrapper;
    return isVNode || isFindWrapper;
  },
  print(val) {
    if (val instanceof FindWrapper) {
      return val.toString();
    }
    return renderToString(val, {}, {shallow: true}, true);
  },
};
