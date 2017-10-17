const {h} = require('preact');
const {selToWhere} = require('./sel-to-where');
const {ATTRIBUTE_PRESENT} = require('./is-where');

it('node names', () => {
  expect(selToWhere('div')).toEqual({nodeName: 'div'});
  expect(selToWhere('Node')).toEqual({nodeName: 'Node'});
});

it('classes', () => {
  expect(selToWhere('.class')).toEqual({attributes: {class: 'class'}});
});

it('ids', () => {
  expect(selToWhere('#id')).toEqual({attributes: {id: 'id'}});
});

it('attributes', () => {
  expect(selToWhere('[attr]')).toEqual({attributes: {attr: ATTRIBUTE_PRESENT}});
  expect(selToWhere('[onClick]')).toEqual({attributes: {onClick: ATTRIBUTE_PRESENT}});
});

it('vdom', () => {
  expect(selToWhere(<div testAttr={true} />)).toEqual(<div testAttr={true} />);
});
