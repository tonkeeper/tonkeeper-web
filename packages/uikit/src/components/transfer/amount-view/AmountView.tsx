import { BLOCKCHAIN_NAME } from '@tonkeeper/core/dist/entries/crypto';
import { Asset } from '@tonkeeper/core/dist/entries/crypto/asset/asset';
import {
    TonAsset,
    jettonToTonAsset,
    legacyTonAssetId
} from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { RecipientData, isTonRecipientData } from '@tonkeeper/core/dist/entries/send';
import { toShortValue } from '@tonkeeper/core/dist/utils/common';
import { isNumeric } from '@tonkeeper/core/dist/utils/send';
import BigNumber from 'bignumber.js';
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
import { formatter } from '../../../hooks/balance';
import { useTranslation } from '../../../hooks/translation';
import { useUserAssetBalance } from '../../../state/asset';
import { useUserJettonList } from '../../../state/jetton';
import { useRate } from '../../../state/rates';
import { useWalletAccountInfo, useWalletJettonList } from '../../../state/wallet';
import { ChevronLeftIcon } from '../../Icon';
import { Gap } from '../../Layout';
import {
    FullHeightBlock,
    NotificationCancelButton,
    NotificationTitleBlock
} from '../../Notification';
import { Label1 } from '../../Text';
import { BackButton } from '../../fields/BackButton';
import { Button } from '../../fields/Button';
import { AssetSelect } from '../AssetSelect';
import { InputSize, Sentence } from '../Sentence';
import { defaultSize, getInputSize, useAutoFocusOnChange, useButtonPosition } from '../amountHooks';
import { ButtonBlock } from '../common';
import {
    Address,
    AmountBlock,
    AssetBadge,
    Center,
    FiatBlock,
    InputBlock,
    MaxButton,
    MaxRow,
    RecipientName,
    Remaining,
    RemainingInvalid,
    SelectCenter,
    SubTitle,
    Symbol,
    Title,
    inputToBigNumber
} from './AmountViewUI';
import { AmountState2, amountStateReducer, toInitAmountState } from './amountState';

export type AmountViewState = {
    asset: Asset;
    amount: BigNumber;
    fiatAmount?: BigNumber;
    isMax: boolean;
    inFiat: boolean;
};

const toTokenRateSymbol = (amountState: AmountState2) => {
    return amountState.token.blockchain === BLOCKCHAIN_NAME.TRON
        ? amountState.token.symbol
        : legacyTonAssetId(amountState.token as TonAsset, { userFriendly: true });
};

export const AmountView: FC<{
    onClose: () => void;
    onBack: (state: AmountViewState) => void;
    onConfirm: (state: AmountViewState) => void;
    recipient: RecipientData;
    defaults?: Partial<AmountViewState>;
}> = ({ recipient, onClose, onBack, onConfirm, defaults }) => {
    const { t } = useTranslation();
    const { fiat, standalone } = useAppContext();
    const blockchain = recipient.address.blockchain;

    const { data: notFilteredJettons } = useWalletJettonList();
    const jettons = useUserJettonList(notFilteredJettons);
    const { data: info } = useWalletAccountInfo();

    const [amountState, dispatch] = useReducer(
        amountStateReducer,
        toInitAmountState(defaults, blockchain)
    );

    const { data: tokenRate, isLoading: rateLoading } = useRate(toTokenRateSymbol(amountState));
    const { data: balance, isLoading: balanceLoading } = useUserAssetBalance(amountState.token);

    const secondaryAmount: BigNumber | undefined = amountState.inFiat
        ? amountState.coinValue
        : amountState.fiatValue;

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

    const handleBack = () => {
        onBack({
            asset: amountState.token,
            amount: amountState.coinValue,
            fiatAmount: amountState.fiatValue,
            isMax: amountState.isMax,
            inFiat: amountState.inFiat
        });
    };

    const onSubmit: React.FormEventHandler<HTMLFormElement> = async e => {
        e.stopPropagation();
        e.preventDefault();
        if (isValid) {
            onConfirm({
                asset: amountState.token,
                amount: amountState.coinValue,
                fiatAmount: amountState.fiatValue,
                isMax: amountState.isMax,
                inFiat: amountState.inFiat
            });
        }
    };

    const address = toShortValue(
        isTonRecipientData(recipient)
            ? recipient.toAccount.address.bounceable
            : recipient.address.address
    );

    return (
        <FullHeightBlock onSubmit={onSubmit} standalone={standalone}>
            <NotificationTitleBlock>
                <BackButton onClick={handleBack}>
                    <ChevronLeftIcon />
                </BackButton>
                <Center>
                    <Title>{t('txActions_amount')}</Title>
                    <SubTitle>
                        {t('send_screen_steps_done_to').replace('%{name}', '')}
                        <RecipientName recipient={recipient} />
                        <Address>{address}</Address>
                    </SubTitle>
                </Center>
                <NotificationCancelButton handleClose={onClose} />
            </NotificationTitleBlock>

            <AmountBlock ref={refBlock}>
                <SelectCenter>
                    {blockchain === BLOCKCHAIN_NAME.TON ? (
                        <AssetSelect
                            info={info}
                            jetton={legacyTonAssetId(amountState.token as TonAsset)}
                            setJetton={onJetton}
                            jettons={jettons}
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

                {secondaryAmount && (
                    <FiatBlock onClick={toggleFiat}>
                        {formatter.format(secondaryAmount, {
                            ignoreZeroTruncate: !amountState.inFiat,
                            decimals: amountState.inFiat ? amountState.token.decimals : 2
                        })}{' '}
                        {amountState.inFiat ? amountState.token.symbol : fiat}
                    </FiatBlock>
                )}
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
            <ButtonBlock ref={refButton}>
                <Button
                    fullWidth
                    size="large"
                    primary
                    type="submit"
                    disabled={!isValid}
                    loading={rateLoading || balanceLoading}
                >
                    {t('continue')}
                </Button>
            </ButtonBlock>
        </FullHeightBlock>
    );
};
