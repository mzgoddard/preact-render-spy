const {h, Component} = require('preact');

const renderSpy = require('./preact-render-spy');

it('renders into fragment', async () => {
  class Node extends Component {
    render() {
      return <div />;
    }
  }
  const context = renderSpy(<Node />);
  expect(context.output('div')).toEqual(<div />);
  expect(context.fragment.children.length).toBe(1);
  expect(context.fragment.children[0].tagName).toBe('DIV');
  expect(context.find('div').length).toBe(1);
});

it('renders props', async () => {
  class Node extends Component {
    render({className}) {
      return <div class={className} />;
    }
  }
  const context = renderSpy(<Node className="node" />);
  expect(context.output('div')).toEqual(<div class="node" />);
  expect(context.find('.node').length).toBe(1);
});

it('renders changes', async () => {
  class Node extends Component {
    render({className}) {
      return <div class={className} />;
    }
  }
  const context = renderSpy(<Node className="node" />);
  context.render(<Node className="node2" />);
  expect(context.output('div')).toEqual(<div class="node2" />);
  expect(context.find('.node2').length).toBe(1);
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
  expect(context.output('div').attributes.class).toEqual('node0');
  await context.find('div').simulate('click');
  expect(context.output('div').attributes.class).toEqual('node1');
});

it('renders multiple components', () => {
  class Node extends Component {
    render({count}) {
      return <div class={'node' + count} />;
    }
  }
  const context = renderSpy(<div><Node count="1" /><Node count="2" /></div>);
  expect(context.find('.node1').length).toBe(1);
  expect(context.output('.node1')).toEqual(<div class="node1" />);
  expect(context.find('.node2').length).toBe(1);
  expect(context.output('.node2')).toEqual(<div class="node2" />);
});
