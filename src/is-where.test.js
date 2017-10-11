const {h, Component} = require('preact');

const {isWhere} = require('./is-where');

it('tests tag names', () => {
  expect(isWhere({nodeName: 'div'})(<div />)).toBeTruthy();
});

it('tests class names', () => {
  const testClass = isWhere({attributes: {class: 'test'}});
  expect(testClass(<div class="test" />)).toBeTruthy();
  expect(testClass(<div class="nottest" />)).toBeFalsy();
  expect(testClass(<div class="nottest and test" />)).toBeTruthy();
  expect(testClass(<div class={{nottest: false, test: true }} />)).toBeTruthy();
  expect(testClass(<div class={{test: false}} />)).toBeFalsy();
  expect(testClass(<div className="test" />)).toBeTruthy();
  expect(testClass(<div className={{test: true}} />)).toBeTruthy();
});

it('tests Component names', () => {
  class Node extends Component {}
  const NodelessConst = () => {};
  function NodelessFunc() {}
  function DisplayNamedFunc() {}
  DisplayNamedFunc.displayName = 'displayName';

  expect(isWhere({nodeName: 'Node'})(<Node />)).toBeTruthy();
  expect(isWhere({nodeName: 'NodelessConst'})(<NodelessConst />)).toBeTruthy();
  expect(isWhere({nodeName: 'NodelessFunc'})(<NodelessFunc />)).toBeTruthy();
  expect(isWhere({nodeName: 'displayName'})(<DisplayNamedFunc />)).toBeTruthy();
});

it('tests vdom names', () => {
  class Node extends Component {}
  const NodelessConst = () => {};
  function NodelessFunc() {}
  function DisplayNamedFunc() {}
  DisplayNamedFunc.displayName = 'displayName';

  expect(isWhere(<Node />)(<Node />)).toBeTruthy();
  expect(isWhere(<NodelessConst />)(<NodelessConst />)).toBeTruthy();
  expect(isWhere(<NodelessFunc />)(<NodelessFunc />)).toBeTruthy();
  expect(isWhere(<DisplayNamedFunc />)(<DisplayNamedFunc />)).toBeTruthy();
});



it('tests nested attributes', () => {
  expect(isWhere({attributes: {class: 'class'}})(<div class="class" />))
    .toBeTruthy();
});
