const {h, Component} = require('preact');

const {deep, shallow} = require('./preact-render-spy');

const sharedTests = (name, func) => {
  it(`${name}: renders into fragment`, async () => {
    class Node extends Component {
      render() {
        return <div />;
      }
    }
    const context = func(<Node />);
    expect(context.fragment.children.length).toBe(1);
    expect(context.fragment.children[0].tagName).toBe('DIV');
    expect(context.find('div').length).toBe(1);
    expect(context.find('div').contains(<div />)).toBeTruthy();
  });

  it(`${name}: renders props`, async () => {
    class Node extends Component {
      render({children}) {
        return <div>{children}</div>;
      }
    }
    const context = func(<Node>node</Node>);
    expect(context.find('div').length).toBe(1);
    expect(context.find('div').text('node')).toBeTruthy();
  });

  it(`${name}: renders changes`, async () => {
    class Node extends Component {
      render({children}) {
        return <div>{children}</div>;
      }
    }
    const context = func(<Node>node</Node>);
    context.render(<Node>node2</Node>);
    expect(context.find('div').contains('node2')).toBeTruthy();
  });

  it(`${name}: renders change on click`, async () => {
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
    const context = func(<Node/>);
    expect(context.find('div').contains('0')).toBeTruthy();
    context.find('div').simulate('click');
    expect(context.find('div').contains('1')).toBeTruthy();
  });

  it(`${name}: renders multiple components`, () => {
    class Node extends Component {
      render({count}) {
        return <div>{count}</div>;
      }
    }
    const context = func(<div><Node count="1" /><Node count="2" /></div>);
    expect(context.find('div').contains('1')).toBeTruthy();
    expect(context.find('div').contains(<div>1</div>)).toBeTruthy();
    expect(context.find('div').contains('2')).toBeTruthy();
    expect(context.find('div').contains(<div>2</div>)).toBeTruthy();
  });

  it(`${name}: renders stateless components`, () => {
    const Node = ({count}) => <div>{count}</div>;
    const context = func(<Node count="1" />);
    expect(context.find('div').length).toBe(1);
    expect(context.find('div').contains('1')).toBeTruthy();
  });

  it(`${name}: renders components with null children`, () => {
    const Null = () => null;
    const context = func(<div><Null />text</div>);
    expect(context.find('div').text()).toBe('text');
  });
};

sharedTests('deep', deep);
sharedTests('shallow', shallow);
