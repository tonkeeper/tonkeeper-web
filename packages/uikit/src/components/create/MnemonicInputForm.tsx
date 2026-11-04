import { wordlist } from '@ton/crypto/dist/mnemonic/wordlist';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAppSdk } from '../../hooks/appSdk';
import { useTranslation } from '../../hooks/translation';
import { Button } from '../../primitives/Button';
import { ModalFooter, ModalFooterPortal, useSetModalTopBarTitle } from '../../primitives/Modal';
import {
    parseMnemonicPaste,
    validateMnemonicTonOrMAM
} from '@tonkeeper/core/dist/service/mnemonicService';
import { cn } from '../../libs/css';
import { handleSubmit } from '../../libs/form';
import { useInputFocusScroll } from '../../hooks/keyboard/useInputFocusScroll';
import { WordInput } from './WordInput';

/**
 * The 12/24-word recovery-phrase entry form. Renders a grid of
 * `WordInput`s with a 12/24 length toggle (defaulting to 12; flows that
 * disable the toggle get a fixed 24-word grid), a "Paste" affordance for
 * empty forms, and a "Continue" submit. Validation runs on submit —
 * the form only resolves when every word is in the BIP39 wordlist and
 * the assembled phrase passes `validateMnemonicTonOrMAM`.
 *
 * Used by every flow that asks the user for a seed — mainnet
 * `ImportExistingWallet` and `ImportTestnetWallet`, plus the BIP39 →
 * multichain import behind `multichainEnabled`.
 */

/**
 * Ties the Continue button to the form across the footer-portal boundary:
 * the button renders in the Modal's footer slot, outside the form's DOM
 * subtree, so implicit association is lost and the `form` attribute has
 * to restore it.
 */
const MNEMONIC_FORM_ID = 'mnemonic-input-form';

const getEmptyWordIndex = (words: string[]) => words.findIndex(word => word === '');
const getInvalidWordIndex = (words: string[]) =>
    words.findIndex(word => !(word === '' || wordlist.includes(word)));

const focusInput = (current: HTMLDivElement | null, index: number) => {
    if (!current) return;
    const wrapper = current.childNodes[index] as HTMLDivElement;
    if (!wrapper) return;
    wrapper.querySelector('input')?.focus();
};

/**
 * Pill segmented switch — 12/24 toggle. Two tabs in a rounded container;
 * the active tab uses the tertiary button fill, the rest sit on the
 * secondary fill. Inline to the screen because no other screen uses this
 * exact treatment yet.
 */
const WordsLengthToggle: FC<{
    value: 12 | 24;
    onChange: (value: 12 | 24) => void;
}> = ({ value, onChange }) => {
    const { t } = useTranslation();
    return (
        <div className="inline-flex gap-1 rounded-[22px] bg-backgroundContent p-1">
            {[12, 24].map(n => {
                const active = value === n;
                return (
                    <button
                        key={n}
                        type="button"
                        onClick={() => onChange(n as 12 | 24)}
                        className={cn(
                            'flex min-w-8 cursor-pointer items-center justify-center overflow-hidden rounded-[18px] border-0 px-4 py-2 text-label2 transition-colors',
                            active
                                ? 'bg-buttonTertiaryBackground text-buttonTertiaryForeground'
                                : 'bg-buttonSecondaryBackground text-buttonSecondaryForeground hover:bg-buttonSecondaryBackgroundHighlighted'
                        )}
                    >
                        {t(n === 24 ? 'import_wallet_24_words' : 'import_wallet_12_words')}
                    </button>
                );
            })}
        </div>
    );
};

export const MnemonicInputForm: FC<{
    isLoading?: boolean;
    onMnemonic: (mnemonic: string[]) => void;
    /** The submitted phrase isn't a valid recovery phrase. */
    onInvalidMnemonic?: (mnemonic: string[]) => void;
    onIsDirtyChange?: (isDirty: boolean) => void;
    enableShortMnemonic?: boolean;
}> = ({
    isLoading,
    onIsDirtyChange,
    onMnemonic,
    onInvalidMnemonic,
    enableShortMnemonic = true
}) => {
    const sdk = useAppSdk();
    const ref = useRef<HTMLDivElement>(null);
    const { t } = useTranslation();

    const [wordsNumber, setWordsNumber] = useState<12 | 24>(enableShortMnemonic ? 12 : 24);
    const [_mnemonic, setMnemonic] = useState<string[]>(Array(24).fill(''));

    const mnemonic = useMemo(() => {
        return _mnemonic.slice(0, wordsNumber);
    }, [_mnemonic, wordsNumber]);

    const isDirty = useMemo(() => mnemonic.some(Boolean), [mnemonic]);
    const isEmpty = !isDirty;

    useEffect(() => {
        onIsDirtyChange?.(isDirty);
    }, [isDirty, onIsDirtyChange]);

    const onChange = useCallback(
        (newValue: string, index: number, previousValue: string) => {
            // A keystroke grows the value by one character; anything that
            // adds more at once is a paste. Whitespace (typed space,
            // newline, tab, NBSP) is a word separator either way. Both go
            // through the split-and-advance branch; plain typing falls
            // through to the straight-set branch so the field updates on
            // every keystroke and the wordlist validator can mark typos.
            const isPaste = newValue.length - previousValue.length > 1;
            const isPasteOrSeparator = isPaste || /\s/.test(newValue);
            if (!isPasteOrSeparator) {
                setMnemonic(items => items.map((v, i) => (i === index ? newValue : v)));
                return;
            }

            const values = parseMnemonicPaste(newValue);
            if (values.length === 0) return;

            if (values.length === 1) {
                setMnemonic(items => items.map((v, i) => (i === index ? values[0] : v)));
                focusInput(ref.current, index + 1);
                return;
            }

            // A full 12- or 24-word phrase pasted from the start is
            // unambiguous about its own length — follow it instead of the
            // toggle, so a phrase of the other size doesn't end up half
            // hidden (24 into a 12-grid) or padded with stale words
            // (12 into a 24-grid).
            if (
                enableShortMnemonic &&
                index === 0 &&
                (values.length === 12 || values.length === 24)
            ) {
                setWordsNumber(values.length as 12 | 24);
            }

            const max = Math.min(24 - index, values.length);
            const slice = values.slice(0, max);
            setMnemonic(items => {
                items = [...items];
                items.splice(index, max, ...slice);
                return items;
            });
            focusInput(ref.current, index + max - 1);
        },
        [setMnemonic, enableShortMnemonic]
    );

    const validations = useMemo(() => {
        return mnemonic.map(item => item === '' || wordlist.includes(item));
    }, [mnemonic]);

    const notifyError = () => {
        sdk.topMessage(t('import_wallet_wrong_words_err'));
        sdk.hapticNotification('error');
    };

    // Read the clipboard, hand the joined text to onChange(_, 0) — it has
    // the splitting / focus-advance logic the typed-paste path uses. Fails
    // silently if the page doesn't have clipboard permission (Safari iOS
    // requires a user gesture; this click counts).
    const onPaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (!text) return;
            onChange(text, 0, mnemonic[0]);
        } catch (e) {
            console.error(e);
        }
    };

    const onSubmit = async () => {
        if (isLoading) return;

        const emptyIndex = getEmptyWordIndex(mnemonic);
        if (emptyIndex !== -1) {
            focusInput(ref.current, emptyIndex);

            return;
        }

        const invalidIndex = getInvalidWordIndex(mnemonic);
        if (invalidIndex !== -1) {
            focusInput(ref.current, invalidIndex);
            notifyError();
            onInvalidMnemonic?.(mnemonic);

            return;
        }

        const isValid = await validateMnemonicTonOrMAM(mnemonic);
        if (!isValid) {
            notifyError();
            onInvalidMnemonic?.(mnemonic);
            return;
        }

        onMnemonic(mnemonic);
    };

    useInputFocusScroll(ref);
    useSetModalTopBarTitle(t('import_wallet_title_web'));

    return (
        <form
            id={MNEMONIC_FORM_ID}
            onSubmit={handleSubmit(onSubmit)}
            className="mx-auto flex w-full max-w-[524px] flex-col"
        >
            <p className="pb-4 text-balance text-center text-body1 text-textSecondary">
                {t(wordsNumber === 12 ? 'import_wallet_caption_12' : 'import_wallet_caption')}
            </p>

            {enableShortMnemonic && (
                <div className="flex justify-center pb-2 pt-1">
                    <WordsLengthToggle value={wordsNumber} onChange={setWordsNumber} />
                </div>
            )}

            <div
                ref={ref}
                className={cn('grid grid-cols-1 gap-4 py-4 lg:grid-cols-2', isEmpty && 'pb-16')}
            >
                {mnemonic.map((item, index) => (
                    <WordInput
                        key={index}
                        value={item}
                        test={index + 1}
                        isValid={validations[index]}
                        onChange={newValue => onChange(newValue, index, item)}
                        tabIndex={index + 1}
                    />
                ))}
            </div>

            {/* Floats over the empty grid (inside the `pb-16` reserve) and
                sticks to the bottom of the modal's scroll viewport while the
                words scroll, so Paste is reachable without scrolling. */}
            {isEmpty && (
                <div className="pointer-events-none sticky bottom-4 -mt-16 flex justify-center">
                    <Button
                        type="button"
                        size="small"
                        variant="tertiary"
                        onClick={onPaste}
                        className="pointer-events-auto"
                    >
                        {t('paste')}
                    </Button>
                </div>
            )}

            <ModalFooterPortal>
                <ModalFooter>
                    <Button
                        size="large"
                        fullWidth
                        variant="primaryBlue"
                        loading={isLoading}
                        type="submit"
                        form={MNEMONIC_FORM_ID}
                    >
                        {t('continue')}
                    </Button>
                </ModalFooter>
            </ModalFooterPortal>
        </form>
    );
};
