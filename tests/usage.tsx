import { h, Component, VNode } from "preact";
import defaultDeep, { deep, render, shallow, FindWrapper, RenderContext } from "../";

interface CompAProps { propA?: string; }

interface CompAState { propA: string; }

// Test component A
class CompA extends Component<CompAProps, CompAState> {
    state: CompAState = { propA: this.props.propA || "default" };

    render(props: CompAProps, { propA }: CompAState) {
        return <div>{propA}</div>;
    }
}

interface CompBProps { propB?: number; }

interface CompBState { propB: number; }

// Test component B
class CompB extends Component<CompBProps, CompBState> {
    state: CompBState = { propB: this.props.propB || 0 };

    render(props: CompBProps, { propB }: CompBState) {
        return <div>{propB}</div>;
    }
}

// exercise RenderContext<P, S> functionality
function exerciseRenderContext(contextA: RenderContext<CompAProps, CompAState>) {
    // RenderContext<P, S> are also FindWrapper<P, S>
    exerciseFindWrapper(contextA, "propA");

    // If re-rendering the same component, the context can be reused
    contextA.render(<CompA />); // still RenderContext<CompAProps, CompAState>
    exerciseFindWrapper(contextA, "propA");

    // If re-rendering a different component, set a different variable.
    const contextB: RenderContext<CompBProps, CompBState> = contextA.render<CompBProps, CompBState>(<CompB />);
    exerciseFindWrapper(contextB, "propB");

    // But if you don't need the type then it doesn't matter.
    const contextC: RenderContext<{}, {}> = shallow(<CompA />);
    contextC.render(<CompB />);
    // contextB.attr('propB'); // Type-dependent methods won't work!

    // Use this if you need type-dependent methods but don't want to create a different, properly typed variable.
    const contextD: RenderContext<any, any> = shallow<any, any>(<CompA />);
    let maybeWrong: string = contextD.attr(`you're asking`);
    contextD.render(<CompB />);
    maybeWrong = contextD.attr('for it!');
}

// exercise FindWrapper<P, S> functionality
function exerciseFindWrapper<P, S, K extends keyof P>(wrapper: FindWrapper<P, S>, attrKey: K) {
    const length: number = wrapper.length;
    const node: VNode = wrapper[0];
    const contained: boolean = wrapper.contains(node);
    const text: string = wrapper.text();
    const atWrapper: FindWrapper<any, any> = wrapper.at<any, any>(0);
    const filterWrapper: FindWrapper<any, any> = wrapper.filter<any, any>("selector");
    const findWrapper: FindWrapper<any, any> = wrapper.find<any, any>("selector");
    const findWrapper2: FindWrapper<any, any> = wrapper.find<any, any>(<CompA />);
    const attrs: P = wrapper.attrs();
    const attr: P[K] = wrapper.attr(attrKey);
    let simulate: void = wrapper.simulate("click");
    const outputNode: VNode = wrapper.output();
}

// exercise shallow<P, S>
let context: RenderContext<CompAProps, CompAState> = shallow<CompAProps, CompAState>(<CompA />);

// exercise deep<P, S>
context = deep<CompAProps, CompAState>(<CompA propA="test" />);
context = deep<CompAProps, CompAState>(<CompA propA="test" />, { depth: 10 });

// exercise render (deep<P, S>)
context = render<CompAProps, CompAState>(<CompA />);
context = render<CompAProps, CompAState>(<CompA />, { depth: 10 });

// exercise default export (deep<P, S>)
context = defaultDeep<CompAProps, CompAState>(<CompA propA="test" />);
context = defaultDeep<CompAProps, CompAState>(<CompA propA="test" />, { depth: 10 });

// exercise a RenderContext
exerciseRenderContext(context);
