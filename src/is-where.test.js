const {h, Component} = require('preact');

const {isWhere} = require('./is-where');

it('tests tag names', () => {
  expect(isWhere({nodeName: 'div'})(<div />)).toBeTruthy();
});

it('tests Component names', () => {
  class Node extends Component {}
  const NodelessConst = () => {};
  function NodelessFunc() {}
  expect(isWhere({nodeName: 'Node'})(<Node />)).toBeTruthy();
  expect(isWhere({nodeName: 'NodelessConst'})(<NodelessConst />)).toBeTruthy();
  expect(isWhere({nodeName: 'NodelessFunc'})(<NodelessFunc />)).toBeTruthy();
});

it('tests nested attributes', () => {
  expect(isWhere({attributes: {class: 'class'}})(<div class="class" />))
  .toBeTruthy();
});