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
  expect(context.find('div')[0]).toEqual(<div />);
});

it('renders props', async () => {
  class Node extends Component {
    render({className}) {
      return <div class={className} />;
    }
  }
  const context = renderSpy(<Node className="node" />);
  expect(context.find('.node').length).toBe(1);
  expect(context.find('div')[0]).toEqual(<div class="node" />);
});

it('renders changes', async () => {
  class Node extends Component {
    render({className}) {
      return <div class={className} />;
    }
  }
  const context = renderSpy(<Node className="node" />);
  context.render(<Node className="node2" />);
  expect(context.find('.node2').length).toBe(1);
  expect(context.find('div')[0]).toEqual(<div class="node2" />);
});

it('componentWillReceiveProps', () => {
  class SubNode extends Component {
    constructor(props) {
      super(props);
      this.state = {count: props.count + 1};
    }

    componentWillReceiveProps(newProps) {
      this.setState({count: newProps.count + 2});
    }

    render(props, {count}) {
      return <div class={`node${count}`} />;
    }
  }

  class Node extends Component {
    constructor(props) {
      super(props);
      this.state = {count: props.count};
    }

    render(props, {count}) {
      return <SubNode
        onClick={() => this.setState({})}
        count={count} class={`node${count}`} />;
    }
  }

  const context = renderSpy(<Node count={1} />);
  expect(context.find('.node1').length).toBe(1);
  context.find('SubNode').simulate('click');
  expect(context.find('.node3').length).toBe(1);
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

    render({className}, {count}) {
      return <div class={className + count} onClick={this.onClick} />;
    }
  }
  const context = renderSpy(<Node className="node" />);
  expect(context.find('div')[0].attributes.class).toEqual('node0');
  context.find('div').simulate('click');
  expect(context.find('div')[0].attributes.class).toEqual('node1');
});

it('renders multiple components', () => {
  class Node extends Component {
    render({count}) {
      return <div class={'node' + count} />;
    }
  }
  const context = renderSpy(<div><Node count="1" /><Node count="2" /></div>);
  expect(context.find('.node1').length).toBe(1);
  expect(context.find('.node1')[0]).toEqual(<div class="node1" />);
  expect(context.find('.node2').length).toBe(1);
  expect(context.find('.node2')[0]).toEqual(<div class="node2" />);
});

it('renders stateless components', () => {
  const Node = ({count}) => <div class={`node${count}`} />;
  const context = renderSpy(<Node count="1" />);
  expect(context.find('.node1').length).toBe(1);
  expect(context.find('.node1')[0]).toEqual(<div class="node1" />);
});
