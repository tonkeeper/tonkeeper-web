import { wordlist } from '@ton/crypto/dist/mnemonic/wordlist';
import { FC, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import styled, { css } from 'styled-components';
import { useAppSdk } from '../../hooks/appSdk';
import { useTranslation } from '../../hooks/translation';
import { CenterContainer } from '../Layout';
import { Body1, Body2, Body2Class, Body3, H2Label2Responsive, Label2 } from '../Text';
import { Button, ButtonResponsiveSize } from '../fields/Button';
import { BorderSmallResponsive } from '../shared/Styles';
import { ExclamationMarkCircleIcon } from '../Icon';
import { validateMnemonicTonOrMAM } from '@tonkeeper/core/dist/service/mnemonicService';
import { ToggleButton, ToggleButtonItem } from '../shared/ToggleButton';
import { useActiveConfig } from '../../state/wallet';
import { hexToRGBA } from '../../libs/css';
import { handleSubmit } from '../../libs/form';
import { NotificationFooter, NotificationFooterPortal } from '../Notification';
import { useInputFocusScroll } from '../../hooks/keyboard/useInputFocusScroll';

const Block = styled.div`
    display: flex;
    text-align: center;
    gap: 1rem;
    flex-direction: column;
    margin-bottom: 16px;

    & + & {
        margin-top: 2rem;
    }
`;

const CheckForm = styled.form`
    display: flex;
    flex-direction: column;
    justify-content: center;
`;

const BlockSmallGap = styled(Block)`
    ${p =>
        p.theme.displayType === 'full-width' &&
        css`
            gap: 8px;
        `}
`;

const HeadingBlock = styled(Block)`
    ${p =>
        p.theme.displayType === 'full-width' &&
        css`
            gap: 2px;
        `}
`;

const Body = styled(Body1)`
    user-select: none;

    text-align: center;
    color: ${props => props.theme.textSecondary};

    ${p =>
        p.theme.displayType === 'full-width' &&
        css`
            ${Body2Class};
            max-width: 450px;
            display: block;
            margin: 0 auto;
        `}

    text-wrap: balance;
`;

export const WorldsGrid = styled.div<{ wordsNumber: 12 | 24 }>`
    display: grid;
    grid-template-rows: repeat(${p => p.wordsNumber / 2}, minmax(0, 1fr));
    grid-auto-flow: column;
    gap: 0.5rem;
    place-content: space-evenly;
    margin: 1rem 0;

    white-space: normal;
`;

export const WorldNumber = styled(Body2)`
    display: inline-block;
    width: 24px;
    line-height: 24px;
    color: ${props => props.theme.textSecondary};

    user-select: none;
`;

const Number1 = styled(Body1)`
    display: inline-block;
    width: 26px;
    text-align: right;

    font-size: 15px;

    color: ${props => props.theme.textSecondary};
`;

const WorldsGridStyled = styled(WorldsGrid)`
    margin-top: 0;
`;

const MamAccountCallout = styled.div`
    background: ${p => p.theme.backgroundContent};
    ${BorderSmallResponsive};
    padding: 8px 12px;
    display: flex;
    gap: 12px;
    margin-bottom: 24px;
`;

const TronAccountCallout = styled.div`
    background: ${p => hexToRGBA(p.theme.accentOrange, 0.16)};
    ${BorderSmallResponsive};
    padding: 8px 12px;
    display: flex;
    gap: 12px;
    margin-bottom: 24px;
`;

const Body3Secondary = styled(Body3)`
    color: ${p => p.theme.textSecondary};
`;

const Body3Orange = styled(Body3)`
    color: ${p => p.theme.accentOrange};
`;

const ExclamationMarkCircleIconStyled = styled(ExclamationMarkCircleIcon)`
    margin-top: 4px;
    height: 16px;
    width: 16px;
    color: ${p => p.theme.accentOrange};
    flex-shrink: 0;
`;

const LinkStyled = styled(Body3)`
    color: ${p => p.theme.accentBlueConstant};
    cursor: pointer;
`;

const H2Label2ResponsiveStyled = styled(H2Label2Responsive)`
    ${p =>
        p.theme.displayType === 'compact' &&
        css`
            padding: 0 40px;
        `}
`;

export const WordsGridAndHeaders: FC<{
    mnemonic: string[];
    type?: 'standard' | 'mam' | 'tron';
    allowCopy?: boolean;
    descriptionDown?: boolean;
}> = ({ mnemonic, type, allowCopy, descriptionDown }) => {
    const { t } = useTranslation();
    const config = useActiveConfig();
    const sdk = useAppSdk();
    type ??= 'standard';

    const MamNotice = type === 'mam' && (
        <MamAccountCallout>
            <div>
                <Body3Secondary>{t('mam_account_explanation') + ' '}</Body3Secondary>
                {!!config.mam_learn_more_url && (
                    <LinkStyled onClick={() => sdk.openPage(config.mam_learn_more_url!)}>
                        {t('learn_more')}
                    </LinkStyled>
                )}
            </div>
            <ExclamationMarkCircleIconStyled />
        </MamAccountCallout>
    );

    return (
        <>
            <HeadingBlock>
                <H2Label2ResponsiveStyled>
                    {t(
                        type === 'mam'
                            ? 'secret_words_account_title'
                            : type === 'tron'
                            ? 'export_trc_20_wallet'
                            : 'secret_words_title'
                    )}
                </H2Label2ResponsiveStyled>
                {!descriptionDown && (
                    <Body>
                        {t(
                            mnemonic.length === 12
                                ? 'secret_words_caption_12'
                                : 'secret_words_caption'
                        )}
                    </Body>
                )}
            </HeadingBlock>

            {!descriptionDown && MamNotice}

            {type === 'tron' && (
                <TronAccountCallout>
                    <div>
                        <Body3Orange>{t('tron_account_export_warning_explanation')}</Body3Orange>
                    </div>
                    <ExclamationMarkCircleIconStyled />
                </TronAccountCallout>
            )}

            <WorldsGridStyled wordsNumber={mnemonic.length as 12 | 24}>
                {mnemonic.map((world, index) => (
                    <Body1 key={index}>
                        <WorldNumber> {index + 1}.</WorldNumber> {world}{' '}
                    </Body1>
                ))}
            </WorldsGridStyled>

            {descriptionDown && (
                <>
                    {MamNotice}
                    <Body>
                        {t(
                            mnemonic.length === 12
                                ? 'secret_words_caption_12'
                                : 'secret_words_caption'
                        )}
                    </Body>
                </>
            )}

            {allowCopy && (
                <Button
                    onClick={() => sdk.copyToClipboard(mnemonic.join(' '), t('copied'))}
                    marginTop
                >
                    {t('recovery_phrase_copy_button')}
                </Button>
            )}
        </>
    );
};

export const Words: FC<{
    mnemonic: string[];
    onCheck: () => void;
    showMamInfo?: boolean;
}> = ({ mnemonic, onCheck, showMamInfo }) => {
    const sdk = useAppSdk();
    const { t } = useTranslation();

    useEffect(() => {
        if (sdk.twaExpand) {
            sdk.twaExpand();
        }
    }, []);

    return (
        <CenterContainer>
            <WordsGridAndHeaders mnemonic={mnemonic} type={showMamInfo ? 'mam' : 'standard'} />

            <NotificationFooterPortal>
                <NotificationFooter>
                    <ButtonResponsiveSize fullWidth primary marginTop onClick={onCheck}>
                        {t('continue')}
                    </ButtonResponsiveSize>
                </NotificationFooter>
            </NotificationFooterPortal>
        </CenterContainer>
    );
};

const Input = styled.input`
    outline: none;
    border: none;
    background: transparent;
    flex-grow: 1;
    font-weight: 500;
    font-size: 16px;

    color: ${props => props.theme.textPrimary};
`;

const InputBlock = styled.label<{
    active: boolean;
    valid: boolean;
    submitted?: boolean;
}>`
    width: 100%;
    line-height: 54px;
    ${BorderSmallResponsive};
    padding: 0 1rem;
    box-sizing: border-box;
    text-align: left;

    ${props => {
        if (props.submitted) {
            return !props.valid
                ? css`
                      border: 1px solid ${props.theme.fieldErrorBorder};
                      background: ${props.theme.fieldErrorBackground};
                  `
                : props.active
                ? css`
                      border: 1px solid ${props.theme.fieldActiveBorder};
                      background: ${props.theme.fieldBackground};
                  `
                : css`
                      border: 1px solid ${props.theme.fieldBackground};
                      background: ${props.theme.fieldBackground};
                  `;
        } else {
            return props.active
                ? css`
                      border: 1px solid ${props.theme.fieldActiveBorder};
                      background: ${props.theme.fieldBackground};
                  `
                : !props.valid
                ? css`
                      border: 1px solid ${props.theme.fieldErrorBorder};
                      background: ${props.theme.fieldErrorBackground};
                  `
                : css`
                      border: 1px solid ${props.theme.fieldBackground};
                      background: ${props.theme.fieldBackground};
                  `;
        }
    }}

    ${Number1} {
        display: inline-block;
        line-height: 54px;
        padding-right: 0.35rem;

        ${p =>
            p.theme.displayType === 'full-width' &&
            css`
                width: 3ch;
                height: fit-content;
                text-wrap: nowrap;
                line-height: normal;
                ${Body2Class};
            `}
    }
    ${Input} {
        display: inline-block;
        width: calc(100% - 38px);
        height: 54px;
        line-height: 54px;
        box-sizing: border-box;

        ${p =>
            p.theme.displayType === 'full-width' &&
            css`
                height: fit-content;
                line-height: normal;
                ${Body2Class};
            `}
    }

    ${p =>
        p.theme.displayType === 'full-width' &&
        css`
            height: 36px;
            line-height: normal;
            display: flex;
            align-items: center;
            padding: 0 12px;
        `}
`;

const WordInput: FC<{
    value: string;
    onChange: (value: string) => void;
    test: number;
    isValid: boolean;
    tabIndex: number;
}> = ({ value, test, onChange, isValid, tabIndex }) => {
    const [isActive, setIsActive] = useState(false);
    const [isTouched, setIsTouched] = useState(false);

    const isInputValid = isTouched ? isValid : isValid || isActive;

    return (
        <InputBlock submitted={isTouched} active={isActive} valid={isInputValid}>
            <Number1>{test}:</Number1>
            <Input
                tabIndex={tabIndex}
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                value={value}
                onChange={e => onChange(e.target.value.toLocaleLowerCase())}
                onFocus={() => setIsActive(true)}
                onBlur={() => {
                    setIsTouched(true);
                    setIsActive(false);
                }}
            />
        </InputBlock>
    );
};

function getRandomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min)) + min;
}

const formatOrdinals = (lang: string, n: number) => {
    if (lang === 'en') {
        const pr = new Intl.PluralRules(lang, { type: 'ordinal' });
        const suffixes = new Map([
            ['one', 'st'],
            ['two', 'nd'],
            ['few', 'rd'],
            ['other', 'th']
        ]);

        const rule = pr.select(n);
        const suffix = suffixes.get(rule);
        return `${n}${suffix}`;
    } else {
        return `${n}`;
    }
};

const compareWords = (word: string, testWord: string) =>
    word === '' || word.toLowerCase().trim() === testWord;

const getEmptyWordIndex = (words: string[]) => words.findIndex(word => word === '');
const getInvalidWordIndex = (words: string[]) => words.findIndex(word => !seeIfValidWord(word));

export const Check: FC<{
    mnemonic: string[];
    onConfirm: () => void;
    isLoading?: boolean;
}> = ({ onConfirm, mnemonic, isLoading }) => {
    const { t, i18n } = useTranslation();
    const formId = useId();

    const ref = useRef<HTMLDivElement>(null);

    const [words, setWords] = useState(['', '', '']);
    const positions = useMemo(() => {
        return [getRandomInt(1, 8), getRandomInt(8, 16), getRandomInt(16, 24)];
    }, []);
    const [test1, test2, test3] = positions;

    const description = useMemo(() => {
        return t('check_words_caption')
            .replace('%1%', formatOrdinals(i18n.language, test1))
            .replace('%2%', formatOrdinals(i18n.language, test2))
            .replace('%3%', formatOrdinals(i18n.language, test3));
    }, [t, test1, test2, test3]);

    const isValid = useMemo(
        () => words.every((val, i) => val.toLowerCase().trim() === mnemonic[positions[i] - 1]),
        [words, mnemonic, positions]
    );

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key !== 'Enter' || isValid) return;

            const emptyIndex = getEmptyWordIndex(words);
            if (emptyIndex !== -1) {
                focusInput(ref.current, emptyIndex);

                return;
            }

            const invalidIndex = getInvalidWordIndex(words);
            if (invalidIndex !== -1) {
                focusInput(ref.current, invalidIndex);

                return;
            }
        };
        window.addEventListener('keydown', handler);

        return () => window.removeEventListener('keydown', handler);
    }, [words]);

    const handleChange = (changeValue: string, wordIndex: number) =>
        setWords(prevWordsState =>
            prevWordsState.map((prevWord, prevIndex) =>
                prevIndex === wordIndex ? changeValue : prevWord
            )
        );

    return (
        <CheckForm onSubmit={handleSubmit(onConfirm)} id={formId}>
            <Block>
                <div>
                    <H2Label2Responsive>{t('check_words_title')}</H2Label2Responsive>
                    <Body>{description}</Body>
                </div>
            </Block>

            <BlockSmallGap ref={ref}>
                {words.map((word, wordIndex) => (
                    <WordInput
                        key={wordIndex}
                        tabIndex={wordIndex + 1}
                        test={positions[wordIndex]}
                        value={word}
                        onChange={newValue => handleChange(newValue, wordIndex)}
                        isValid={compareWords(word, mnemonic[positions[wordIndex] - 1])}
                    />
                ))}
            </BlockSmallGap>
            <NotificationFooterPortal>
                <NotificationFooter>
                    <ButtonResponsiveSize
                        tabIndex={4}
                        fullWidth
                        primary
                        type="submit"
                        form={formId}
                        loading={isLoading}
                        disabled={!isValid}
                    >
                        {t('continue')}
                    </ButtonResponsiveSize>
                </NotificationFooter>
            </NotificationFooterPortal>
        </CheckForm>
    );
};

const Inputs = styled.div<{ wordsNumber: 12 | 24 }>`
    display: grid;
    grid-template-rows: repeat(12, minmax(0, 1fr));
    grid-auto-flow: column;
    gap: 0.5rem;

    @media (max-width: 768px) {
        grid-template-rows: repeat(${p => p.wordsNumber}, minmax(0, 1fr));
    }

    ${p =>
        p.theme.displayType === 'full-width' &&
        css`
            grid-template-rows: ${p.wordsNumber === 24
                ? 'repeat(8, minmax(0, 1fr))'
                : 'repeat(4, minmax(0, 1fr))'};
        `}
`;

const seeIfValidWord = (word: string) => {
    return wordlist.includes(word);
};

const focusInput = (current: HTMLDivElement | null, index: number) => {
    if (!current) return;
    const wrapper = current.childNodes[index] as HTMLDivElement;
    if (!wrapper) return;
    wrapper.querySelector('input')?.focus();
};

const ToggleButtonStyled = styled(ToggleButton)`
    margin: 0 auto 1rem;
`;

export const ImportWords: FC<{
    isLoading?: boolean;
    onMnemonic: (mnemonic: string[]) => void;
    onIsDirtyChange?: (isDirty: boolean) => void;
    enableShortMnemonic?: boolean;
}> = ({ isLoading, onIsDirtyChange, onMnemonic, enableShortMnemonic = true }) => {
    const sdk = useAppSdk();
    const ref = useRef<HTMLDivElement>(null);
    const { t } = useTranslation();

    const [wordsNumber, setWordsNumber] = useState<12 | 24>(24);
    const [_mnemonic, setMnemonic] = useState<string[]>(Array(24).fill(''));

    const mnemonic = useMemo(() => {
        return _mnemonic.slice(0, wordsNumber);
    }, [_mnemonic, wordsNumber]);

    const isDirty = useMemo(() => mnemonic.some(Boolean), [mnemonic]);

    useEffect(() => {
        onIsDirtyChange?.(isDirty);
    }, [isDirty]);

    const onChange = useCallback(
        (newValue: string, index: number) => {
            if (newValue.includes(' ') || newValue.includes(String.fromCharCode(160))) {
                let values = newValue
                    .trim()
                    .replace(/\xA0/g, ' ') // replace char 160
                    .replace(/[0-9]/g, '') // remove numbers
                    .replace(/\./g, '') // remove dots
                    .replace(/\s+/g, ' ') // remove double spaces
                    .split(' ');

                if (!values[0]) return;

                if (values.length === 1) {
                    setMnemonic(items => items.map((v, i) => (i === index ? values[0] : v)));
                    focusInput(ref.current, index + 1);
                } else {
                    const max = Math.min(24 - index, values.length);
                    values = values.slice(0, max);
                    setMnemonic(items => {
                        items = [...items];
                        items.splice(index, max, ...values);
                        return items;
                    });
                    focusInput(ref.current, max - 1);
                }

                return;
            } else {
                return setMnemonic(items => items.map((v, i) => (i === index ? newValue : v)));
            }
        },
        [ref.current]
    );

    const validations = useMemo(() => {
        return mnemonic.map(item => item === '' || wordlist.includes(item));
    }, [mnemonic]);

    const notifyError = () => {
        sdk.topMessage(t('import_wallet_wrong_words_err'));
        sdk.hapticNotification('error');
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

            return;
        }

        const isValid = await validateMnemonicTonOrMAM(mnemonic);
        if (!isValid) {
            notifyError();
            return;
        }

        onMnemonic(mnemonic);
    };

    const scrollRef = useRef<HTMLFormElement>(null);
    useInputFocusScroll(scrollRef);

    return (
        <form onSubmit={handleSubmit(onSubmit)} ref={scrollRef}>
            <Block>
                <div>
                    <H2Label2Responsive>{t('import_wallet_title_web')}</H2Label2Responsive>
                    <Body>
                        {t(
                            wordsNumber === 12
                                ? 'import_wallet_caption_12'
                                : 'import_wallet_caption'
                        )}
                    </Body>
                </div>
            </Block>
            {enableShortMnemonic && (
                <ToggleButtonStyled>
                    <ToggleButtonItem
                        type="button"
                        active={wordsNumber === 24}
                        onClick={() => setWordsNumber(24)}
                    >
                        <Label2>{t('import_wallet_24_words')}</Label2>
                    </ToggleButtonItem>
                    <ToggleButtonItem
                        type="button"
                        active={wordsNumber === 12}
                        onClick={() => setWordsNumber(12)}
                    >
                        <Label2>{t('import_wallet_12_words')}</Label2>
                    </ToggleButtonItem>
                </ToggleButtonStyled>
            )}
            <Block>
                <Inputs ref={ref} wordsNumber={wordsNumber}>
                    {mnemonic.slice(0, wordsNumber).map((item, index) => (
                        <WordInput
                            key={index}
                            value={item}
                            test={index + 1}
                            isValid={validations[index]}
                            onChange={newValue => onChange(newValue, index)}
                            tabIndex={index + 1}
                        />
                    ))}
                </Inputs>
            </Block>
            <ButtonResponsiveSize fullWidth primary loading={isLoading} type="submit" marginTop>
                {t('continue')}
            </ButtonResponsiveSize>
        </form>
    );
};

export type ImportMnemonicType = 'tonKeychain' | 'tonMnemonic' | 'bip39';

export const SelectMnemonicType: FC<{
    availableTypes: ImportMnemonicType[];
    onSelect: (type: ImportMnemonicType) => void;
    isLoading?: boolean;
}> = ({ availableTypes, onSelect, isLoading }) => {
    const { t } = useTranslation();

    return (
        <>
            <Block>
                <H2Label2Responsive>{t('import_chose_mnemonic_type_title')}</H2Label2Responsive>
                <Body>{t('import_chose_mnemonic_type_description')}</Body>
            </Block>
            <NotificationFooterPortal>
                <NotificationFooter>
                    {isLoading ? (
                        <ButtonResponsiveSize fullWidth secondary loading />
                    ) : (
                        availableTypes.map(type => (
                            <ButtonResponsiveSize
                                key={type}
                                fullWidth
                                secondary
                                onClick={() => onSelect(type)}
                            >
                                {t(`import_chose_mnemonic_option_${type}`)}
                            </ButtonResponsiveSize>
                        ))
                    )}
                </NotificationFooter>
            </NotificationFooterPortal>
        </>
    );
};
