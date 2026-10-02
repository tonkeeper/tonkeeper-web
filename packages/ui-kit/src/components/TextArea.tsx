import { forwardRef, useLayoutEffect, useRef, useState } from 'react';
import { mergeRefs } from '../utils/mergeRefs';
import { HelpText, InputBlock, InputClearButton, InputProps, Label, OuterBlock } from './Input';

/**
 * Multi-line variant of `Input` that grows with its content. With `onSubmit`,
 * Enter submits instead of inserting a line break.
 */
export const TextArea = forwardRef<HTMLTextAreaElement, InputProps>(
    (
        { value, onChange, isValid = true, label, disabled, helpText, clearButton, onSubmit },
        ref
    ) => {
        const [focus, setFocus] = useState(false);
        const innerRef = useRef<HTMLTextAreaElement>(null);
        const showsClear = !!value && !!clearButton;

        useLayoutEffect(() => {
            const textarea = innerRef.current;
            if (!textarea) return undefined;
            // Collapsing to `auto` first lets the height shrink as well as grow.
            const fit = () => {
                textarea.style.height = 'auto';
                textarea.style.height = `${textarea.scrollHeight}px`;
            };
            fit();
            // Re-wrapping only happens on a width change; reacting to the
            // height this effect itself sets would loop.
            let width = textarea.clientWidth;
            const observer = new ResizeObserver(() => {
                if (textarea.clientWidth === width) return;
                width = textarea.clientWidth;
                fit();
            });
            observer.observe(textarea);
            return () => observer.disconnect();
        }, [value]);

        return (
            <OuterBlock>
                <InputBlock focus={focus} valid={isValid} trailing={showsClear}>
                    <textarea
                        ref={mergeRefs(ref, innerRef)}
                        rows={1}
                        disabled={disabled}
                        value={value}
                        onChange={e => onChange?.(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter' && onSubmit) {
                                e.preventDefault();
                                e.stopPropagation();
                                onSubmit();
                            }
                        }}
                        onFocus={() => setFocus(true)}
                        onBlur={() => setFocus(false)}
                        className="box-border min-w-0 grow resize-none overflow-hidden break-all border-0 bg-transparent pb-[10.5px] pt-[26.5px] text-body1 text-textPrimary caret-accentBlue outline-none"
                    />
                    {label && <Label active={value !== '' || focus}>{label}</Label>}
                    {showsClear && (
                        <InputClearButton disabled={disabled} onClear={() => onChange?.('')} />
                    )}
                </InputBlock>
                {helpText && <HelpText valid={isValid}>{helpText}</HelpText>}
            </OuterBlock>
        );
    }
);
TextArea.displayName = 'TextArea';
