const {h, Component} = require('preact');

const {deep, shallow} = require('./preact-render-spy');

const sharedTests = (name, func) => {
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

  it(`${name}: renders into fragment`, async () => {
    const context = func(<Div />);
    expect(context.fragment.children.length).toBe(1);
    expect(context.fragment.children[0].tagName).toBe('DIV');
    expect(context.find('div').length).toBe(1);
    expect(context.find('div').contains(<div />)).toBeTruthy();
  });

  it(`${name}: renders props`, async () => {
    const context = func(<DivChildren>node</DivChildren>);
    expect(context.find('div').length).toBe(1);
    expect(context.find('div').text('node')).toBeTruthy();
  });

  it(`${name}: renders changes`, async () => {
    const context = func(<DivChildren>node</DivChildren>);
    context.render(<DivChildren>node2</DivChildren>);
    expect(context.find('div').contains('node2')).toBeTruthy();
  });

  it(`${name}: renders change on click`, async () => {
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
    expect(context.find('div').text()).toBe('text');
  });
};

sharedTests('deep', deep);
sharedTests('shallow', shallow);
