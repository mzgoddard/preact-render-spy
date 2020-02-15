import * as preact from "preact";

/**
 * Contains a selection of nodes from `RenderContext#find(selector)`. Has numeric indexed properties and `length` like
 * an array.
 **/
export interface FindWrapper<P, S> {
    /** Retrieve node at index */
    [index: number]: preact.VNode;

    /** Number of available nodes */
    length: number;

    /**
     * Returns another `FindWrapper` at the specific index in the selection. Similar to wrapper[0] but will allow using
     * other FindWrapper methods on the result.
     **/
    at<Q, T>(index: number): FindWrapper<Q, T>;

    /**
     * Returns another `FindWrapper` at the first index in the selection.
     **/
    first<Q, T>(): FindWrapper<Q, T>;

    /**
     * Returns another `FindWrapper` at the last index in the selection.
     **/
    last<Q, T>(): FindWrapper<Q, T>;

    /** Requires a single node selection to work. Returns the value of the name attribute on the jsx node. */
    attr<K extends keyof P>(name: K): P[K];

    /** Requires a single node selection to work. Returns a copy of the attributes passed to the jsx node. */
    attrs(): P;

    /** Searches for any children matching the vdom or text passed. */
    contains(vdom: preact.VNode | string): boolean;

    /** Returns preact instance */
    component(): any;

    /**
     * Returns `FindWrapper` with child at given index.
     **/
    childAt<Q, T>(index: number): FindWrapper<Q, T>;

    /**
     * Returns `FindWrapper` with children of current wrapper.
     **/
    children<Q, T>(): FindWrapper<Q, T>;

    /**
     * Returns whether or not given node exists.
     **/
    exists(): boolean;

    /**
     * Returns a new `FindWrapper` with a subset of the previously selected elements given the selector argument.
     * Uses the same selectors as .find()
     **/
    filter<Q, T>(selector: string): FindWrapper<Q, T>;

    /**
     * Maps array of nodes from this `FindWrapper` to another array.
     * Each node is passed in as a `FindWrapper` to the map function along with index number of element.
     **/
    map<Q, T>(fn: (element: FindWrapper<Q, T>, index: number) => any): any[];

    /**
     * Selects descendents of the elements previously selected. Returns a new `FindWrapper` with the newly selected
     * elements.
     **/
    find<Q, T>(selector: preact.VNode | string): FindWrapper<Q, T>;

    /** Requires a single `Component` or functional node. Returns the raw vdom output of the given component. */
    output(): preact.VNode;

    /** Sets the wrapper state. */
    setState(newState: Object): Object;

    /** Looks for an attribute properly named `onEvent` or `onEventCapture` and calls it, passing the arguments. */
    simulate(event: string, ...args: any[]): void;

    /** Returns a state object or a specific key value. */
    state(key?: string): any;

    /** Returns the flattened string of any text children of any child component. */
    text(): string;
}

/** A rendered context; extends `FindWrapper<P, S>`. */
export interface RenderContext<P, S> extends FindWrapper<P, S> {
    /**
     * Re-renders the root level jsx node using the same depth initially requested. NOTE: When preact re-renders this
     * way, it will not reuse components, so if you want to test `componentWillReceiveProps` you will need to use a
     * test wrapper component.
     **/
    render<Q, T>(jsx: preact.JSX.Element): RenderContext<Q, T>;

    /**
     * Re-renders the same JSX with the same depth that was initially requested. This is helpful in performing any
     * state changes in the render queue.
     **/
    rerender<Q, T>(): RenderContext<Q, T>;
}

/** Options for DeepFunction. */
export interface DeepOptions {
    /** Depth from parent to render. */
    depth: number;
}

/** Deep render function */
interface DeepFunction {
    /**
     * Creates a new RenderContext and renders using `opts.depth` to specify how many components deep it should allow
     * the renderer to render. Also exported as render and default.
     *
     * Default depth: `Infinity`.
     **/
    <P, S>(vdom: preact.JSX.Element, options?: DeepOptions): RenderContext<P, S>;
}

/** Shallow render function */
interface ShallowFunction {
    /** Creates a new RenderContext with `{ depth: 1 }`. */
    <P, S>(vdom: preact.JSX.Element): RenderContext<P, S>;
}

interface ToStringOptions {
    attributeHook: Function;
    functionNames: boolean;
    functions: boolean;
    jsx: boolean;
    skipFalseAttributes: boolean;
    pretty: boolean;
    shallow: boolean;
    xml: boolean;
}

export const config: {
    SPY_PRIVATE_KEY: string;
    createFragment: () => Document | Element;
    toStringOptions: ToStringOptions;
}

export const deep: DeepFunction;
export const render: DeepFunction;
export const rerender: DeepFunction;
export const shallow: ShallowFunction;
export default deep;
