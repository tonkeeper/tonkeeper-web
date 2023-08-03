import { useMutation, useQueryClient } from '@tanstack/react-query';
import { BLOCKCHAIN_NAME, CryptoCurrency } from '@tonkeeper/core/dist/entries/crypto';
import {
    AmountData,
    AmountValue,
    RecipientData,
    isTonRecipientData
} from '@tonkeeper/core/dist/entries/send';
import { estimateJettonTransfer } from '@tonkeeper/core/dist/service/transfer/jettonService';
import { estimateTonTransfer } from '@tonkeeper/core/dist/service/transfer/tonService';
import { toShortValue } from '@tonkeeper/core/dist/utils/common';
import {
    TonAsset,
    jettonToTonAsset,
    legacyTonAssetId
} from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { TON_ASSET, TRON_USDT_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { formatSendValue, isNumeric } from '@tonkeeper/core/dist/utils/send';
import React, { FC, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useAppContext, useWalletContext } from '../../../hooks/appContext';
import { useAppSdk } from '../../../hooks/appSdk';
import { useTranslation } from '../../../hooks/translation';
import { useUserJettonList } from '../../../state/jetton';
import { useWalletAccountInfo, useWalletJettonList } from '../../../state/wallet';
import { ChevronLeftIcon } from '../../Icon';
import { Gap } from '../../Layout';
import {
    FullHeightBlock,
    NotificationCancelButton,
    NotificationTitleBlock
} from '../../Notification';
import { BackButton } from '../../fields/BackButton';
import { Button } from '../../fields/Button';
import { AssetSelect } from '../AssetSelect';
import { InputSize, Sentence } from '../Sentence';
import { defaultSize, getInputSize, useButtonPosition } from '../amountHooks';
import { ButtonBlock, notifyError } from '../common';
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
    inputToBigNumber,
    replaceTypedDecimalSeparator,
    seeIfValueValid
} from './AmountViewUI';
import { useRate } from '../../../state/rates';
import BigNumber from 'bignumber.js';
import { Label1 } from '../../Text';
import { TronAsset } from '@tonkeeper/core/dist/entries/crypto/asset/tron-asset';
import { useUserAssetBalance } from '../../../state/asset';
import { formatter } from '../../../hooks/balance';

const useEstimateTransaction = (recipient: RecipientData, token: TonAsset | TronAsset) => {
    const { t } = useTranslation();
    const sdk = useAppSdk();
    const { tonApi } = useAppContext();
    const wallet = useWalletContext();
    const client = useQueryClient();

    const { data: notFilteredJettons } = useWalletJettonList();
    const jettons = useUserJettonList(notFilteredJettons);

    return useMutation(async (options: AmountValue) => {
        if (token.blockchain === BLOCKCHAIN_NAME.TRON) {
            throw new Error('');
        }

        const jetton = legacyTonAssetId(token);
        try {
            if (jetton === CryptoCurrency.TON) {
                return await estimateTonTransfer(tonApi, wallet, recipient, options);
            } else {
                const [jettonInfo] = jettons.balances.filter(item => item.jettonAddress === jetton);
                return await estimateJettonTransfer(tonApi, wallet, recipient, options, jettonInfo);
            }
        } catch (e) {
            await notifyError(client, sdk, t, e);
            throw e;
        }
    });
};

export const AmountView: FC<{
    onClose: () => void;
    onBack: (data: AmountData | undefined) => void;
    setAmount: (data: AmountData | undefined) => void;
    recipient: RecipientData;
    defaultTokenAmount?: { token?: TonAsset | TronAsset; amount?: string; max?: boolean };
}> = ({ recipient, onClose, onBack, setAmount, defaultTokenAmount }) => {
    const blockchain = recipient.address.blockchain;
    const { data: notFilteredJettons } = useWalletJettonList();
    const jettons = useUserJettonList(notFilteredJettons);
    const { data: info } = useWalletAccountInfo();

    const { fiat, standalone } = useAppContext();

    const [fontSize, setFontSize] = useState<InputSize>(defaultSize);
    const [input, setInput] = useState<string>(defaultTokenAmount?.amount || '0');
    const [token, setToken] = useState<TonAsset | TronAsset>(
        defaultTokenAmount?.token ||
            (blockchain === BLOCKCHAIN_NAME.TON ? TON_ASSET : TRON_USDT_ASSET)
    );
    const [inFiat, setInFiat] = useState(false);
    const { data: tokenRate } = useRate(
        token.blockchain === BLOCKCHAIN_NAME.TRON && token.address === TRON_USDT_ASSET.address
            ? 'USDT'
            : legacyTonAssetId(token as TonAsset, { userFriendly: true })
    ); // TODO handle loading

    const { data: balance } = useUserAssetBalance(token); // TODO handle loading

    const [max, setMax] = useState(defaultTokenAmount?.max ?? false);

    let secondaryAmount: BigNumber | undefined;
    if (tokenRate?.prices) {
        secondaryAmount = inputToBigNumber(input)[inFiat ? 'div' : 'multipliedBy'](
            tokenRate.prices
        );
    }
    const coinAmount = inFiat ? secondaryAmount : inputToBigNumber(input);

    const toggleFiat = () => {
        setInFiat(v => !v);
        onInput(secondaryAmount!.decimalPlaces(2, BigNumber.ROUND_FLOOR).toFixed());
    };

    const ref = useRef<HTMLInputElement>(null);
    const refBlock = useRef<HTMLLabelElement>(null);
    const refButton = useRef<HTMLDivElement>(null);

    const { mutateAsync, isLoading, reset } = useEstimateTransaction(recipient, token);

    useButtonPosition(refButton, refBlock);

    useLayoutEffect(() => {
        if (refBlock.current) {
            setFontSize(getInputSize(input, refBlock.current));
        }
    }, [refBlock.current, input]);

    useEffect(() => {
        const timeout = setTimeout(() => {
            if (ref.current) {
                ref.current.focus();
            }
        }, 300);
        return () => {
            clearTimeout(timeout);
        };
    }, [ref.current, token]);

    const { t } = useTranslation();

    const onInput = (value: string) => {
        const decimals = inFiat ? 2 : token.decimals;

        value = replaceTypedDecimalSeparator(value);

        if (!seeIfValueValid(value, decimals)) {
            value = input;
        }

        if (isNumeric(value)) {
            value = formatSendValue(value);
        }

        setInput(value);
        setMax(false);
    };

    const remaining = balance.relativeAmount.minus(coinAmount || '0');
    const enoughBalance = remaining.gte(0);

    const isValid = useMemo(() => {
        return enoughBalance && isNumeric(input) && inputToBigNumber(input).isGreaterThan(0);
    }, [enoughBalance, input]);

    const handleBack = () => {
        if (isValid) {
            const fiatValue = inFiat ? inputToBigNumber(input) : undefined;

            onBack({
                amount: coinAmount!,
                fiat: fiatValue,
                max,
                done: false,
                //@ts-ignore
                jetton: legacyTonAssetId(token), // TODO
                fee: undefined!
            });
        } else {
            onBack(undefined);
        }
    };

    const onSubmit: React.FormEventHandler<HTMLFormElement> = async e => {
        e.stopPropagation();
        e.preventDefault();
        if (isValid) {
            reset();
            const fiatValue = inFiat ? inputToBigNumber(input) : undefined;

            const fee = await mutateAsync({
                amount: coinAmount!,
                fiat: fiatValue,
                max
            });

            setAmount({
                amount: coinAmount!,
                fiat: fiatValue,
                max,
                done: true,
                // @ts-ignore
                jetton: legacyTonAssetId(token), // TODO
                fee
            });
        }
    };

    const onMax = () => {
        if (!refBlock.current) return;

        const value = balance.relativeAmount.toFixed();
        let inputValue = inFiat
            ? new BigNumber(value)
                  .multipliedBy(tokenRate!.prices)
                  .decimalPlaces(2, BigNumber.ROUND_FLOOR)
                  .toFixed()
            : value;

        inputValue = replaceTypedDecimalSeparator(inputValue);

        if (isNumeric(inputValue)) {
            inputValue = formatSendValue(inputValue);
        }

        setInput(inputValue);
        setMax(state => !state);
    };

    const onJetton = (address: string) => {
        setToken(jettonToTonAsset(address, jettons));
        setMax(false);
        setInFiat(false);
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
                            jetton={legacyTonAssetId(token as TonAsset)}
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
                    <Sentence ref={ref} value={input} setValue={onInput} inputSize={fontSize} />
                    <Symbol>{inFiat ? fiat : token.symbol}</Symbol>
                </InputBlock>

                {secondaryAmount && (
                    <FiatBlock onClick={toggleFiat}>
                        {formatter.format(secondaryAmount)} {inFiat ? token.symbol : fiat}
                    </FiatBlock>
                )}
            </AmountBlock>
            <MaxRow>
                <MaxButton maxValue={max} onClick={onMax}>
                    {t('Max')}
                </MaxButton>
                {enoughBalance ? (
                    <Remaining>
                        {t('Remaining').replace('%1%', formatter.format(remaining))}
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
                    loading={isLoading}
                >
                    {t('continue')}
                </Button>
            </ButtonBlock>
        </FullHeightBlock>
    );
};
