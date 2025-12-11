import { CryptoCurrency } from '@tonkeeper/core/dist/entries/crypto';
import {
    AccountEvent,
    ActionStatusEnum,
    CurrencyType,
    ExtraCurrencyTransferAction,
    PurchaseAction,
    TonTransferAction,
    TrustType
} from '@tonkeeper/core/dist/tonApiV2';
import { formatDecimals } from '@tonkeeper/core/dist/utils/balance';
import React, { FC } from 'react';
import { useFormatCoinValue } from '../../../hooks/balance';
import { useTranslation } from '../../../hooks/translation';
import { useFormatFiat, useRate } from '../../../state/rates';
import { ListBlock } from '../../List';
import {
    ActivityDetailsHeader,
    Amount,
    FailedDetail,
    Spam,
    TransferComment,
    TransferOpCode
} from '../ActivityDetailsLayout';
import {
    ActionBeneficiaryDetails,
    ActionDate,
    ActionDetailsBlock,
    ActionExtraDetails,
    ActionRecipientDetails,
    ActionSenderDetails,
    ActionTransactionDetails,
    ErrorActivityNotification,
    Title
} from '../NotificationCommon';
import { ActionData } from './ActivityNotification';
import { useActiveWallet } from '../../../state/wallet';
import { sanitizeJetton } from '../../../libs/common';
import { Address } from '@ton/core';
import { TON_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { tonAssetAddressToString } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';

const TonTransferActionContent: FC<{
    tonTransfer: TonTransferAction;
    timestamp: number;
    event: AccountEvent;
    isScam: boolean;
    status?: ActionStatusEnum;
}> = ({ tonTransfer, timestamp, event, isScam, status }) => {
    const wallet = useActiveWallet();
    const { data } = useRate(CryptoCurrency.TON);
    const { fiatAmount } = useFormatFiat(data, formatDecimals(tonTransfer.amount));

    const kind = tonTransfer.recipient.address === wallet.rawAddress ? 'received' : 'send';

    return (
        <ActionDetailsBlock event={event}>
            <ActivityDetailsHeader
                isScam={isScam}
                amount={tonTransfer.amount}
                symbol={CryptoCurrency.TON}
                total={fiatAmount}
                timestamp={timestamp}
                kind={kind}
                status={status}
            />
            <ListBlock margin={false} fullWidth>
                {kind === 'received' && <ActionSenderDetails sender={tonTransfer.sender} />}
                {kind === 'send' && <ActionRecipientDetails recipient={tonTransfer.recipient} />}
                <ActionTransactionDetails eventId={event.eventId} />
                <ActionExtraDetails extra={event.extra} />
                <TransferComment comment={isScam ? undefined : tonTransfer.comment} />
            </ListBlock>
        </ActionDetailsBlock>
    );
};

export const TonTransferActionNotification: FC<ActionData> = ({
    action,
    timestamp,
    event,
    isScam
}) => {
    const { tonTransfer } = action;
    if (!tonTransfer) {
        return <ErrorActivityNotification event={event} />;
    }
    return (
        <TonTransferActionContent
            tonTransfer={tonTransfer}
            event={event}
            isScam={isScam}
            timestamp={timestamp}
            status={action.status}
        />
    );
};

export const AuctionBidActionDetails: FC<ActionData> = ({ action, timestamp, event }) => {
    const { t } = useTranslation();
    const { auctionBid } = action;

    const format = useFormatCoinValue();
    const { data } = useRate(CryptoCurrency.TON);
    const { fiatAmount } = useFormatFiat(data, formatDecimals(auctionBid?.amount.value ?? 0));

    if (!auctionBid) {
        return <ErrorActivityNotification event={event} />;
    }

    return (
        <ActionDetailsBlock event={event}>
            <div>
                <Title>{t('transaction_type_bid')}</Title>
                <Amount>
                    {format(auctionBid.amount.value)} {auctionBid.amount.tokenName}
                </Amount>
                {fiatAmount && <Amount>≈&thinsp;{fiatAmount}</Amount>}
                <ActionDate kind="send" timestamp={timestamp} />
                <FailedDetail status={action.status} />
            </div>
            <ListBlock margin={false} fullWidth>
                <ActionBeneficiaryDetails beneficiary={auctionBid.auction} />
                <ActionTransactionDetails eventId={event.eventId} />
                <ActionExtraDetails extra={event.extra} />
            </ListBlock>
        </ActionDetailsBlock>
    );
};

export const DomainRenewActionDetails: FC<ActionData> = ({ action, timestamp, event }) => {
    const { domainRenew } = action;

    if (!domainRenew) {
        return <ErrorActivityNotification event={event} />;
    }

    return (
        <ActionDetailsBlock event={event}>
            <div>
                <Title>{domainRenew.domain}</Title>
                <ActionDate kind="send" timestamp={timestamp} />
                <FailedDetail status={action.status} />
            </div>
            <ListBlock margin={false} fullWidth>
                <ActionSenderDetails sender={domainRenew.renewer} bounced />
                <ActionTransactionDetails eventId={event.eventId} />
                <ActionExtraDetails extra={event.extra} />
            </ListBlock>
        </ActionDetailsBlock>
    );
};

export const SmartContractExecActionDetails: FC<ActionData> = ({ action, timestamp, event }) => {
    const { smartContractExec } = action;
    const format = useFormatCoinValue();
    const { data } = useRate(CryptoCurrency.TON);
    const { fiatAmount } = useFormatFiat(data, formatDecimals(smartContractExec?.tonAttached ?? 0));

    if (!smartContractExec) {
        return <ErrorActivityNotification event={event} />;
    }

    return (
        <ActionDetailsBlock event={event}>
            <div>
                <Title>
                    -&thinsp;{format(smartContractExec.tonAttached)} {CryptoCurrency.TON}
                </Title>
                {fiatAmount && <Amount>≈&thinsp;{fiatAmount}</Amount>}
                <ActionDate kind="call" timestamp={timestamp} />
                <FailedDetail status={action.status} />
            </div>
            <ListBlock margin={false} fullWidth>
                <ActionRecipientDetails recipient={smartContractExec.contract} bounced />
                <ActionTransactionDetails eventId={event.eventId} />
                <ActionExtraDetails extra={event.extra} />
                <TransferOpCode operation={smartContractExec.operation} />
            </ListBlock>
        </ActionDetailsBlock>
    );
};

const ExtraCurrencyTransferActionContent: FC<{
    extraCurrencyTransfer: ExtraCurrencyTransferAction;
    timestamp: number;
    event: AccountEvent;
    isScam: boolean;
    status?: ActionStatusEnum;
}> = ({ extraCurrencyTransfer, timestamp, event, isScam, status }) => {
    const wallet = useActiveWallet();
    const { data } = useRate(extraCurrencyTransfer.currency.symbol);
    const { fiatAmount } = useFormatFiat(
        data,
        formatDecimals(extraCurrencyTransfer.amount, extraCurrencyTransfer.currency.decimals)
    );

    const kind =
        extraCurrencyTransfer.recipient.address === wallet.rawAddress ? 'received' : 'send';

    return (
        <ActionDetailsBlock event={event}>
            <ActivityDetailsHeader
                isScam={isScam}
                amount={extraCurrencyTransfer.amount}
                decimals={extraCurrencyTransfer.currency.decimals}
                symbol={extraCurrencyTransfer.currency.symbol}
                total={fiatAmount}
                timestamp={timestamp}
                kind={kind}
                status={status}
            />
            <ListBlock margin={false} fullWidth>
                {kind === 'received' && (
                    <ActionSenderDetails sender={extraCurrencyTransfer.sender} />
                )}
                {kind === 'send' && (
                    <ActionRecipientDetails recipient={extraCurrencyTransfer.recipient} />
                )}
                <ActionTransactionDetails eventId={event.eventId} />
                <ActionExtraDetails extra={event.extra} />
                <TransferComment comment={isScam ? undefined : extraCurrencyTransfer.comment} />
            </ListBlock>
        </ActionDetailsBlock>
    );
};

export const ExtraCurrencyTransferNotification: FC<ActionData> = ({
    action,
    timestamp,
    event,
    isScam
}) => {
    const { extraCurrencyTransfer } = action;
    if (!extraCurrencyTransfer) {
        return <ErrorActivityNotification event={event} />;
    }
    return (
        <ExtraCurrencyTransferActionContent
            extraCurrencyTransfer={extraCurrencyTransfer}
            event={event}
            isScam={isScam}
            timestamp={timestamp}
            status={action.status}
        />
    );
};

export const SimplePreviewActionNotification: FC<ActionData> = ({
    action,
    timestamp,
    event,
    isScam
}) => {
    const { t } = useTranslation();

    const { simplePreview } = action;

    if (!simplePreview) {
        return <ErrorActivityNotification event={event} />;
    }

    const recipient = simplePreview.accounts[0];

    return (
        <ActionDetailsBlock event={event}>
            <div>
                {isScam && <Spam>{t('spam_action')}</Spam>}
                <Title>{simplePreview.name}</Title>
                {simplePreview.value && !isScam && <Amount>{simplePreview.value}</Amount>}
                <ActionDate kind="call" timestamp={timestamp} />
                <FailedDetail status={action.status} />
            </div>
            <ListBlock margin={false} fullWidth>
                {recipient && (
                    <ActionRecipientDetails
                        recipient={recipient}
                        customLabel={t('simple_preview_account')}
                    />
                )}
                <ActionTransactionDetails eventId={event.eventId} />
                <ActionExtraDetails extra={event.extra} />
                <TransferComment comment={isScam ? undefined : simplePreview.description} />
            </ListBlock>
        </ActionDetailsBlock>
    );
};

const PurchaseActionContent: FC<{
    purchase: PurchaseAction;
    timestamp: number;
    event: AccountEvent;
    isScam: boolean;
    currencyId: string;
    status?: ActionStatusEnum;
}> = ({ purchase, timestamp, event, isScam, status, currencyId }) => {
    const { t } = useTranslation();
    const { data } = useRate(currencyId);
    const { fiatAmount } = useFormatFiat(
        data,
        formatDecimals(purchase.amount.value, purchase.amount.decimals)
    );

    return (
        <ActionDetailsBlock event={event}>
            <ActivityDetailsHeader
                isScam={isScam}
                amount={purchase.amount.value}
                decimals={purchase.amount.decimals}
                symbol={sanitizeJetton(
                    purchase.amount.tokenName,
                    purchase.amount.verification === TrustType.Blacklist
                )}
                total={fiatAmount}
                timestamp={timestamp}
                kind="send"
                status={status}
            >
                {t('transaction_type_purchase')}
            </ActivityDetailsHeader>
            <ListBlock margin={false} fullWidth>
                {<ActionRecipientDetails recipient={purchase.destination} />}
                <ActionTransactionDetails eventId={event.eventId} />
                <ActionExtraDetails extra={event.extra} />
                <TransferComment
                    comment={t('transaction_type_purchase_description', {
                        invoice: purchase.invoiceId
                    })}
                />
            </ListBlock>
        </ActionDetailsBlock>
    );
};

export const PurchaseActionNotification: FC<ActionData> = ({
    action,
    timestamp,
    event,
    isScam
}) => {
    const { purchase } = action;

    if (!purchase) {
        return <ErrorActivityNotification event={event} />;
    }

    let currencyId;
    if (purchase.amount.currencyType === CurrencyType.Jetton) {
        try {
            currencyId = Address.parse(purchase.amount.jetton!).toRawString();
        } catch (e) {
            console.error(e);
        }
    } else if (purchase.amount.currencyType === CurrencyType.Native) {
        currencyId = tonAssetAddressToString(TON_ASSET.address);
    }

    if (!currencyId) {
        return <ErrorActivityNotification event={event} />;
    }

    return (
        <PurchaseActionContent
            purchase={purchase}
            event={event}
            isScam={isScam}
            timestamp={timestamp}
            status={action.status}
            currencyId={currencyId}
        />
    );
};
