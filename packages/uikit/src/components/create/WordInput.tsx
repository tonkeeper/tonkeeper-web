import { FC, useState } from 'react';
import { FieldWord } from '../../primitives/FieldWord';

/**
 * Single mnemonic-word input. Thin wrapper over `FieldWord` that hides the
 * error border until the field loses focus once — typing an unfinished
 * word shouldn't paint the box red mid-keystroke. Used by the
 * mnemonic-entry form (`MnemonicInputForm`).
 */
export const WordInput: FC<{
    value: string;
    onChange: (value: string) => void;
    test: number;
    isValid: boolean;
    tabIndex: number;
}> = ({ value, test, onChange, isValid, tabIndex }) => {
    const [isTouched, setIsTouched] = useState(false);

    return (
        <FieldWord
            value={value}
            number={test}
            error={isTouched && !isValid}
            tabIndex={tabIndex}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            onChange={v => onChange(v.toLocaleLowerCase())}
            onBlur={() => setIsTouched(true)}
        />
    );
};
