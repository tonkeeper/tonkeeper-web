import { forwardRef, useState } from 'react';
import { TextareaAutosize } from '../components/fields/TextareaAutosize';
import { HelpText, InputBlock, InputProps, Label, OuterBlock } from './Input';

/**
 * Multi-line variant of `Input`. Lives in its own file so importing `Input`
 * doesn't pull in `TextareaAutosize`'s `@tonkeeper/core` chain (Buffer-using
 * crypto utilities).
 */
export const TextArea = forwardRef<HTMLTextAreaElement, InputProps>(
    ({ value, onChange, isValid = true, label, disabled, helpText, onSubmit }, ref) => {
        const [focus, setFocus] = useState(false);

        return (
            <OuterBlock>
                <InputBlock focus={focus} valid={isValid}>
                    <TextareaAutosize
                        onSubmit={onSubmit}
                        ref={ref}
                        disabled={disabled}
                        value={value}
                        onChange={e => onChange && onChange(e.target.value)}
                        onFocus={() => setFocus(true)}
                        onBlur={() => setFocus(false)}
                    />
                    {label && <Label active={value !== '' || focus}>{label}</Label>}
                </InputBlock>
                {helpText && <HelpText valid={isValid}>{helpText}</HelpText>}
            </OuterBlock>
        );
    }
);
TextArea.displayName = 'TextArea';
