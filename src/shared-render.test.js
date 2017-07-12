const {h, Component} = require('preact');

const {deep, shallow} = require('./preact-render-spy');

class ReceivesProps extends Component {
  constructor(props) {
    super(props);
    this.state = {value: props.value};
  }

  componentWillReceiveProps(newProps) {
    this.setState({value: `_${newProps.value}_`});
  }

  render(props, {value}) {
    return (
      <div>{value}</div>
    );
  }
}

class Div extends Component {
  render() {
    return <div />;
  }
}

class DivChildren extends Component {
  render({children}) {
    return <div>{children}</div>;
  }
}

class ClickCount extends Component {
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

class DivCount extends Component {
  render({count}) {
    return <div>{count}</div>;
  }
}

const DivCountStateless = ({count}) => <div>{count}</div>;

const NullStateless = () => null;

const Second = ({ children }) => <div>second {children}</div>;
const First = () => <Second>first</Second>;

const sharedTests = (name, func) => {

  it(`${name}: renders into fragment`, () => {
    const context = func(<Div />);
    expect(context.fragment.children.length).toBe(1);
    expect(context.fragment.children[0].tagName).toBe('DIV');
    expect(context.find('div').length).toBe(1);
    expect(context.find('div').contains(<div />)).toBeTruthy();
  });

  it(`${name}: renders props`, () => {
    const context = func(<DivChildren>node</DivChildren>);
    expect(context.find('div').length).toBe(1);
    expect(context.find('div').text('node')).toBeTruthy();
  });

  it(`${name}: renders changes`, () => {
    const context = func(<DivChildren>node</DivChildren>);
    context.render(<DivChildren>node2</DivChildren>);
    expect(context.find('div').contains('node2')).toBeTruthy();
  });

  it(`${name}: renders change on click`, () => {
    const context = func(<ClickCount />);
    expect(context.find('div').contains('0')).toBeTruthy();
    context.find('div').simulate('click');
    expect(context.find('div').contains('1')).toBeTruthy();
  });

  it(`${name}: renders multiple components`, () => {
    const context = func(<div><DivCount count="1" /><DivCount count="2" /></div>);
    expect(context.find('div').contains('1')).toBeTruthy();
    expect(context.find('div').contains(<div>1</div>)).toBeTruthy();
    expect(context.find('div').contains('2')).toBeTruthy();
    expect(context.find('div').contains(<div>2</div>)).toBeTruthy();
  });

  it(`${name}: renders stateless components`, () => {
    const context = func(<DivCountStateless count="1" />);
    expect(context.find('div').length).toBe(1);
    expect(context.find('div').contains('1')).toBeTruthy();
  });

  it(`${name}: renders components with null children`, () => {
    const context = func(<div><NullStateless />text</div>);
    expect(context.text()).toBe('text');
  });

  it(`${name}: at() returns the indexed member`, () => {
    const context = func(<div><div /><div /></div>);
    expect(() => context.at(0)).not.toThrow();
    expect(() => context.at(1)).toThrow();
    expect(context.at(0)[0]).toEqual(<div><div /><div /></div>);
    expect(() => context.find('div').at(1)).not.toThrow();
    expect(() => context.find('div').at(2)).toThrow();
    expect(context.find('div').at(1)[0]).toEqual(<div />);
  });

  it(`${name}: attr() returns the attribute value`, () => {
    const context = func(<DivChildren count={1}><div class="first" /><div class="second" /></DivChildren>);
    expect(() => context.find('div').attr('class')).toThrow();
    expect(() => context.find('span').attr('class')).toThrow();
    expect(context.attr('count')).toBe(1);
    expect(context.find('.first').attr('class')).toBe('first');
  });

  it(`${name}: attrs() returns all attributes as an object`, () => {
    const context = func(<DivChildren count={1} value={'abc'}><div class="first" name="first" /><div class="second" name="second" /></DivChildren>);
    expect(() => context.find('div').attrs()).toThrow();
    expect(() => context.find('span').attrs()).toThrow();
    expect(context.attrs()).toEqual({count: 1, value: 'abc'});
    expect(context.find('.first').attrs()).toEqual({class: 'first', name: 'first'});
  });

  it(`${name}: contains() return true if a virtual dom is in the tree`, () => {
    const context = func(<DivChildren><div class="first" /><span class="second"><div class="third" /></span></DivChildren>);
    expect(context.contains(<div class="first" />)).toBeTruthy();
    expect(context.contains(<span class="second" />)).toBeFalsy();
    expect(context.contains(<DivChildren />)).toBeFalsy();
    expect(context.contains(<DivChildren><div class="first" /><span class="second"><div class="third" /></span></DivChildren>)).toBeTruthy();
  });

  it(`${name}: filters components`, () => {
    const context = func(<div><NullStateless class="first" /><NullStateless class="second" /></div>);
    expect(context.find('NullStateless').length).toBe(2);
    expect(context.find('NullStateless').filter('.first').length).toBe(1);
    expect(context.filter('div').length).toBe(1);
    expect(context.filter('span').length).toBe(0);
  });

  it(`${name}: output returns vdom output by a Component`, () => {
    const context = func(<DivChildren><span /></DivChildren>);
    expect(() => context.find('div').output()).toThrow();
    expect(context.output()).toEqual(<div><span /></div>);
  });

  it(`${name}: simulate an event`, () => {
    let count = 0;
    let context = func(<div onClick={() => {count++;}}/>);
    expect(count).toBe(0);
    context.simulate('click');
    expect(count).toBe(1);
    context = func(<ClickCount />);
    expect(context.contains('0')).toBeTruthy();
    context.find('div').simulate('click');
    expect(context.contains('1')).toBeTruthy();
  });

  it(`${name}: all the text of the virtual dom`, () => {
    const context = func(<DivChildren><div>foo</div><div>bar</div></DivChildren>);
    expect(context.text()).toBe('foobar');
    expect(context.find('div').at(0).text()).toBe('foobar');
  });

  it(`${name}: will call componentWillReceiveProps on the 'root' node`, () => {
    const context = func(<ReceivesProps value="test" />);
    expect(context.text()).toBe('test');
    context.render(<ReceivesProps value="received" />);
    expect(context.text()).toBe('_received_');
  });

  it(`${name}: output matches snapshot`, () => {
    const context = func(<First />);
    expect(context.output()).toMatchSnapshot();
  });

  it(`${name}: context matches snapshot`, () => {
    const context = func(<First />);
    expect(context).toMatchSnapshot();
  });

  it(`${name}: find matches snapshot`, () => {
    const onClick = () => {};

    const context = func(<div>
      <span onClick={onClick}>click</span>
      <span attr="text attr">text</span>
      <span itsTrue={true} itsFalse={false}>bools</span>
    </div>);
    expect(context.find('span')).toMatchSnapshot();
  });
};

sharedTests('deep', deep);
sharedTests('shallow', shallow);


it('output() is the same depth as the render method', () => {
  expect(deep(<First />).output()).toEqual(<div>second first</div>);
  expect(shallow(<First />).output()).toEqual(<Second>first</Second>);
});
