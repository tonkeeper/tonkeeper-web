import { debounce } from '@tonkeeper/core/dist/utils/common';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import styled from 'styled-components';

const useEnhancedEffect = typeof window !== 'undefined' ? React.useLayoutEffect : React.useEffect;

function setRef<T>(
    ref: React.MutableRefObject<T | null> | ((instance: T | null) => void) | null | undefined,
    value: T | null
): void {
    if (typeof ref === 'function') {
        ref(value);
    } else if (ref) {
        ref.current = value;
    }
}

function useForkRef<Instance>(
    ...refs: Array<React.Ref<Instance> | undefined>
): React.RefCallback<Instance> | null {
    /**
     * This will create a new function if the refs passed to this hook change and are all defined.
     * This means react will call the old forkRef with `null` and the new forkRef
     * with the ref. Cleanup naturally emerges from this behavior.
     */
    return React.useMemo(() => {
        if (refs.every(ref => ref == null)) {
            return null;
        }

        return instance => {
            refs.forEach(ref => {
                setRef(ref, instance);
            });
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, refs);
}

function ownerDocument(node: Node | null | undefined): Document {
    return (node && node.ownerDocument) || document;
}

function ownerWindow(node: Node | undefined): Window {
    const doc = ownerDocument(node);
    return doc.defaultView || window;
}

export interface TextareaAutosizeProps
    extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'children' | 'rows'> {
    ref?: React.Ref<HTMLTextAreaElement>;
    /**
     * Maximum number of rows to display.
     */
    maxRows?: string | number;
    /**
     * Minimum number of rows to display.
     * @default 1
     */
    minRows?: string | number;

    onSubmit?: () => void;
}

type State = {
    outerHeightStyle: number;
    overflow?: boolean | undefined;
};

function getStyleValue(value: string) {
    return parseInt(value) || 0;
}

const styles: {
    shadow: React.CSSProperties;
} = {
    shadow: {
        // Visibility needed to hide the extra text area on iPads
        visibility: 'hidden',
        // Remove from the content flow
        position: 'absolute',
        // Ignore the scrollbar width
        overflow: 'hidden',
        height: 0,
        top: 0,
        left: 0,
        // Create a new layer, increase the isolation of the computed values
        transform: 'translateZ(0)'
    }
};

const Textarea = styled.textarea`
    outline: none;
    border: none;
    background: transparent;
    flex-grow: 1;
    box-sizing: border-box;

    font-style: normal;
    font-weight: 500;
    font-size: 16px;

    font-family: 'Montserrat', sans-serif;
    -webkit-font-smoothing: antialiased;

    color: ${props => props.theme.textPrimary};

    padding: 30px 0 10px;
    resize: none;

    word-break: break-all;
`;

function isEmpty(obj: State) {
    return (
        obj === undefined ||
        obj === null ||
        Object.keys(obj).length === 0 ||
        (obj.outerHeightStyle === 0 && !obj.overflow)
    );
}

export const TextareaAutosize = React.forwardRef(function TextareaAutosize(
    props: TextareaAutosizeProps,
    forwardedRef: React.ForwardedRef<Element>
) {
    const { onChange, maxRows, minRows = 1, style, value, onSubmit, ...other } = props;

    const { current: isControlled } = React.useRef(value != null);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const handleRef = useForkRef(forwardedRef, inputRef);
    const shadowRef = React.useRef<HTMLTextAreaElement>(null);
    const renders = React.useRef(0);
    const [state, setState] = React.useState<State>({
        outerHeightStyle: 0
    });

    const getUpdatedState = React.useCallback(() => {
        const input = inputRef.current!;

        const containerWindow = ownerWindow(input);
        const computedStyle = containerWindow.getComputedStyle(input);

        // If input's width is shrunk and it's not visible, don't sync height.
        if (computedStyle.width === '0px') {
            return {
                outerHeightStyle: 0
            };
        }

        const inputShallow = shadowRef.current!;

        inputShallow.style.width = computedStyle.width;
        inputShallow.value = input.value || props.placeholder || 'x';
        if (inputShallow.value.slice(-1) === '\n') {
            // Certain fonts which overflow the line height will cause the textarea
            // to report a different scrollHeight depending on whether the last line
            // is empty. Make it non-empty to avoid this issue.
            inputShallow.value += ' ';
        }

        const padding =
            getStyleValue(computedStyle.paddingBottom) + getStyleValue(computedStyle.paddingTop);

        // The height of the inner content
        const innerHeight = inputShallow.scrollHeight;

        // Measure height of a textarea with a single row
        inputShallow.value = 'x';
        const singleRowHeight = inputShallow.scrollHeight;

        // The height of the outer content
        let outerHeight = innerHeight;

        if (minRows) {
            outerHeight = Math.max(Number(minRows) * singleRowHeight, outerHeight);
        }
        if (maxRows) {
            outerHeight = Math.min(Number(maxRows) * singleRowHeight, outerHeight);
        }
        outerHeight = Math.max(outerHeight, singleRowHeight);

        // Take the box sizing into account for applying this value as a style.
        const outerHeightStyle = outerHeight + padding - 1; //(boxSizing === 'border-box' ? padding + border : 0);
        const overflow = Math.abs(outerHeight - innerHeight) <= 1;

        return { outerHeightStyle, overflow };
    }, [maxRows, minRows, props.placeholder]);

    const updateState = (prevState: State, newState: State) => {
        const { outerHeightStyle, overflow } = newState;
        // Need a large enough difference to update the height.
        // This prevents infinite rendering loop.
        if (
            renders.current < 20 &&
            ((outerHeightStyle > 0 &&
                Math.abs((prevState.outerHeightStyle || 0) - outerHeightStyle) > 1) ||
                prevState.overflow !== overflow)
        ) {
            renders.current += 1;
            return {
                overflow,
                outerHeightStyle
            };
        }
        return prevState;
    };

    const syncHeight = React.useCallback(() => {
        const newState = getUpdatedState();

        if (isEmpty(newState)) {
            return;
        }

        setState(prevState => {
            return updateState(prevState, newState);
        });
    }, [getUpdatedState]);

    const syncHeightWithFlushSync = () => {
        const newState = getUpdatedState();

        if (isEmpty(newState)) {
            return;
        }

        // In React 18, state updates in a ResizeObserver's callback are happening after the paint which causes flickering
        // when doing some visual updates in it. Using flushSync ensures that the dom will be painted after the states updates happen
        // Related issue - https://github.com/facebook/react/issues/24331
        ReactDOM.flushSync(() => {
            setState(prevState => {
                return updateState(prevState, newState);
            });
        });
    };

    React.useEffect(() => {
        const handleResize = debounce(() => {
            renders.current = 0;

            // If the TextareaAutosize component is replaced by Suspense with a fallback, the last
            // ResizeObserver's handler that runs because of the change in the layout is trying to
            // access a dom node that is no longer there (as the fallback component is being shown instead).
            // See https://github.com/mui/material-ui/issues/32640
            if (inputRef.current) {
                syncHeightWithFlushSync();
            }
        }, 166);
        let resizeObserver: ResizeObserver;

        const input = inputRef.current!;
        const containerWindow = ownerWindow(input);

        containerWindow.addEventListener('resize', handleResize);

        if (typeof ResizeObserver !== 'undefined') {
            resizeObserver = new ResizeObserver(handleResize);
            resizeObserver.observe(input);
        }

        return () => {
            containerWindow.removeEventListener('resize', handleResize);
            if (resizeObserver) {
                resizeObserver.disconnect();
            }
        };
    });

    useEnhancedEffect(() => {
        syncHeight();
    });

    React.useEffect(() => {
        renders.current = 0;
    }, [value]);

    const onKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = e => {
        if ((e.keyCode || e.which) === 13) {
            if (onSubmit) {
                e.preventDefault();
                e.stopPropagation();
                onSubmit();
            }
            return false;
        }
    };

    const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        renders.current = 0;

        if (!isControlled) {
            syncHeight();
        }

        if (onChange) {
            onChange(event);
        }
    };

    return (
        <React.Fragment>
            <Textarea
                value={value}
                onKeyDown={onKeyDown}
                onChange={handleChange}
                ref={handleRef}
                // Apply the rows prop to get a "correct" first SSR paint
                rows={minRows as number}
                style={{
                    height: state.outerHeightStyle,
                    // Need a large enough difference to allow scrolling.
                    // This prevents infinite rendering loop.
                    overflow: state.overflow ? 'hidden' : undefined,
                    ...style
                }}
                {...other}
            />
            <Textarea
                aria-hidden
                className={props.className}
                readOnly
                ref={shadowRef}
                tabIndex={-1}
                style={{
                    ...styles.shadow,
                    ...style,
                    padding: 0
                }}
            />
        </React.Fragment>
    );
}) as React.ForwardRefExoticComponent<TextareaAutosizeProps & React.RefAttributes<Element>>;
