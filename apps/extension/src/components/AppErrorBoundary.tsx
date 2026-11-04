import React, { Component, ErrorInfo, ReactNode } from 'react';

interface State {
    error: Error | null;
    componentStack: string | null;
}

/**
 * The popup has no chrome to fall back to: an uncaught render error would
 * otherwise leave the window blank with the cause only in DevTools. This
 * surfaces the message and component stack directly in the popup so a broken
 * screen is diagnosable without attaching an inspector.
 */
export class AppErrorBoundary extends Component<{ children: ReactNode }, State> {
    state: State = { error: null, componentStack: null };

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { error };
    }

    componentDidCatch(_error: Error, info: ErrorInfo): void {
        this.setState({ componentStack: info.componentStack });
    }

    render(): ReactNode {
        const { error, componentStack } = this.state;
        if (!error) {
            return this.props.children;
        }

        return (
            <div
                style={{
                    minWidth: 385,
                    height: 600,
                    padding: 16,
                    overflow: 'auto',
                    boxSizing: 'border-box',
                    fontFamily: 'monospace',
                    fontSize: 12,
                    lineHeight: 1.4,
                    color: '#ff6b6b',
                    background: '#101010'
                }}
            >
                <div style={{ fontWeight: 700, marginBottom: 8 }}>{error.message}</div>
                <pre style={{ whiteSpace: 'pre-wrap', color: '#bbb' }}>{error.stack}</pre>
                {componentStack && (
                    <pre style={{ whiteSpace: 'pre-wrap', color: '#888' }}>{componentStack}</pre>
                )}
            </div>
        );
    }
}
