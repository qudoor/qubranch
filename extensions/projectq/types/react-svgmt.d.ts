declare module 'react-svgmt' {
    export class SvgLoader {
        constructor(...args: any[]);
        componentDidMount(): void;
        componentDidUpdate(): void;
        forceUpdate(callback: any): void;
        render(): any;
        setState(partialState: any, callback: any): void;
        shouldComponentUpdate(nextProps: any): any;
        props: any;
        state: any;
        context: any;
        refs: any;
    }
    export class SvgProxy {
        constructor(...args: any[]);
        componentDidMount(): void;
        componentDidUpdate(): void;
        forceUpdate(callback: any): void;
        render(): any;
        setState(partialState: any, callback: any): void;
        shouldComponentUpdate(nextProps: any): any;
        props: any;
        state: any;
        context: any;
        refs: any;
    }
}