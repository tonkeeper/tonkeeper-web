import { BLOCKCHAIN_NAME } from '@tonkeeper/core/dist/entries/crypto';
import {
    TonAsset,
    jettonToTonAsset,
    legacyTonAssetId
} from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { RecipientData } from '@tonkeeper/core/dist/entries/send';
import { isNumeric } from '@tonkeeper/core/dist/utils/send';
import React, {
    FC,
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useReducer,
    useRef,
    useState
} from 'react';
import { useAppContext } from '../../../hooks/appContext';
import { useAppSdk } from '../../../hooks/appSdk';
import { formatter } from '../../../hooks/balance';
import { useTranslation } from '../../../hooks/translation';
import { useIsFullWidthMode } from '../../../hooks/useIsFullWidthMode';
import { useUserAssetBalance } from '../../../state/asset';
import { useJettonList } from '../../../state/jetton';
import { useRate } from '../../../state/rates';
import { useWalletAccountInfo } from '../../../state/wallet';
import { Gap } from '../../Layout';
import {
    FullHeightBlock,
    NotificationFooter,
    NotificationFooterPortal,
    NotificationHeader,
    NotificationHeaderPortal
} from '../../Notification';
import { Label1 } from '../../Text';
import { InputSize, Sentence } from '../Sentence';
import { AmountHeaderBlockComponent, AmountMainButtonComponent } from '../common';
import {
    AmountBlock,
    AssetBadge,
    InputBlock,
    MaxButton,
    MaxRow,
    RecipientAddress,
    RecipientName,
    Remaining,
    RemainingInvalid,
    SecondaryAmount,
    SelectCenter,
    SubTitle,
    Symbol,
    inputToBigNumber
} from './AmountViewUI';
import { AssetSelect } from './AssetSelect';
import { defaultSize, getInputSize, useAutoFocusOnChange, useButtonPosition } from './amountHooks';
import {
    AmountState,
    amountStateReducer,
    toInitAmountState,
    toTokenRateSymbol
} from './amountState';

export const AmountView: FC<{
    onClose: () => void;
    onBack: (state: AmountState) => void;
    onConfirm: (state: AmountState) => void;
    recipient: RecipientData;
    defaults?: Partial<AmountState>;
    MainButton: AmountMainButtonComponent;
    HeaderBlock: AmountHeaderBlockComponent;
    isAnimationProcess: boolean;
}> = ({
    recipient,
    onClose,
    onBack,
    onConfirm,
    defaults,
    MainButton,
    HeaderBlock,
    isAnimationProcess
}) => {
    const { t } = useTranslation();
    const sdk = useAppSdk();
    const { standalone, fiat } = useAppContext();
    const blockchain = recipient.address.blockchain;
    const isFullWidth = useIsFullWidthMode();
    const shouldHideHeaderAndFooter = isFullWidth && isAnimationProcess;

    const { data: jettons } = useJettonList();
    const { data: info } = useWalletAccountInfo();

    const [amountState, dispatch] = useReducer(
        amountStateReducer,
        toInitAmountState(defaults, blockchain)
    );

    const { data: tokenRate, isLoading: rateLoading } = useRate(toTokenRateSymbol(amountState));
    const { data: balance, isLoading: balanceLoading } = useUserAssetBalance(amountState.token);

    const ref = useRef<HTMLInputElement>(null);
    const refBlock = useRef<HTMLLabelElement>(null);
    const refButton = useRef<HTMLDivElement>(null);

    useButtonPosition(refButton, refBlock);
    useAutoFocusOnChange(ref, amountState.token);

    const [fontSize, setFontSize] = useState<InputSize>(defaultSize);
    useLayoutEffect(() => {
        if (refBlock.current) {
            setFontSize(getInputSize(amountState.inputValue, refBlock.current));
        }
    }, [refBlock.current, amountState.inputValue]);

    useEffect(() => {
        dispatch({ kind: 'price', payload: { prices: tokenRate?.prices } });
    }, [dispatch, tokenRate]);

    const toggleFiat = useCallback(() => {
        dispatch({ kind: 'toggle', payload: undefined });
    }, []);

    const onInput = useCallback(
        (value: string) => {
            dispatch({ kind: 'input', payload: { value, prices: tokenRate?.prices } });
        },
        [dispatch, tokenRate]
    );

    const onMax = useCallback(() => {
        dispatch({
            kind: 'max',
            payload: { value: balance.relativeAmount, prices: tokenRate?.prices }
        });
    }, [dispatch, balance, tokenRate]);

    const onJetton = useCallback(
        (address: string) => {
            if (!jettons) return;
            dispatch({
                kind: 'select',
                payload: { token: jettonToTonAsset(address, jettons) }
            });
        },
        [dispatch, jettons]
    );

    const remaining = balance.relativeAmount.minus(amountState.coinValue);
    const enoughBalance = remaining.gte(0);

    const isValid = useMemo(() => {
        return (
            enoughBalance &&
            isNumeric(amountState.inputValue) &&
            inputToBigNumber(amountState.inputValue).isGreaterThan(0)
        );
    }, [enoughBalance, amountState.inputValue]);

    const handleBack = useCallback(() => {
        onBack(amountState);
    }, [onBack, amountState]);

    const handleSubmit = useCallback(() => {
        if (isValid) {
            onConfirm(amountState);
        } else {
            sdk.hapticNotification('error');
        }
    }, [isValid, onConfirm, amountState, sdk]);

    const onSubmit: React.FormEventHandler<HTMLFormElement> = async e => {
        e.stopPropagation();
        e.preventDefault();
        handleSubmit();
    };

    return (
        <FullHeightBlock onSubmit={onSubmit} standalone={standalone}>
            {!shouldHideHeaderAndFooter && (
                <NotificationHeaderPortal>
                    <NotificationHeader>
                        <HeaderBlock onClose={onClose} onBack={handleBack}>
                            <SubTitle>
                                {t('send_screen_steps_done_to').replace('%{name}', '')}
                                <RecipientName recipient={recipient} />
                                <RecipientAddress recipient={recipient} />
                            </SubTitle>
                        </HeaderBlock>
                    </NotificationHeader>
                </NotificationHeaderPortal>
            )}

            <AmountBlock ref={refBlock}>
                <SelectCenter>
                    {blockchain === BLOCKCHAIN_NAME.TON ? (
                        <AssetSelect
                            info={info}
                            jetton={legacyTonAssetId(amountState.token as TonAsset)}
                            setJetton={onJetton}
                            jettons={jettons ?? { balances: [] }}
                        />
                    ) : (
                        <AssetBadge>
                            <Label1>TRC20</Label1>
                        </AssetBadge>
                    )}
                </SelectCenter>
                <InputBlock>
                    <Sentence
                        ref={ref}
                        value={amountState.inputValue}
                        setValue={onInput}
                        inputSize={fontSize}
                    />
                    <Symbol>{amountState.inFiat ? fiat : amountState.token.symbol}</Symbol>
                </InputBlock>

                <SecondaryAmount amountState={amountState} toggleFiat={toggleFiat} />
            </AmountBlock>
            <MaxRow>
                <MaxButton maxValue={amountState.isMax} onClick={onMax}>
                    {t('send_screen_steps_amount_max')}
                </MaxButton>
                {enoughBalance ? (
                    <Remaining>
                        {t('send_screen_steps_amount_remaining').replace(
                            '%{amount}',
                            formatter.format(remaining, { decimals: amountState.token.decimals })
                        )}{' '}
                        {amountState.token.symbol}
                    </Remaining>
                ) : (
                    <RemainingInvalid>
                        {t('send_screen_steps_amount_insufficient_balance')}
                    </RemainingInvalid>
                )}
            </MaxRow>

            <Gap />

            {!shouldHideHeaderAndFooter && (
                <NotificationFooterPortal>
                    <NotificationFooter>
                        <MainButton
                            ref={refButton}
                            isDisabled={!isValid}
                            isLoading={rateLoading || balanceLoading}
                            onClick={handleSubmit}
                        />
                    </NotificationFooter>
                </NotificationFooterPortal>
            )}
        </FullHeightBlock>
    );
};
