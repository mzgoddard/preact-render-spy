import { h, Component, VNode } from "preact";
import defaultDeep, { deep, render, shallow, FindWrapper, RenderContext } from "../";

interface CompAProps {
    propA?: string;
}

interface CompAState {
    propA: string;
}

class CompA extends Component<CompAProps, CompAState> {
    state: CompAState = {
        propA: this.props.propA || "default",
    };

    render(props: CompAProps, { propA }: CompAState) {
        return <div>{propA}</div>;
    }
}

interface CompBProps {
    propB?: number;
}

interface CompBState {
    propB: number;
}

class CompB extends Component<CompBProps, CompBState> {
    state: CompBState = {
        propB: this.props.propB || 0,
    };

    render(props: CompBProps, { propB }: CompBState) {
        return <div>{propB}</div>;
    }
}

function exerciseFindWrapper<P, S, K extends keyof P>(context: FindWrapper<P, S>, attr: K) {
    const contextNode = context.length;

    const containedNode = context[0];
    const isContained = context.contains(containedNode);

    const text1 = context.text();

    const atWrapper: FindWrapper<any, any> = context.at(0);
    const filterWrapper: FindWrapper<any, any> = context.filter("hi");
    const findWrapper: FindWrapper<any, any> = context.find("hi");

    const attrs: CompAProps = context.attrs();
    const attrValue = context.attr(attr);

    context.simulate("click");

    const node: VNode = context.output();
}

// exercise shallow
const shallowContextA = shallow<CompAProps, CompAState>(<CompA />);
exerciseFindWrapper(shallowContextA, "propA");

// RenderContext can be re-rendered
const shallowContextB = shallowContextA.render<CompBProps, CompBProps>(<CompB />);
exerciseFindWrapper(shallowContextB, "propB");

// exercise deep without depth
const deepContextA = deep<CompAProps, CompAState>(<CompA propA="test" />);
exerciseFindWrapper(deepContextA, "propA");

// exercise deep with depth
const deepContextB = deep<CompAProps, CompAState>(<CompA propA="test" />, { depth: 10 });

// exercise render (deep)
const renderContext = render<CompAProps, CompAState>(<CompA />);
exerciseFindWrapper(renderContext, "propA");

// exercise default export (deep)
const defaultDeepContextB = defaultDeep<CompAProps, CompAState>(<CompA propA="test" />, { depth: 10 });