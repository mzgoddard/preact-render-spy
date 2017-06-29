const {h, Component} = require('preact');

const {deep, shallow} = require('./preact-render-spy');

it('shallow renders the first level of Components', () => {
  const ErrorIfRendered = () => {throw new Error('should not ever render');};
  const Node = () => <ErrorIfRendered />;
  expect(() => deep(<Node />)).toThrow();
  expect(() => shallow(<Node />)).not.toThrow();

  const context = shallow(<Node />);
  expect(context.find('ErrorIfRendered').length).toBe(1);
});
