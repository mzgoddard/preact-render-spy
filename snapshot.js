const renderToString = require('preact-render-to-string');

module.exports = {
  test(object) {
    return object && typeof object==='object' && 'nodeName' in object && 'attributes' in object && 'children' in object && !('nodeType' in object);
  },
  print(val) {
    return renderToString(val, {}, {shallow: true}, true);
  },
};
