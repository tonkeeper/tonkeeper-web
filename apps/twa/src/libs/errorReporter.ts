export type StubErrorSeverity = 'warning' | 'error' | 'fatal';

export type StubErrorReporter = (
    severity: StubErrorSeverity,
    message: string,
    code?: string
) => void;

// The top-level error boundary and the global window error listeners live
// outside the React tree that holds the analytics tracker, so they can't reach
// it through context. This module is the seam: the Loader registers a reporter
// once the tracker is ready, and any surface can report through it. Errors that
// fire before registration (or when analytics is disabled) are dropped.
let reporter: StubErrorReporter | undefined;

export const setStubErrorReporter = (next: StubErrorReporter | undefined): void => {
    reporter = next;
};

// Keep messages free of private data (recovery phrases, addresses) before they
// leave the device, and bounded so a runaway message can't bloat the payload.
const sanitize = (message: string): string => message.replace(/\s+/g, ' ').trim().slice(0, 300);

export const reportStubError = (
    severity: StubErrorSeverity,
    message: string,
    code?: string
): void => {
    reporter?.(severity, sanitize(message), code);
};
