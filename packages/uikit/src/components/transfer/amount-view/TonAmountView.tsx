import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CryptoCurrency } from '@tonkeeper/core/dist/entries/crypto';
import { AmountData, AmountValue, TonRecipientData } from '@tonkeeper/core/dist/entries/send';
import { estimateJettonTransfer } from '@tonkeeper/core/dist/service/transfer/jettonService';
import { estimateTonTransfer } from '@tonkeeper/core/dist/service/transfer/tonService';
import { JettonsBalances } from '@tonkeeper/core/dist/tonApiV1';
import { toShortValue } from '@tonkeeper/core/dist/utils/common';
import {
    TonAsset,
    jettonToTonAsset,
    legacyTonAssetId
} from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { TON_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import {
    formatSendValue,
    getMaxValue,
    getRemaining,
    isNumeric
} from '@tonkeeper/core/dist/utils/send';
import React, { FC, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useAppContext, useWalletContext } from '../../../hooks/appContext';
import { useAppSdk } from '../../../hooks/appSdk';
import { useFormatCoinValue } from '../../../hooks/balance';
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
    Center,
    FiatBlock,
    InputBlock,
    MaxButton,
    MaxRow,
    Name,
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

export const RecipientName: FC<{ recipient: TonRecipientData }> = ({ recipient }) => {
    const { address } = recipient;

    if ('isFavorite' in address && address.isFavorite) {
        return <Name>{address.name}</Name>;
    }

    if (recipient.toAccount.name) {
        return <Name>{recipient.toAccount.name}</Name>;
    }

    if ('dns' in address && address.dns.names === null) {
        return <Name>{address.address}</Name>;
    }

    return <></>;
};

const useEstimateTransaction = (
    recipient: TonRecipientData,
    jetton: string,
    jettons: JettonsBalances
) => {
    const { t } = useTranslation();
    const sdk = useAppSdk();
    const { tonApi } = useAppContext();
    const wallet = useWalletContext();
    const client = useQueryClient();

    return useMutation(async (options: AmountValue) => {
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

export const TonAmountView: FC<{
    onClose: () => void;
    onBack: (data: AmountData | undefined) => void;
    setAmount: (data: AmountData | undefined) => void;
    recipient: TonRecipientData;
    defaultTokenAmount?: { token?: string; amount?: string; max?: boolean };
}> = ({ recipient, onClose, onBack, setAmount, defaultTokenAmount }) => {
    const { data: notFilteredJettons } = useWalletJettonList();
    const jettons = useUserJettonList(notFilteredJettons);
    const { data: info } = useWalletAccountInfo();

    const { fiat, standalone } = useAppContext();
    const format = useFormatCoinValue();

    const [fontSize, setFontSize] = useState<InputSize>(defaultSize);
    const [input, setInput] = useState<string>(defaultTokenAmount?.amount || '0');
    const [token, setToken] = useState<TonAsset>(
        defaultTokenAmount?.token ? jettonToTonAsset(defaultTokenAmount.token, jettons) : TON_ASSET
    );
    const [inFiat, setInFiat] = useState(false);
    const { data: tokenRate } = useRate(legacyTonAssetId(token, { userFriendly: true })); // TODO loading
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
        onInput(secondaryAmount!.decimalPlaces(2).toString());
    };

    const ref = useRef<HTMLInputElement>(null);
    const refBlock = useRef<HTMLLabelElement>(null);
    const refButton = useRef<HTMLDivElement>(null);

    const { mutateAsync, isLoading, reset } = useEstimateTransaction(
        recipient,
        legacyTonAssetId(token),
        jettons
    );

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

    const [remaining, valid] = useMemo(
        () =>
            getRemaining(
                jettons,
                info,
                legacyTonAssetId(token),
                coinAmount?.toString() || '0',
                max,
                format
            ),
        [jettons, info, token, input, max, format]
    );

    const isValid = useMemo(() => {
        return valid && isNumeric(input) && inputToBigNumber(input).isGreaterThan(0);
    }, [valid, input]);

    const handleBack = () => {
        if (isValid) {
            const fiatValue = inFiat ? inputToBigNumber(input) : undefined;

            onBack({
                amount: coinAmount!,
                fiat: fiatValue,
                max,
                done: false,
                jetton: legacyTonAssetId(token),
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
                jetton: legacyTonAssetId(token),
                fee
            });
        }
    };

    const onMax = () => {
        if (!refBlock.current) return;

        const value = max ? '0' : getMaxValue(jettons, info, legacyTonAssetId(token), format);
        const inputValue = inFiat
            ? new BigNumber(value).div(tokenRate!.prices).decimalPlaces(2).toString()
            : value;

        setInput(inputValue);
        setMax(state => !state);
    };

    const onJetton = (address: string) => {
        setToken(jettonToTonAsset(address, jettons));
        setMax(false);
        setInFiat(false);
    };

    const address = toShortValue(recipient.toAccount.address.bounceable);

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
                    <AssetSelect
                        info={info}
                        jetton={legacyTonAssetId(token)}
                        setJetton={onJetton}
                        jettons={jettons}
                    />
                </SelectCenter>
                <InputBlock>
                    <Sentence ref={ref} value={input} setValue={onInput} inputSize={fontSize} />
                    <Symbol>{inFiat ? fiat : token.symbol}</Symbol>
                </InputBlock>

                {secondaryAmount && (
                    <FiatBlock onClick={toggleFiat}>
                        {secondaryAmount.decimalPlaces(2).toString()} {inFiat ? token.symbol : fiat}
                    </FiatBlock>
                )}
            </AmountBlock>
            <MaxRow>
                <MaxButton maxValue={max} onClick={onMax}>
                    {t('Max')}
                </MaxButton>
                {valid ? (
                    <Remaining>{t('Remaining').replace('%1%', remaining)}</Remaining>
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
