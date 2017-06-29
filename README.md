# preact-render-spy

[![Build Status](https://travis-ci.org/mzgoddard/preact-render-spy.svg?branch=master)](https://travis-ci.org/mzgoddard/preact-render-spy)


preact-render-spy is a package designed to cover many of the use cases for testing
preact components.  The API is roughly modeled after enzyme, but we do not support
as many options currently.

## How it works

The main render method takes some arbitrary JSX and replaces any component nodes with
spies which wrap the component.  These spies then look at the rendered output of the
second level of JSX and stores a big map of all the JSX virtual DOM nodes that have
been created by your component.

There is also concept of limiting the `depth` of the rendering such that it will only resolve
a certain number of levels deep in the component tree.  The `depth` of the default renderer
is set to `Infinity`, and we provide another renderer called `shallow` to render with
`{ depth: 1 }`.

## Exported Methods

### `deep(jsx, {depth = Infinity} = {})`
Creates a new `RenderContext` and renders using `opts.depth` to specify how many components deep
it should allow the renderer to render.  Also exported as `render` and `default`.

### `shallow(jsx)`
Alias for `deep(jsx, {depth: 1})`

### `RenderContext#find(selector)`
Given a rendered context, `find` accepts a "css like" language of selectors to search through the
rendered vdom for given nodes.

* `find('.selector')` - searches for any nodes with `class` or `className` attribute that matches `selector`
* `find('#selector')` - searches for any nodes with an `id` attribute that matches `selector`
* `find('[selector]')` - searches for any nodes which have an attribute named `selector`
* `find('Selector')` - searches for any nodes which have a nodeName that matches `Selector`,
  this wills search for function/classes whos `name` is `Selector`, or `displayName` is `Selector`.
  If the `Selector` starts with a lower case letter, it will also check for tags like `div`.

This will return you a `FindWrapper` which has other useful methods for testing.

### `RenderContext#render(jsx)`
Re-renders the root level jsx node using the same depth initially requested.

### `FindWrapper`
Contains a selection of nodes from `RenderContext#find(selector)`.
Has numeric indexed properties and length like an array.

### `FindWrapper#at(index)`
Returns another `FindWrapper` at the specific index in the selection.  Similar to `wrapper[0]` but will
allow using other `FindWrapper` methods on the result.

### `FindWrapper#attr(name)`
Requires a single node selection to work.
Returns the value of the `name` attribute on the jsx node.

### `FindWrapper#attrs()`
Requires a single node selection to work.
Returns a copy of the attributes passed to the jsx node.

### `FindWrapper#contains(vdom)`
Searches for any children matching the vdom or text passed.

### `FindWrapper#text()`
Returns the flattened string of any text children of any child component.

### `FindWrapper#simulate(event, ...args)`
Looks for an attribute properly named `onEvent` or `onEventCapture` and calls it, passing the arguments.

### `FindWrapper#output()`
Requires a single Component or functional node.  Returns the raw vdom output of the given component.

## Examples

There are many examples in the source files.  Some [tests specific to shallow](https://github.com/mzgoddard/preact-render-spy/blob/master/src/shallow-render.test.js), [tests specific to deep](https://github.com/mzgoddard/preact-render-spy/blob/master/src/deep-render.test.js), and many more [tests against both](https://github.com/mzgoddard/preact-render-spy/blob/master/src/shared-render.test.js).

### Simulate Clicks:
```jsx
class Node extends Component {
  constructor(...args) {
    super(...args);

    this.state = {count: 0};
    this.onClick = this.onClick.bind(this);
  }

  onClick() {
    this.setState({count: this.state.count + 1});
  }

  render({}, {count}) {
    return <div onClick={this.onClick}>{count}</div>;
  }
}
const context = shallow(<Node/>);
expect(context.find('div').contains('0')).toBeTruthy();
context.find('[onClick]').simulate('click');
expect(context.find('div').contains('1')).toBeTruthy();
```

