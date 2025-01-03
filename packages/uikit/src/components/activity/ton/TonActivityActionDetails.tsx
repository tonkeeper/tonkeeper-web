import { CryptoCurrency } from '@tonkeeper/core/dist/entries/crypto';
import { AccountEvent, ActionStatusEnum, TonTransferAction } from '@tonkeeper/core/dist/tonApiV2';
import { formatDecimals } from '@tonkeeper/core/dist/utils/balance';
import { FC } from 'react';
import { useFormatCoinValue } from '../../../hooks/balance';
import { useTranslation } from '../../../hooks/translation';
import { useFormatFiat, useRate } from '../../../state/rates';
import { ListBlock } from '../../List';
import {
    ActivityDetailsHeader,
    Amount,
    FailedDetail,
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
