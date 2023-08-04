import { BLOCKCHAIN_NAME } from '@tonkeeper/core/dist/entries/crypto';
import { RecipientData, isTonRecipientData } from '@tonkeeper/core/dist/entries/send';
import { toShortValue } from '@tonkeeper/core/dist/utils/common';
import {
    TonAsset,
    jettonToTonAsset,
    legacyTonAssetId
} from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { TON_ASSET, TRON_USDT_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { formatSendValue, isNumeric } from '@tonkeeper/core/dist/utils/send';
import React, { FC, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useAppContext } from '../../../hooks/appContext';
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

export type AmountViewState = {
    asset: TonAsset | TronAsset;
    amount: string | BigNumber;
    isMax: boolean;
    inFiat: boolean;
};

function formatStringToInput(value: string): string {
    value = replaceTypedDecimalSeparator(value);

    if (isNumeric(value)) {
        value = formatSendValue(value);
    }

    return value;
}

export const AmountView: FC<{
    onClose: () => void;
    onBack: (state: AmountViewState) => void;
    onConfirm: (state: AmountViewState) => void;
    recipient: RecipientData;
    defaults?: Partial<AmountViewState>;
}> = ({ recipient, onClose, onBack, onConfirm, defaults }) => {
    const blockchain = recipient.address.blockchain;
    const { data: notFilteredJettons } = useWalletJettonList();
    const jettons = useUserJettonList(notFilteredJettons);
    const { data: info } = useWalletAccountInfo();

    const { fiat, standalone } = useAppContext();
    const [fontSize, setFontSize] = useState<InputSize>(defaultSize);

    const [input, setInput] = useState<string>(
        formatStringToInput(
            defaults?.amount instanceof BigNumber
                ? defaults.amount.toFixed()
                : defaults?.amount || '0'
        )
    );
    const [token, setToken] = useState<TonAsset | TronAsset>(
        defaults?.asset || (blockchain === BLOCKCHAIN_NAME.TON ? TON_ASSET : TRON_USDT_ASSET)
    );
    const [inFiat, setInFiat] = useState(defaults?.inFiat ?? false);
    const [max, setMax] = useState(defaults?.isMax ?? false);

    const { data: tokenRate, isLoading: rateLoading } = useRate(
        token.blockchain === BLOCKCHAIN_NAME.TRON && token.address === TRON_USDT_ASSET.address
            ? 'USDT'
            : legacyTonAssetId(token as TonAsset, { userFriendly: true })
    );

    const { data: balance, isLoading: balanceLoading } = useUserAssetBalance(token);

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
        onBack({
            asset: token,
            amount: inputToBigNumber(input),
            isMax: max,
            inFiat
        });
    };

    const onSubmit: React.FormEventHandler<HTMLFormElement> = async e => {
        e.stopPropagation();
        e.preventDefault();
        if (isValid) {
            onConfirm({
                asset: token,
                amount: inputToBigNumber(input),
                isMax: max,
                inFiat
            });
        }
    };

    const onMax = () => {
        if (!refBlock.current) return;

        const value = balance.relativeAmount.toFixed();
        const inputValue = inFiat
            ? new BigNumber(value)
                  .multipliedBy(tokenRate!.prices)
                  .decimalPlaces(2, BigNumber.ROUND_FLOOR)
                  .toFixed()
            : value;

        setInput(formatStringToInput(inputValue));
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
                    loading={rateLoading || balanceLoading}
                >
                    {t('continue')}
                </Button>
            </ButtonBlock>
        </FullHeightBlock>
    );
};
