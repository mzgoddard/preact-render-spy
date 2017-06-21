const {h, Component} = require('preact');

const renderSpy = require('./preact-render-spy');

it('renders into fragment', async () => {
  class Node extends Component {
    render() {
      return <div />;
    }
  }
  const context = renderSpy(<Node />);
  expect(context.fragment.children.length).toBe(1);
  expect(context.fragment.children[0].tagName).toBe('DIV');
  expect(context.find('div').length).toBe(1);
  expect(context.find('div').contains(<div />)).toBeTruthy();
});

it('renders props', async () => {
  class Node extends Component {
    render({children}) {
      return <div>{children}</div>;
    }
  }
  const context = renderSpy(<Node>node</Node>);
  expect(context.find('div').length).toBe(1);
  expect(context.find('div').text('node')).toBeTruthy();
});

it('renders changes', async () => {
  class Node extends Component {
    render({children}) {
      return <div>{children}</div>;
    }
  }
  const context = renderSpy(<Node>node</Node>);
  context.render(<Node>node2</Node>);;
  expect(context.find('div').contains('node2')).toBeTruthy();
});

it('componentWillReceiveProps', () => {
  class Child extends Component {
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

  class Parent extends Component {
    constructor(props) {
      super(props);
      this.state = {value: 'default'};
    }

    render(props, {value}) {
      return (
        <Child
          onClick={() => this.setState({value: 'clicked'})}
          value={value}
        />
      );
    }
  }

  const context = renderSpy(<Parent />);
  const getChild = () => context.find('Child').at(0);
  expect(getChild().text()).toBe('default');
  getChild().simulate('click');
  expect(getChild().text()).toBe('_clicked_');
});

it('renders change on click', async () => {
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
  const context = renderSpy(<Node/>);
  expect(context.find('div').contains('0')).toBeTruthy();
  context.find('div').simulate('click');
  expect(context.find('div').contains('1')).toBeTruthy();
});

it('renders multiple components', () => {
  class Node extends Component {
    render({count}) {
      return <div>{count}</div>;
    }
  }
  const context = renderSpy(<div><Node count="1" /><Node count="2" /></div>);
  expect(context.find('div').contains('1')).toBeTruthy();
  expect(context.find('div').contains(<div>1</div>)).toBeTruthy();
  expect(context.find('div').contains('2')).toBeTruthy();
  expect(context.find('div').contains(<div>2</div>)).toBeTruthy();
});

it('renders stateless components', () => {
  const Node = ({count}) => <div>{count}</div>;
  const context = renderSpy(<Node count="1" />);
  expect(context.find('div').length).toBe(1);
  expect(context.find('div').contains('1')).toBeTruthy();
});

it('renders components with null children', () => {
  const Empty = () => null;
  const Node = () => <div><Empty/>text</div>;
  const context = renderSpy(<Node />);
  expect(context.find('div').text()).toBe('text');
});
