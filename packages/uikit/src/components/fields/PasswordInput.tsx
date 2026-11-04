import { forwardRef, useState } from 'react';
import { useTranslation } from '../../hooks/translation';
import IcEyeClosedOutline28 from '../../icons/components/IcEyeClosedOutline28';
import IcEyeOutline28 from '../../icons/components/IcEyeOutline28';
import { Input, InputProps } from '../../primitives/Input';

export type PasswordInputProps = Omit<
    InputProps,
    'type' | 'rightElement' | 'marginRight' | 'clearButton'
>;

/**
 * `Input` masked as a password with an eye toggle in the trailing slot that
 * reveals or hides the typed characters.
 */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
    ({ disabled, ...rest }, ref) => {
        const { t } = useTranslation();
        const [revealed, setRevealed] = useState(false);

        return (
            <Input
                {...rest}
                ref={ref}
                type={revealed ? 'text' : 'password'}
                disabled={disabled}
                marginRight="36px"
                rightElement={
                    <button
                        type="button"
                        aria-label={t(revealed ? 'hide_password' : 'show_password')}
                        aria-pressed={revealed}
                        disabled={disabled}
                        tabIndex={-1}
                        // Keeps focus (and the floated label) in the input while toggling.
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => setRevealed(v => !v)}
                        className="flex cursor-pointer items-center border-0 bg-transparent p-0 text-iconSecondary transition-colors hover:text-iconPrimary disabled:cursor-auto disabled:hover:text-iconSecondary"
                    >
                        {revealed ? (
                            <IcEyeClosedOutline28 className="h-7 w-7" />
                        ) : (
                            <IcEyeOutline28 className="h-7 w-7" />
                        )}
                    </button>
                }
            />
        );
    }
);
PasswordInput.displayName = 'PasswordInput';
