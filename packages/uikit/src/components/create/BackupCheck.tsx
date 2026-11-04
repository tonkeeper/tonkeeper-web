import { wordlist } from '@ton/crypto/dist/mnemonic/wordlist';
import { FC, useId, useMemo, useState } from 'react';
import { useAppSdk } from '../../hooks/appSdk';
import { useTranslation } from '../../hooks/translation';
import { cn } from '../../libs/css';
import { handleSubmit } from '../../libs/form';
import { Button } from '../../primitives/Button';
import { ModalFooter, ModalFooterPortal } from '../../primitives/Modal';

/**
 * Create-flow backup verification. Picks three random word positions —
 * one from each third of the phrase — and for each offers the real word
 * next to two decoys from the wordlist. The action button enables once
 * every position has a pick; a wrong pick set is rejected on submit.
 */

const DECOYS_PER_WORD = 2;

const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min)) + min;

function shuffle<T>(items: T[]): T[] {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
        const j = getRandomInt(0, i + 1);
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

interface Row {
    position: number;
    expected: string;
    options: string[];
}

const buildRows = (mnemonic: string[]): Row[] => {
    const third = Math.floor(mnemonic.length / 3);
    const positions = [
        getRandomInt(1, third + 1),
        getRandomInt(third + 1, 2 * third + 1),
        getRandomInt(2 * third + 1, mnemonic.length + 1)
    ];
    // Decoys never come from the phrase itself, so a user who wrote the
    // phrase down correctly can't be tripped up by a real-but-misplaced word.
    const phrase = new Set(mnemonic);
    const decoyPool = wordlist.filter(word => !phrase.has(word));
    return positions.map(position => {
        const expected = mnemonic[position - 1];
        const decoys = shuffle(decoyPool).slice(0, DECOYS_PER_WORD);
        return { position, expected, options: shuffle([expected, ...decoys]) };
    });
};

export const BackupCheck: FC<{
    mnemonic: string[];
    onConfirm: () => void;
    /** The submitted picks don't match the phrase. */
    onFailedAttempt?: () => void;
    isLoading?: boolean;
}> = ({ mnemonic, onConfirm, onFailedAttempt, isLoading }) => {
    const { t } = useTranslation();
    const sdk = useAppSdk();
    const formId = useId();

    const rows = useMemo(() => buildRows(mnemonic), [mnemonic]);
    const [selected, setSelected] = useState<(string | undefined)[]>(() =>
        rows.map(() => undefined)
    );
    const [isError, setIsError] = useState(false);
    const [failedAttempts, setFailedAttempts] = useState(0);

    const allSelected = selected.every(Boolean);

    const onSelect = (rowIndex: number, word: string) => {
        setSelected(prev => prev.map((w, i) => (i === rowIndex ? word : w)));
        setIsError(false);
    };

    const onSubmit = () => {
        const isValid = rows.every((row, i) => selected[i] === row.expected);
        if (!isValid) {
            sdk.hapticNotification('error');
            setIsError(true);
            setFailedAttempts(n => n + 1);
            onFailedAttempt?.();
            return;
        }
        onConfirm();
    };

    const caption = isError
        ? t('check_backup_error_caption')
        : t('check_backup_caption')
              .replace('%1%', String(rows[0].position))
              .replace('%2%', String(rows[1].position))
              .replace('%3%', String(rows[2].position));

    return (
        <form
            id={formId}
            onSubmit={handleSubmit(onSubmit)}
            className="mx-auto flex w-full max-w-[524px] flex-col"
        >
            <div className="flex flex-col items-center gap-1 px-4 pb-4 text-center">
                <h2 className="text-h2 text-textPrimary">{t('check_words_title')}</h2>
                <p
                    className={cn(
                        'text-balance text-body1',
                        isError ? 'text-accentRed' : 'text-textSecondary'
                    )}
                >
                    {caption}
                </p>
            </div>

            {/* Remounting on every failed attempt replays the shake. */}
            <div
                key={failedAttempts}
                className={cn('flex flex-col gap-3.5 py-4', isError && 'animate-shake')}
            >
                {rows.map((row, rowIndex) => (
                    <div key={row.position} className="flex flex-col gap-1.5">
                        <span className="px-4 text-body1 text-textSecondary">{row.position}.</span>
                        <div role="radiogroup" className="flex gap-1.5">
                            {row.options.map(option => {
                                const isSelected = selected[rowIndex] === option;
                                return (
                                    <Button
                                        key={option}
                                        role="radio"
                                        aria-checked={isSelected}
                                        variant="secondary"
                                        size="medium"
                                        fullWidth
                                        onClick={() => onSelect(rowIndex, option)}
                                        className={cn(
                                            'min-w-0 flex-1 ring-inset ring-[1.5px]',
                                            !isSelected && 'ring-transparent',
                                            isSelected && !isError && 'ring-fieldActiveBorder',
                                            isSelected && isError && 'ring-fieldErrorBorder'
                                        )}
                                    >
                                        {option}
                                    </Button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            <ModalFooterPortal>
                <ModalFooter>
                    <Button
                        size="large"
                        variant="primaryBlue"
                        fullWidth
                        type="submit"
                        form={formId}
                        loading={isLoading}
                        disabled={!allSelected}
                    >
                        {t('create_wallet_done_button')}
                    </Button>
                </ModalFooter>
            </ModalFooterPortal>
        </form>
    );
};
