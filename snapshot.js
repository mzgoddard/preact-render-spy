const renderToString = require('preact-render-to-string/jsx');
const renderSpy = require('./src/preact-render-spy');
const FindWrapper = renderSpy.FindWrapper;
const config = renderSpy.config;

module.exports = {
  test(object) {
    if (!object || typeof object !== 'object') {
      return false;
    }

    if (object instanceof FindWrapper) {
      // is FindWrapper!
      return true;
    }

    if ('nodeName' in object && 'attributes' in object && 'children' in object && !('nodeType' in object)) {
      // is VNode!
      return true;
    }

    return false;
  },
  print(val) {
    if (val instanceof FindWrapper) {
      return val.toString();
    }
    return renderToString(val, {}, config.toStringOptions, true);
  },
};
