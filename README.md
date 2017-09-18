# preact-render-spy

preact-render-spy is a package designed to cover many of the use cases for testing
preact components.  The API is roughly modeled after enzyme, but we do not support
as many options currently.

[![Build Status](https://travis-ci.org/mzgoddard/preact-render-spy.svg?branch=master)](https://travis-ci.org/mzgoddard/preact-render-spy)

## Support:

We do our best to support Node.JS v6.11.0 and up, and speficially testing with jest, though other test runners should have no problems.

## Expressive Testing Example:

```jsx
import {h} from 'preact';
import {shallow} from 'preact-render-spy';
import Testable from './testable';

it('lets you do cool things with preact components', () => {
  const context = shallow(<Testable />);
  expect(context.find('div').contains(<a>link</a>)).toBeTruthy();
  context.find('[onClick]').simulate('click');
  expect(context.find('a').text()).toBe('clicked');
});
```

## How it works

The main render method takes some arbitrary JSX and replaces any component nodes with
spies which wrap the component.  These spies then look at the rendered output of the
second level of JSX and stores a big map of all the JSX virtual DOM nodes that have
been created by your component.

There is also concept of limiting the `depth` of the rendering such that it will only resolve
a certain number of levels deep in the component tree.  The `depth` of the default renderer
is set to `Infinity`, and we provide another renderer called `shallow` to render with
`{ depth: 1 }`.

## Jest Snapshot support
We provide a plugin for rendering your jsx snapshots to a formatted string that you can enable
using the jest configuration:

```json
{
  "snapshotSerializers": [ "preact-render-spy/snapshot" ]
}
```

## Configuration
We export a `config` object which you can use to change some of the internal options.
The values shown in this section are the defaults:

```js
import {config} from 'preact-render-spy';

// This property is used by the spy renderer to pass information to the spies about where
// they are in the vdom tree, it is generally removed from the properties passed down to your
// component, but it might show up in some cases, and we want you to be able to pick it.
config.SPY_PRIVATE_KEY = 'SPY_PRIVATE_KEY';

// These options are passed to preact-render-to-string/jsx whenever you snapshot a VNode or
// FindWrapper (and on the FindWrapper's toString method)
config.toStringOptions = { shallow: true, skipFalseAttributes: false };

// This option allows you to use a custom DOM implementation instead of relying on a global
// document.createDocumentFragment()
config.createFragment = () => document.createDocumentFragment();
```

## Exported Methods

### `deep(jsx, {depth = Infinity} = {})`
Creates a new `RenderContext` and renders using `opts.depth` to specify how many components deep
it should allow the renderer to render.  Also exported as `render` and `default`.

Example:
```jsx
const Deeper = () => <div>Until Infinity!</div>;
const Second = () => <Deeper />;
const First = () => <Second />;

let context;
context = deep(<First />);
expect(context.find('div').text()).toBe('Until Infinity!');

context = deep(<First />, { depth: 2 });
// We rendered First and Second, but not Deeper, so we never render a <div>
expect(context.find('div').length).toBe(0);
```

### `shallow(jsx)`
Creates a new `RenderContext` with `{ depth: 1 }`.

### `RenderContext#find(selector)`
Given a rendered context, `find` accepts a "css like" language of selectors to search through the
rendered vdom for given nodes.  **NOTE:** We only support this very limited set of "selectors", and no nesting.
We may expand this selector language in future versions, but it acheives our goals so far!

* `find('.selector')` - searches for any nodes with `class` or `className` attribute that matches `selector`
* `find('#selector')` - searches for any nodes with an `id` attribute that matches `selector`
* `find('[selector]')` - searches for any nodes which have an attribute named `selector`
* `find('Selector')` - searches for any nodes which have a nodeName that matches `Selector`,
  this wills search for function/classes whos `name` is `Selector`, or `displayName` is `Selector`.
  If the `Selector` starts with a lower case letter, it will also check for tags like `div`.

This will return you a [`FindWrapper`](#findwrapper) which has other useful methods for testing.

### `RenderContext` extends `FindWrapper`

Like [`#find(selector)`](#rendercontextfindselector) `RenderContext` has the rest of `FindWrapper`'s methods.

### `RenderContext#render(jsx)`
Re-renders the root level jsx node using the same depth initially requested.  This can be useful for testing
`componentWillReceiveProps` hooks.

Example:

```jsx
const Node = ({name}) => <div>{name}</div>
const context = shallow(<Node name="example" />);
expect(context.find('div').text()).toBe('example');

context.render(<Node name="second" />);
expect(context.find('div').text()).toBe('second');
```

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
Requires a single Component or functional node. Returns the vdom output of the given component.
Any Component or functional nodes will be "recursive" up to the depth you specified.  I.E.:

Example:
```jsx

const Second = ({ children }) => <div>second {children}</div>;
const First = () => <Second>first</Second>;

// rendered deep, we get the div output
expect(deep(<First />).output()).toEqual(<div>second first</div>);
// rendered shallow, we get the <Second> jsx node back
expect(shallow(<First />).output()).toEqual(<Second>first</Second>);
```

### `FindWrapper#filter(selector)`
Returns a new `FindWrapper` with a subset of the previously selected elements given the selector argument.

Uses the same possible selectors as [`RenderContext#find(selector)`](#rendercontextfindselector).

### `FindWrapper#find(selector)`
Selects descendents of the elements previously selected. Returns a new `FindWrapper` with the newly selected elements.

Uses the same possible selectors as [`RenderContext#find(selector)`](#rendercontextfindselector).

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

### Testing Lifecycle Events

```jsx
import { h, Component } from 'preact';
import { shallow } from 'preact-render-spy';

// Example of testing componentWillUnmount
class Unmount extends Component {

  componentWillUnmount() {
    this.props.onUnmount(this);
  }

  render() {
    return <div>Unmount me</div>;
  }
}

it('triggers unmount', () => {
  const trigger = jest.fn();
  const context = shallow(<Unmount onUnmount={trigger} />);
  expect(trigger).not.toHaveBeenCalled();

  // This will trigger the componentWillUnmount
  context.render(null);
  expect(trigger).toHaveBeenCalled();
});

// Example of testing some side effects with componentWillReceiveProps
class ReceivesProps extends Component {
  constructor(props) {
    this.state = { value: props.value };
  }

  componentWillReceiveProps({ value }) {
    if (value !== this.props.value) {
      this.setState({ value: `_${value}_` })
    }
  }

  render() {
    return <div>{this.state.value}</div>
  }
}

it('receives props', () => {
  const context = shallow(<ReceivesProps value="test" />);
  expect(context.text()).toBe('test');

  context.render(<ReceivesProps value="second" />);
  expect(context.text()).toBe('_second_');
});
```
