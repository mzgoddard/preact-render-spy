import { h, Component, VNode } from 'preact';
import { deep, render, shallow, FindWrapper, RenderContext } from '../';

interface ChildProps {
  onClick?: () => void;
  value?: string;
}

interface ChildState {
  value?: string;
}

class Child extends Component<ChildProps, ChildState> {
  constructor(props: ChildProps) {
    super(props);
    this.state = {value: props.value};
  }

  componentWillReceiveProps(newProps: ChildProps) {
    this.setState({value: `_${newProps.value}_`});
  }

  render(props: ChildProps, {value}: ChildState) {
    return (
      <div>{value}</div>
    );
  }
}
interface ParentProps extends ChildProps {
  onClick?: () => void;
}

interface ParentState extends ChildState {}

class Parent extends Component<ParentProps, ParentState> {
  constructor(props: ChildProps) {
    super(props);
    this.state = {value: 'default'};
  }

  render(props: ParentProps, {value}: ParentState) {
    return (
      <Child
        onClick={() => this.setState({value: 'clicked'})}
        value={value}
      />
    );
  }
}

function useRenderContext(context: RenderContext<any, any>) {
  context.render(<Parent />);
  useFindWrapper(context);
}

function useFindWrapper(context: FindWrapper<any, any>) {
  const contextNode = context.length;
  const containedNode = context[0];
  const text1 = context.text();
  const atWrapper: FindWrapper<any, any> = context.at(0);
  const attrs: ParentProps = context.attrs();
  const valueProp: string = context.attr<'value'>('value');
  const matches = context.find('hi');
  const matchesLength = matches.length;
  const isContained = context.contains(containedNode);
  context.simulate('click');
  const filterWrapper: FindWrapper<any, any> = context.filter('hi');
  const node: VNode = context.output();
}

const shallowContext = shallow<ParentProps, ParentState>(<Parent />);
useRenderContext(shallowContext);

const deepContext = deep<ParentProps, ParentState>(<Parent />);
useRenderContext(deepContext);

const renderContext = render<ParentProps, ParentState>(<Parent />);
useRenderContext(renderContext);
