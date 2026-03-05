import { useMutation, useQueryClient } from '@tanstack/react-query';
import { TonConnectTransactionPayload } from '@tonkeeper/core/dist/entries/tonConnect';
import { TON_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import {
    isTon,
    TonAsset,
    TonAssetAddress,
    tonAssetAddressToString
} from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { zeroFeeEstimation } from '@tonkeeper/core/dist/service/ton-blockchain/utils';
import { BLOCKCHAIN_NAME } from '@tonkeeper/core/dist/entries/crypto';
import { TransactionFeeTonAsset } from '@tonkeeper/core/dist/entries/crypto/transaction-fee';
import type { SwapConfirmation } from '@tonkeeper/core/dist/swapsApi';
import { shiftedDecimals } from '@tonkeeper/core/dist/utils/balance';
import BigNumber from 'bignumber.js';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled, { useTheme } from 'styled-components';
import { useAppSdk } from '../../hooks/appSdk';
import { useAppContext } from '../../hooks/appContext';
import { useTranslation } from '../../hooks/translation';
import { formatFiatCurrency } from '../../hooks/balance';
import { anyOfKeysParts } from '../../libs/queryKey';
import {
    BATTERY_SENDER_CHOICE,
    EXTERNAL_SENDER_CHOICE,
    SenderChoice,
    TonSenderTypeUserAvailable,
    useGetSender,
    useTonConnectAvailableSendersChoices
} from '../../hooks/blockchain/useSender';
import { useTonConnectTransactionService } from '../../hooks/blockchain/useBlockchainService';
import { useActiveAccount } from '../../state/wallet';
import { useRate } from '../../state/rates';
import {
    Notification,
    NotificationBlock,
    NotificationFooter,
    NotificationFooterPortal
} from '../Notification';
import { ListBlock, ListItem, ListItemElement, ListItemPayload } from '../List';
import { ColumnText } from '../Layout';
import { Body2, Label2 } from '../Text';
import { Button } from '../fields/Button';
import { CheckmarkCircleIcon, ExclamationMarkCircleIcon } from '../Icon';
import { ResultButton } from '../transfer/common';
import { ActionFeeDetailsUniversal } from '../activity/NotificationCommon';
import { WalletEmoji } from '../shared/emoji/WalletEmoji';
import { ConfirmOperationHeading } from '../confirm-modal/ConfirmOperationHeading';
import { getErrorText } from '@tonkeeper/core/dist/errors/TranslatableError';

const EXPIRE_BUFFER_SECONDS = 3;

const Label = styled(Body2)`
    user-select: none;
    color: ${p => p.theme.textSecondary};
    align-self: flex-start;
`;

const WalletInfo = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
`;

const ExclamationMarkCircleIconStyled = styled(ExclamationMarkCircleIcon)`
    min-width: 32px;
    min-height: 32px;
`;

const ResultButtonErrored = styled(ResultButton)`
    height: fit-content;
`;

const SmallNotification = styled(Notification)`
    ${p => p.theme.displayType === 'full-width' && 'max-width: 400px;'}
`;

const FooterGap = styled.div`
    padding-top: 16px;
`;

const CompactListBlock = styled(ListBlock)`
    ${ListItemElement} {
        padding-left: 12px;

        &:not(:first-child) > div {
            padding-top: 7px;
        }
    }

    ${ListItemPayload} {
        padding: 8px 12px 8px 0;
    }
`;

// --- Helpers ---

function calcSecondsLeft(deadline: string | undefined): number | null {
    if (!deadline) return null;
    return Math.max(0, Math.floor(Number(deadline) - Date.now() / 1000));
}

function formatCountdown(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

function useCountdown(deadline: string | undefined) {
    const [secondsLeft, setSecondsLeft] = useState(() => calcSecondsLeft(deadline));
    const deadlineRef = useRef(deadline);

    useEffect(() => {
        deadlineRef.current = deadline;
        setSecondsLeft(calcSecondsLeft(deadline));
    }, [deadline]);

    useEffect(() => {
        if (deadline == null) return;

        const interval = setInterval(() => {
            const left = calcSecondsLeft(deadlineRef.current);
            setSecondsLeft(left);
            if (left !== null && left <= 0) {
                clearInterval(interval);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [deadline]);

    return {
        secondsLeft,
        isExpired: secondsLeft !== null && secondsLeft <= 0,
        isAlmostExpired: secondsLeft !== null && secondsLeft <= EXPIRE_BUFFER_SECONDS
    };
}

function useAssetFiat(assetAddress: TonAssetAddress, amount: BigNumber): string | undefined {
    const rateToken = isTon(assetAddress) ? 'TON' : tonAssetAddressToString(assetAddress);
    const { data: rate } = useRate(rateToken);
    const { fiat } = useAppContext();

    return useMemo(() => {
        if (!rate) return undefined;
        const fiatAmount = amount.multipliedBy(rate.prices);
        return formatFiatCurrency(fiat, fiatAmount);
    }, [rate, amount, fiat]);
}

// --- Types ---

export type SwapConfirmData = {
    confirmation: SwapConfirmation;
    payload: TonConnectTransactionPayload;
};

// --- Main Component ---

export const SwapConfirmationNotification: FC<{
    confirmData: SwapConfirmData | null;
    fromAsset: TonAsset;
    toAsset: TonAsset;
    handleClose: (result?: { boc: string }) => void;
}> = ({ confirmData, fromAsset, toAsset, handleClose }) => {
    return (
        <SmallNotification
            isOpen={confirmData != null}
            handleClose={() => handleClose()}
            onTopOfBrowser
        >
            {() =>
                confirmData && (
                    <SwapConfirmContent
                        confirmData={confirmData}
                        fromAsset={fromAsset}
                        toAsset={toAsset}
                        handleClose={handleClose}
                    />
                )
            }
        </SmallNotification>
    );
};

// --- Content ---

const SwapConfirmContent: FC<{
    confirmData: SwapConfirmData;
    fromAsset: TonAsset;
    toAsset: TonAsset;
    handleClose: (result?: { boc: string }) => void;
}> = ({ confirmData, fromAsset, toAsset, handleClose }) => {
    const { confirmation, payload } = confirmData;
    const { t } = useTranslation();
    const sdk = useAppSdk();
    const theme = useTheme();
    const account = useActiveAccount();
    const client = useQueryClient();
    const getSender = useGetSender();
    const tonConnectService = useTonConnectTransactionService();

    // --- Sender selection ---
    const { data: availableSendersChoices } = useTonConnectAvailableSendersChoices(payload);
    const [selectedSenderType, setSelectedSenderType] = useState<TonSenderTypeUserAvailable>(
        EXTERNAL_SENDER_CHOICE.type
    );

    useEffect(() => {
        if (
            availableSendersChoices?.[0] &&
            availableSendersChoices[0].type !== selectedSenderType
        ) {
            setSelectedSenderType(availableSendersChoices[0].type);
        }
    }, [JSON.stringify(availableSendersChoices)]);

    const senderChoice: SenderChoice = useMemo(() => {
        if (selectedSenderType === BATTERY_SENDER_CHOICE.type) return BATTERY_SENDER_CHOICE;
        return EXTERNAL_SENDER_CHOICE;
    }, [selectedSenderType]);

    // --- Countdown ---
    const { secondsLeft, isExpired, isAlmostExpired } = useCountdown(
        confirmation.tradeStartDeadline
    );

    // --- Amounts ---
    const bidFormatted = useMemo(
        () => shiftedDecimals(new BigNumber(confirmation.bidUnits), fromAsset.decimals),
        [confirmation.bidUnits, fromAsset.decimals]
    );
    const askFormatted = useMemo(
        () => shiftedDecimals(new BigNumber(confirmation.askUnits), toAsset.decimals),
        [confirmation.askUnits, toAsset.decimals]
    );

    const bidFiat = useAssetFiat(fromAsset.address, bidFormatted);
    const askFiat = useAssetFiat(toAsset.address, askFormatted);

    // --- Fee ---
    const fee: TransactionFeeTonAsset = useMemo(
        () => ({
            type: 'ton-asset',
            extra: new AssetAmount({ asset: TON_ASSET, weiAmount: confirmation.gasBudget })
        }),
        [confirmation.gasBudget]
    );

    // --- Slippage ---
    const slippagePercent = useMemo(
        () => new BigNumber(confirmation.slippage).div(100).decimalPlaces(2).toString(),
        [confirmation.slippage]
    );

    // --- Send mutation ---
    const {
        mutateAsync,
        isLoading: isSending,
        error: sendError,
        data: sendResult
    } = useMutation<string, Error>(async () => {
        if (account.type === 'watch-only') {
            throw new Error("Can't use this account");
        }

        const sender = await getSender(senderChoice);
        const boc = await tonConnectService.send(sender, zeroFeeEstimation, payload);

        await client.invalidateQueries(anyOfKeysParts(account.id, account.activeTonWallet.id));
        return boc;
    });

    const onSubmit = useCallback(async () => {
        if (isAlmostExpired || isSending) return;
        try {
            const boc = await mutateAsync();
            sdk.hapticNotification('success');
            setTimeout(() => handleClose({ boc }), 300);
        } catch (e) {
            sdk.hapticNotification('error');
            console.error(e);
        }
    }, [isAlmostExpired, isSending, mutateAsync, sdk, handleClose]);

    useEffect(() => {
        if (sdk.twaExpand) {
            sdk.twaExpand();
        }
    }, []);

    const done = sendResult !== undefined;

    // --- Wallet info ---
    let walletName = account.name;
    let walletEmoji = account.emoji;
    if (account.type === 'mam') {
        const derivation = account.getTonWalletsDerivation(account.activeTonWallet.id);
        if (derivation) {
            walletName = derivation.name;
            walletEmoji = derivation.emoji;
        }
    }

    return (
        <NotificationBlock>
            <ConfirmOperationHeading
                icons={[{ src: fromAsset.image || '' }, { src: toAsset.image || '' }]}
                actionLabel={t('swap_title')}
                mainAmount={
                    <>
                        ≈&thinsp;
                        {askFormatted.decimalPlaces(toAsset.decimals).toFormat()} {toAsset.symbol}
                    </>
                }
                mainAmountColor={theme.accentGreen}
                subtitle={
                    <>
                        −{bidFormatted.decimalPlaces(fromAsset.decimals).toFormat()}{' '}
                        {fromAsset.symbol}
                    </>
                }
            />
            <CompactListBlock margin={false} fullWidth>
                {/* Wallet */}
                <ListItem hover={false}>
                    <ListItemPayload>
                        <Label>{t('wallet')}</Label>
                        <WalletInfo>
                            <WalletEmoji
                                emojiSize="16px"
                                containerSize="16px"
                                emoji={walletEmoji}
                            />
                            <Label2>{walletName}</Label2>
                        </WalletInfo>
                    </ListItemPayload>
                </ListItem>

                {/* Provider */}
                <ListItem hover={false}>
                    <ListItemPayload>
                        <Label>{t('swap_provider')}</Label>
                        <Label2>{confirmation.resolverName}</Label2>
                    </ListItemPayload>
                </ListItem>

                {/* Send */}
                <ListItem hover={false}>
                    <ListItemPayload>
                        <Label>{t('swap_send')}</Label>
                        {bidFiat ? (
                            <ColumnText
                                right
                                text={
                                    <>
                                        {bidFormatted.decimalPlaces(fromAsset.decimals).toFormat()}{' '}
                                        {fromAsset.symbol}
                                    </>
                                }
                                secondary={<>≈&thinsp;{bidFiat}</>}
                            />
                        ) : (
                            <Label2>
                                {bidFormatted.decimalPlaces(fromAsset.decimals).toFormat()}{' '}
                                {fromAsset.symbol}
                            </Label2>
                        )}
                    </ListItemPayload>
                </ListItem>

                {/* Receive */}
                <ListItem hover={false}>
                    <ListItemPayload>
                        <Label>{t('swap_receive')}</Label>
                        {askFiat ? (
                            <ColumnText
                                right
                                text={
                                    <>
                                        ≈&thinsp;
                                        {askFormatted
                                            .decimalPlaces(toAsset.decimals)
                                            .toFormat()}{' '}
                                        {toAsset.symbol}
                                    </>
                                }
                                secondary={<>≈&thinsp;{askFiat}</>}
                            />
                        ) : (
                            <Label2>
                                ≈&thinsp;
                                {askFormatted.decimalPlaces(toAsset.decimals).toFormat()}{' '}
                                {toAsset.symbol}
                            </Label2>
                        )}
                    </ListItemPayload>
                </ListItem>

                {/* Slippage */}
                <ListItem hover={false}>
                    <ListItemPayload>
                        <Label>{t('swap_slippage')}</Label>
                        <Label2>≈&thinsp;{slippagePercent}%</Label2>
                    </ListItemPayload>
                </ListItem>

                {/* Exchange in (countdown) */}
                <ListItem hover={false}>
                    <ListItemPayload>
                        <Label>{t('swap_exchange_in')}</Label>
                        <Label2>
                            {secondsLeft === null
                                ? '—'
                                : isExpired
                                ? '—'
                                : formatCountdown(secondsLeft)}
                        </Label2>
                    </ListItemPayload>
                </ListItem>

                {/* Fee with Change Payment Method */}
                <ActionFeeDetailsUniversal
                    blockchain={BLOCKCHAIN_NAME.TON}
                    fee={fee}
                    compact
                    availableSendersOptions={availableSendersChoices}
                    selectedSenderType={selectedSenderType}
                    onSenderTypeChange={
                        setSelectedSenderType as (type: TonSenderTypeUserAvailable) => void
                    }
                />
            </CompactListBlock>

            <NotificationFooterPortal>
                <NotificationFooter>
                    <FooterGap />
                    {sendError ? (
                        <ResultButtonErrored>
                            <ExclamationMarkCircleIconStyled />
                            <Label2>{getErrorText(sendError, { t })}</Label2>
                        </ResultButtonErrored>
                    ) : done ? (
                        <ResultButton done>
                            <CheckmarkCircleIcon />
                            <Label2>{t('ton_login_success')}</Label2>
                        </ResultButton>
                    ) : isExpired ? (
                        <Button size="small" fullWidth type="button" onClick={() => handleClose()}>
                            {t('swap_expired_refresh')}
                        </Button>
                    ) : (
                        <Button
                            size="small"
                            fullWidth
                            type="button"
                            primary
                            loading={isSending}
                            disabled={isSending || isAlmostExpired}
                            onClick={onSubmit}
                        >
                            {t('confirm')}
                        </Button>
                    )}
                </NotificationFooter>
            </NotificationFooterPortal>
        </NotificationBlock>
    );
};
