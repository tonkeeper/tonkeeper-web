import { mnemonicValidate } from '@ton/crypto';
import { wordlist } from '@ton/crypto/dist/mnemonic/wordlist';
import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { css } from 'styled-components';
import { useAppContext } from '../../hooks/appContext';
import { useAppSdk } from '../../hooks/appSdk';
import { openIosKeyboard } from '../../hooks/ios';
import { useTranslation } from '../../hooks/translation';
import { AppRoute } from '../../libs/routes';
import { BackButtonBlock } from '../BackButton';
import { CenterContainer } from '../Layout';
import { Body1, Body2, H2 } from '../Text';
import { Button } from '../fields/Button';

const Block = styled.div`
    display: flex;
    text-align: center;
    gap: 1rem;
    flex-direction: column;

    & + & {
        margin-top: 2rem;
    }
`;

const Header = styled(H2)`
    user-select: none;
`;
const Body = styled(Body1)`
    user-select: none;

    text-align: center;
    color: ${props => props.theme.textSecondary};
`;

export const WorldsGrid = styled.div`
    display: grid;
    grid-template-rows: repeat(12, minmax(0, 1fr));
    grid-auto-flow: column;
    gap: 0.5rem;
    place-content: space-evenly;
    margin: 1rem 0;

    white-space: normal;
`;

const World = styled(Body1)``;

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

export const ButtonRow = styled.div`
    display: flex;
`;

export const Worlds: FC<{
    mnemonic: string[];
    onBack: () => void;
    onCheck: () => void;
}> = ({ mnemonic, onBack, onCheck }) => {
    const sdk = useAppSdk();
    const { t } = useTranslation();

    useEffect(() => {
        if (sdk.twaExpand) {
            sdk.twaExpand();
        }
    }, []);

    return (
        <CenterContainer>
            <BackButtonBlock onClick={onBack} />
            <Block>
                <div>
                    <Header>{t('secret_words_title')}</Header>
                    <Body>{t('secret_words_caption')}</Body>
                </div>
            </Block>

            <WorldsGrid>
                {mnemonic.map((world, index) => (
                    <World key={index}>
                        <WorldNumber> {index + 1}.</WorldNumber> {world}{' '}
                    </World>
                ))}
            </WorldsGrid>

            <Button size="large" fullWidth primary marginTop onClick={onCheck}>
                {t('continue')}
            </Button>
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
    border-radius: ${props => props.theme.cornerSmall};
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
    }
    ${Input} {
        display: inline-block;
        width: calc(100% - 38px);
        height: 54px;
        line-height: 54px;
        box-sizing: border-box;
    }
`;

const WordInput: FC<{
    value: string;
    onChange: (value: string) => void;
    focusNext: () => void;
    test: number;
    isValid?: boolean;
    tabIndex: number;
}> = ({ value, test, onChange, focusNext, isValid, tabIndex }) => {
    const [active, setActive] = useState(false);
    const [touched, setTouched] = useState(false);

    const valid = touched ? isValid === true : isValid || active;

    const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = useCallback(
        event => {
            if (event.key === 'Enter') {
                focusNext();
            }
        },
        [focusNext]
    );

    return (
        <InputBlock submitted={touched} active={active} valid={valid}>
            <Number1>{test}:</Number1>
            <Input
                tabIndex={tabIndex}
                autoComplete="off"
                value={value}
                onChange={e => onChange(e.target.value.toLocaleLowerCase())}
                onFocus={() => setActive(true)}
                onKeyDown={handleKeyDown}
                onBlur={() => {
                    setTouched(true);
                    setActive(false);
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

const seeIfValid = (value: string, mnemonic: string) => {
    return value === '' || value.toLowerCase().trim() === mnemonic;
};

export const Check: FC<{
    mnemonic: string[];
    onBack: () => void;
    onConfirm: () => void;
    isLoading?: boolean;
}> = ({ onBack, onConfirm, mnemonic, isLoading }) => {
    const { t, i18n } = useTranslation();

    const [one, setOne] = useState('');
    const [two, setTwo] = useState('');
    const [three, setThree] = useState('');

    const ref = useRef<HTMLDivElement>(null);

    const [test1, test2, test3] = useMemo(() => {
        return [getRandomInt(1, 8), getRandomInt(8, 16), getRandomInt(16, 24)];
    }, []);

    const description = useMemo(() => {
        return t('check_words_caption')
            .replace('%1%', formatOrdinals(i18n.language, test1))
            .replace('%2%', formatOrdinals(i18n.language, test2))
            .replace('%3%', formatOrdinals(i18n.language, test3));
    }, [t, test1, test2, test3]);

    const isValid =
        one.toLowerCase().trim() === mnemonic[test1 - 1] &&
        two.toLowerCase().trim() === mnemonic[test2 - 1] &&
        three.toLowerCase().trim() === mnemonic[test3 - 1];

    return (
        <CenterContainer>
            <BackButtonBlock onClick={onBack} />
            <Block>
                <div>
                    <Header>{t('check_words_title')}</Header>
                    <Body>{description}</Body>
                </div>
            </Block>

            <Block ref={ref}>
                <WordInput
                    tabIndex={1}
                    test={test1}
                    value={one}
                    onChange={setOne}
                    isValid={seeIfValid(one, mnemonic[test1 - 1])}
                    focusNext={() => focusInput(ref.current, 1)}
                />
                <WordInput
                    tabIndex={2}
                    test={test2}
                    value={two}
                    onChange={setTwo}
                    isValid={seeIfValid(two, mnemonic[test2 - 1])}
                    focusNext={() => focusInput(ref.current, 2)}
                />
                <WordInput
                    tabIndex={3}
                    test={test3}
                    value={three}
                    onChange={setThree}
                    isValid={seeIfValid(three, mnemonic[test3 - 1])}
                    focusNext={() => (isValid ? onConfirm() : undefined)}
                />
            </Block>
            <Block>
                <Button
                    tabIndex={4}
                    size="large"
                    fullWidth
                    primary
                    loading={isLoading}
                    disabled={!isValid}
                    onClick={onConfirm}
                >
                    {t('continue')}
                </Button>
            </Block>
        </CenterContainer>
    );
};

const Inputs = styled.div`
    display: grid;
    grid-template-rows: repeat(12, minmax(0, 1fr));
    grid-auto-flow: column;
    gap: 0.5rem;

    @media (max-width: 768px) {
        grid-template-rows: repeat(24, minmax(0, 1fr));
    }

    ${p =>
        p.theme.displayType === 'full-width' &&
        css`
            grid-template-rows: repeat(8, minmax(0, 1fr));
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

export const ImportWords: FC<{
    isLoading?: boolean;
    onMnemonic: (mnemonic: string[]) => void;
}> = ({ isLoading, onMnemonic }) => {
    const sdk = useAppSdk();
    const { standalone } = useAppContext();
    const ref = useRef<HTMLDivElement>(null);

    const { t } = useTranslation();
    const navigate = useNavigate();

    const [mnemonic, setMnemonic] = useState<string[]>(Array(24).fill(''));

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

    const notify = () => {
        sdk.topMessage(t('import_wallet_wrong_words_err'));
        sdk.hapticNotification('error');
    };

    const onSubmit = async () => {
        const invalid = mnemonic.findIndex(work => !seeIfValidWord(work));
        if (invalid !== -1) {
            focusInput(ref.current, invalid);
            notify();
        }
        if (mnemonic.length < 24) {
            focusInput(ref.current, mnemonic.length - 1);
            notify();
        }
        if (sdk.isIOs()) {
            openIosKeyboard('text');
        }
        const valid = await mnemonicValidate(mnemonic);
        if (!valid) {
            notify();
        } else {
            onMnemonic(mnemonic);
        }
    };

    return (
        <>
            <BackButtonBlock onClick={() => navigate(AppRoute.home)} />
            <Block>
                <div>
                    <Header>{t('import_wallet_title')}</Header>
                    <Body>{t('import_wallet_caption')}</Body>
                </div>
            </Block>
            <Block>
                <Inputs ref={ref}>
                    {mnemonic.map((item, index) => (
                        <WordInput
                            key={index}
                            value={item}
                            test={index + 1}
                            isValid={validations[index]}
                            onChange={newValue => onChange(newValue, index)}
                            tabIndex={index + 1}
                            focusNext={() => focusInput(ref.current, index + 1)}
                        />
                    ))}
                </Inputs>
            </Block>
            <Block>
                <Button
                    size="large"
                    fullWidth
                    primary
                    loading={isLoading}
                    onClick={onSubmit}
                    bottom={standalone}
                >
                    {t('continue')}
                </Button>
            </Block>
        </>
    );
};
