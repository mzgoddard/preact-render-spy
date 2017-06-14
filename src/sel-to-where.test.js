const {selToWhere} = require('./sel-to-where');

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
  expect(selToWhere('[attr]')).toEqual({attributes: {attr: null}});
  expect(selToWhere('[onClick]')).toEqual({attributes: {onClick: null}});
});
