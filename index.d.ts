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

    /** Requires a single node selection to work. Returns the value of the name attribute on the jsx node. */
    attr<K extends keyof P>(name: K): P[K];

    /** Requires a single node selection to work. Returns a copy of the attributes passed to the jsx node. */
    attrs(): P;

    /** Searches for any children matching the vdom or text passed. */
    contains(vdom: preact.VNode | string): boolean;

    /**
     * Returns a new `FindWrapper` with a subset of the previously selected elements given the selector argument.
     * Uses the same selectors as .find()
     **/
    filter<Q, T>(selector: string): FindWrapper<Q, T>;

    /**
     * Selects descendents of the elements previously selected. Returns a new `FindWrapper` with the newly selected
     * elements.
     **/
    find<Q, T>(selector: string): FindWrapper<Q, T>;

    /** Requires a single `Component` or functional node. Returns the raw vdom output of the given component. */
    output(): preact.VNode;

    /** Looks for an attribute properly named `onEvent` or `onEventCapture` and calls it, passing the arguments. */
    simulate(event: string, ...args: any[]): void;

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
    render<Q, T>(jsx: JSX.Element): RenderContext<Q, T>;
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
    <P, S>(vdom: JSX.Element, options?: DeepOptions): RenderContext<P, S>;
}

/** Shallow render function */
interface ShallowFunction {
    /** Creates a new RenderContext with `{ depth: 1 }`. */
    <P, S>(vdom: JSX.Element): RenderContext<P, S>;
}

export const deep: DeepFunction;
export const render: DeepFunction;
export const shallow: ShallowFunction;
export default deep;