import React, { PropsWithChildren } from 'react';

export default class StandardErrorBoundary extends React.Component<
    PropsWithChildren,
    { hasError: boolean; error?: Error }
> {
    constructor(props: PropsWithChildren) {
        super(props);

        // to keep track of when an error occurs
        // and the error itself
        this.state = {
            hasError: false,
            error: undefined
        };
    }

    // update the component state when an error occurs
    static getDerivedStateFromError(error: Error) {
        // specify that the error boundary has caught an error
        return {
            hasError: true,
            error: error
        };
    }

    // defines what to do when an error gets caught
    componentDidCatch(error: Error, errorInfo: any) {
        // log the error
        console.log('Error caught!');
        console.error(error);
        console.error(errorInfo);

        // record the error in an APM tool...
    }

    render() {
        // if an error occurred
        if (this.state.hasError) {
            return (
                <div className={'error-page'}>
                    <div className={'oops'}>Oops!</div>
                    <div className={'message'}>
                        {this.state.error?.message ?? 'Something went wrong...'}
                    </div>
                </div>
            );
        } else {
            // default behavior
            return this.props.children;
        }
    }
}
