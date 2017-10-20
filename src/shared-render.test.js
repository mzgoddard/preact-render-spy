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

const Text = () => 'Text';

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

  it(`${name}: first() returns the first member`, () => {
    const context = func(<div><div class="first" /><div class="last" /></div>);
    expect(() => context.first()).not.toThrow();
    expect(() => context.find('span').first()).toThrow();
    expect(context.find('div').first()[0]).toEqual(<div class="first" />);
  });

  it(`${name}: last() returns the last member`, () => {
    const context = func(<div><div class="first" /><div class="last" /></div>);
    expect(() => context.last()).not.toThrow();
    expect(() => context.find('span').last()).toThrow();
    expect(context.find('div').last()[0]).toEqual(<div class="last" />);
  });

  it(`${name}: attr() returns the attribute value`, () => {
    const context = func(<DivChildren count={1}><div class="first" /><div class="second" /></DivChildren>);
    expect(() => context.find('div').attr('class')).toThrow();
    expect(() => context.find('span').attr('class')).toThrow();
    expect(context.attr('count')).toBe(1);
    expect(context.find('.first').attr('class')).toBe('first');
  });

  it(`${name}: attr() and awkward values`, () => {
    const context = func(<div false={false} true={true} null={null} zero={0} empty="" />);
    expect(context.attr('false')).toEqual(false);
    expect(context.attr('true')).toEqual(true);
    expect(context.attr('null')).toEqual(null);
    expect(context.attr('zero')).toEqual(0);
    expect(context.attr('empty')).toEqual('');
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

  it(`${name}: filters components using vdom`, () => {
    const context = func(<div><NullStateless class="first" something={null} /><NullStateless class="second" /></div>);
    expect(context.find(<NullStateless />).length).toBe(2);
    expect(context.find(<NullStateless class="first" />).length).toBe(1);
    expect(context.find(<NullStateless something={null} />).length).toBe(1);
    expect(context.filter(<div />).length).toBe(1);
    expect(context.filter(<span />).length).toBe(0);
  });

  it(`${name}: output returns vdom output by a Component`, () => {
    const context = func(<DivChildren><span /></DivChildren>);
    expect(() => context.find('div').output()).toThrow();
    expect(context.output()).toEqual(<div><span /></div>);
  });

  it(`${name}: output returns null output by a Component`, () => {
    const context = func(<NullStateless/>);
    expect(context.output()).toEqual(null);
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

  it(`${name}: weird render cases toString matches snapshot`, () => {
    const Test = () => <NullStateless><Div /></NullStateless>;
    const context = func(<Test />);
    expect(context.toString()).toMatchSnapshot();
    expect(context.find('Div')).toMatchSnapshot();
  });

  it(`${name}: snapshots for text nodes`, () => {
    expect(func(<Text />)).toMatchSnapshot();

    const Deeper = () => <div><Text /></div>;
    expect(func(<Deeper />)).toMatchSnapshot();
  });

  it(`${name}: can retrieve component instance`, () => {
    const context = func(<ClickCount />);

    expect(context.component()).toBeInstanceOf(ClickCount);
  });

  it(`${name}: can retrieve deeper component instances after renders`, () => {
    const context = func(<div><ClickCount /></div>);

    const component = context.find('ClickCount').component();
    expect(component).toBeInstanceOf(ClickCount);

    context.render(<div><ClickCount /></div>);
    // This test ensures that even though this <ClickCount /> is not the same JSX node used
    // in the initial context render, find('ClickCount').component()
    // will still retrieve the same component
    expect(context.find('ClickCount').component()).toEqual(component);

  });

  it(`${name}: can retrieve and set component state`, () => {
    const context = func(<ClickCount />);

    expect(context.state()).toEqual({ count: 0 });
    expect(context.state('count')).toEqual(0);

    context.setState({ count: 2 });

    expect(context.text()).toEqual('2');
  });

  it(`${name}: find by class works with null and undefined class and className`, () => {
    const context = func(<DivChildren><div class={null}>test</div></DivChildren>);
    expect(() => context.find('.test')).not.toThrow();

    context.render(<DivChildren><div className={null}>test</div></DivChildren>);
    expect(() => context.find('.test')).not.toThrow();

    context.render(<DivChildren><div class={undefined}>test</div></DivChildren>);
    expect(() => context.find('.test')).not.toThrow();

    context.render(<DivChildren><div className={undefined}>test</div></DivChildren>);
    expect(() => context.find('.test')).not.toThrow();
  });

  describe('warnings', () => {
    const warn = console.warn;
    let spy;
    let context;
    let found;

    beforeEach(() => {
      spy = jest.fn();
      console.warn = spy;
      context = func(<div><ClickCount /></div>);
      found = context.find('ClickCount');
      context.render(<div><ClickCount /></div>);
    });

    afterEach(() => {
      console.warn = warn;
    });

    it(`${name}: warns when performing at on stale finds`, () => {
      found.at(0);
      expect(spy).toHaveBeenCalled();
    });

    it(`${name}: warns when performing component on stale finds`, () => {
      found.component();
      expect(spy).toHaveBeenCalled();
    });

    it(`${name}: warns when performing attrs on stale finds`, () => {
      found.attrs();
      expect(spy).toHaveBeenCalled();
    });

  });
};

sharedTests('deep', deep);
sharedTests('shallow', shallow);


it('output() is the same depth as the render method', () => {
  expect(deep(<First />).output()).toEqual(<div>second first</div>);
  expect(shallow(<First />).output()).toEqual(<Second>first</Second>);
});
