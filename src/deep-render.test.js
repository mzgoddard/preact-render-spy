const {h, Component} = require('preact');

const {render} = require('./preact-render-spy');

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

  const context = render(<Parent />);
  const getChild = () => context.find('Child').at(0);
  expect(getChild().text()).toBe('default');
  getChild().simulate('click');
  expect(getChild().text()).toBe('_clicked_');
});

it(`renders components with null children`, () => {
  const Null = () => null;
  const Node = () => <div><Null />text</div>;
  const context = render(<Node />);
  expect(context.find('div').text()).toBe('text');
});
