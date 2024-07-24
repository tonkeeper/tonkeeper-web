import { CryptoCurrency } from '@tonkeeper/core/dist/entries/crypto';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { intlLocale } from '@tonkeeper/core/dist/entries/language';
import { Network } from '@tonkeeper/core/dist/entries/network';
import { TransferEstimationEvent } from '@tonkeeper/core/dist/entries/send';
import {
    AccountAddress,
    AccountEvent,
    JettonSwapActionDexEnum
} from '@tonkeeper/core/dist/tonApiV2';
import { TronEvent, TronFee } from '@tonkeeper/core/dist/tronApi';
import { formatDecimals } from '@tonkeeper/core/dist/utils/balance';
import { formatAddress, toShortValue } from '@tonkeeper/core/dist/utils/common';
import { FC, PropsWithChildren, useMemo } from 'react';
import styled from 'styled-components';
import { useAppContext } from '../../hooks/appContext';
import { useAppSdk } from '../../hooks/appSdk';
import { formatFiatCurrency, useCoinFullBalance } from '../../hooks/balance';
import { useTranslation } from '../../hooks/translation';
import { useAssetAmountFiatEquivalent } from '../../state/asset';
import { useFormatFiat, useRate } from '../../state/rates';
import { SpinnerIcon } from '../Icon';
import { ColumnText } from '../Layout';
import { ListItem, ListItemPayload } from '../List';
import { Body1, H2, Label1 } from '../Text';
import { Button } from '../fields/Button';
import { hexToRGBA } from '../../libs/css';
import { useActiveTonNetwork } from '../../state/wallet';

export const Title = styled(H2)<{ secondary?: boolean; tertiary?: boolean }>`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    user-select: none;
    color: ${props =>
        props.secondary
            ? props.theme.textSecondary
            : props.tertiary
            ? props.theme.textTertiary
            : props.theme.textPrimary};
`;

export const SpamBadge = styled.div`
    padding: 4px 8px;
    color: ${p => p.theme.accentOrange};
    border-radius: ${p => p.theme.corner3xSmall};
    background-color: ${p => hexToRGBA(p.theme.accentOrange, 0.16)};
    text-transform: uppercase;

    font-style: normal;
    font-size: 8.5px;
    font-weight: 510;
    line-height: 12px;
    height: fit-content;
`;

const Timestamp = styled(Body1)`
    user-select: none;
    color: ${props => props.theme.textSecondary};
`;

export const Label = styled(Body1)`
    user-select: none;
    color: ${props => props.theme.textSecondary};
`;

export const ActionDate: FC<{
    kind: 'received' | 'send' | 'call';
    timestamp: number;
}> = ({ kind, timestamp }) => {
    const { t, i18n } = useTranslation();

    const date = useMemo(() => {
        return new Intl.DateTimeFormat(intlLocale(i18n.language), {
            month: 'short',
            day: 'numeric',
            year:
                new Date().getFullYear() - 1 === new Date(timestamp).getFullYear()
                    ? 'numeric'
                    : undefined,
            hour: 'numeric',
            minute: 'numeric'
        }).format(timestamp);
    }, [timestamp, i18n.language]);

    return (
        <Timestamp>
            {(() => {
                switch (kind) {
                    case 'received':
                        return t('transaction_receive_date');
                    case 'call':
                        return t('transaction_call_date');
                    case 'send':
                        return t('transaction_sent_date');
                    default:
                        return t('transaction_sent_date');
                }
            })().replace('%{date}', date)}
        </Timestamp>
    );
};

export const toDexName = (dex: JettonSwapActionDexEnum) => {
    switch (dex) {
        case 'dedust':
            return 'DeDust.io';
        case 'stonfi':
            return 'STON.fi';
        default:
            return dex;
    }
};

export const TronErrorActivityNotification: FC<PropsWithChildren<{ event: TronEvent }>> = ({
    children,
    event
}) => {
    const { t } = useTranslation();
    return (
        <TronActionDetailsBlock event={event}>
            <Title>{children ?? t('txActions_signRaw_types_unknownTransaction')}</Title>
        </TronActionDetailsBlock>
    );
};

export const ErrorActivityNotification: FC<PropsWithChildren<{ event: AccountEvent }>> = ({
    children,
    event
}) => {
    const { t } = useTranslation();
    return (
        <ActionDetailsBlock event={event}>
            <Title>{children ?? t('txActions_signRaw_types_unknownTransaction')}</Title>
        </ActionDetailsBlock>
    );
};

export const ActionRecipientAddress: FC<{ address: string; name?: string; label?: string }> = ({
    address,
    name,
    label
}) => {
    const { t } = useTranslation();
    const sdk = useAppSdk();

    return (
        <ListItem onClick={() => sdk.copyToClipboard(address, t('address_copied'))}>
            <ListItemPayload>
                <Label>
                    {label ??
                        (name ? t('transaction_recipient_address') : t('transaction_recipient'))}
                </Label>
                <Label1>{toShortValue(address)}</Label1>
            </ListItemPayload>
        </ListItem>
    );
};

export const ActionRecipientDetails: FC<{ recipient: AccountAddress; bounced?: boolean }> = ({
    recipient,
    bounced
}) => {
    const { t } = useTranslation();
    const sdk = useAppSdk();
    const network = useActiveTonNetwork();

    return (
        <>
            {recipient.name && (
                <ListItem onClick={() => sdk.copyToClipboard(recipient.name!)}>
                    <ListItemPayload>
                        <Label>{t('transaction_recipient')}</Label>
                        <Label1>{recipient.name}</Label1>
                    </ListItemPayload>
                </ListItem>
            )}
            <ActionRecipientAddress
                address={formatAddress(recipient.address, network, bounced)}
                name={recipient.name}
            />
        </>
    );
};

export const ActionPoolDetails: FC<{ pool: AccountAddress }> = ({ pool }) => {
    const { t } = useTranslation();
    const network = useActiveTonNetwork();
    return (
        <>
            <ListItem>
                <ListItemPayload>
                    <Label>{t('transaction_bid_dns')}</Label>
                    <Label1>{pool.name}</Label1>
                </ListItemPayload>
            </ListItem>
            <ActionRecipientAddress
                address={formatAddress(pool.address, network, true)}
                label={t('staking_details_pool_address_label')}
            />
        </>
    );
};

export const ActionSenderAddress: FC<{ address: string; name?: string }> = ({ address, name }) => {
    const { t } = useTranslation();
    const sdk = useAppSdk();

    return (
        <ListItem onClick={() => sdk.copyToClipboard(address, t('address_copied'))}>
            <ListItemPayload>
                <Label>{name ? t('transaction_sender_address') : t('transaction_sender')}</Label>
                <Label1>{toShortValue(address)}</Label1>
            </ListItemPayload>
        </ListItem>
    );
};

export const ActionSenderDetails: FC<{ sender: AccountAddress; bounced?: boolean }> = ({
    sender,
    bounced
}) => {
    const { t } = useTranslation();
    const sdk = useAppSdk();
    const network = useActiveTonNetwork();

    return (
        <>
            {sender.name && (
                <ListItem onClick={() => sdk.copyToClipboard(sender.name!)}>
                    <ListItemPayload>
                        <Label>{t('transaction_sender')}</Label>
                        <Label1>{sender.name}</Label1>
                    </ListItemPayload>
                </ListItem>
            )}
            <ActionSenderAddress
                address={formatAddress(sender.address, network, bounced)}
                name={sender.name}
            />
        </>
    );
};

export const ActionBeneficiaryDetails: FC<{ beneficiary: AccountAddress }> = ({ beneficiary }) => {
    const { t } = useTranslation();
    const sdk = useAppSdk();
    const network = useActiveTonNetwork();

    const address = formatAddress(beneficiary.address, network, true);
    return (
        <>
            {beneficiary.name && (
                <ListItem onClick={() => sdk.copyToClipboard(beneficiary.name!)}>
                    <ListItemPayload>
                        <Label>{t('transaction_merchant')}</Label>
                        <Label1>{beneficiary.name}</Label1>
                    </ListItemPayload>
                </ListItem>
            )}
            <ListItem onClick={() => sdk.copyToClipboard(address, t('address_copied'))}>
                <ListItemPayload>
                    <Label>
                        {beneficiary.name
                            ? t('add_edit_favorite_address_label')
                            : t('transaction_merchant')}
                    </Label>
                    <Label1>{toShortValue(address)}</Label1>
                </ListItemPayload>
            </ListItem>
        </>
    );
};

export const ActionTransactionDetails: FC<{ eventId: string }> = ({ eventId }) => {
    const { t } = useTranslation();
    const sdk = useAppSdk();
    return (
        <ListItem onClick={() => sdk.copyToClipboard(eventId, t('copied'))}>
            <ListItemPayload>
                <Label>{t('transaction_hash')}</Label>
                <Label1>{toShortValue(eventId, 8)}</Label1>
            </ListItemPayload>
        </ListItem>
    );
};

export const ActionDeployerAddress: FC<{ address?: string }> = ({ address }) => {
    const { t } = useTranslation();
    const sdk = useAppSdk();

    if (!address) return <></>;

    return (
        <ListItem onClick={() => sdk.copyToClipboard(address, t('address_copied'))}>
            <ListItemPayload>
                <Label>{t('add_edit_favorite_address_label')}</Label>
                <Label1>{toShortValue(address)}</Label1>
            </ListItemPayload>
        </ListItem>
    );
};

export const ActionDeployerDetails: FC<{ deployer: string }> = ({ deployer }) => {
    const network = useActiveTonNetwork();
    return <ActionDeployerAddress address={formatAddress(deployer, network)} />;
};

export const ActionFeeDetails: FC<{
    fee: TransferEstimationEvent;
}> = ({ fee }) => {
    const { t } = useTranslation();

    const feeAmount = fee.event.extra < 0 ? fee.event.extra * -1 : fee.event.extra;
    const amount = useCoinFullBalance(feeAmount);
    const { data } = useRate(CryptoCurrency.TON);
    const { fiatAmount } = useFormatFiat(data, formatDecimals(feeAmount));

    return (
        <ListItem hover={false}>
            <ListItemPayload>
                <Label>{fee.event.extra > 0 ? t('txActions_refund') : t('transaction_fee')}</Label>
                <ColumnText
                    right
                    text={`${amount} ${CryptoCurrency.TON}`}
                    secondary={fiatAmount ? `≈ ${fiatAmount}` : undefined}
                />
            </ListItemPayload>
        </ListItem>
    );
};

export const ActionExtraDetails: FC<{
    extra: number;
}> = ({ extra }) => {
    const { t } = useTranslation();

    const feeAmount = extra < 0 ? extra * -1 : extra;
    const amount = useCoinFullBalance(feeAmount);

    const { data } = useRate(CryptoCurrency.TON);
    const { fiatAmount } = useFormatFiat(data, formatDecimals(feeAmount));

    return (
        <ListItem hover={false}>
            <ListItemPayload>
                <Label>{extra > 0 ? t('txActions_refund') : t('transaction_fee')}</Label>
                <ColumnText
                    right
                    text={`${amount} ${CryptoCurrency.TON}`}
                    secondary={fiatAmount ? `≈ ${fiatAmount}` : undefined}
                />
            </ListItemPayload>
        </ListItem>
    );
};

export const ActionTronFeeDetails: FC<{
    fees: TronFee;
}> = ({ fees }) => {
    const { t } = useTranslation();

    const amount = useMemo(() => formatDecimals(fees.amount, fees.token.decimals), [fees]);
    const { data } = useRate(fees.token.symbol);
    const { fiatAmount } = useFormatFiat(data, amount);

    return (
        <ListItem hover={false}>
            <ListItemPayload>
                <Label>{t('transaction_fee')}</Label>
                <ColumnText
                    right
                    text={`${amount} ${fees.token.symbol}`}
                    secondary={fiatAmount ? `≈ ${fiatAmount}` : undefined}
                />
            </ListItemPayload>
        </ListItem>
    );
};

export const ActionFeeDetailsUniversal: FC<{
    fee: AssetAmount | undefined;
}> = ({ fee }) => {
    const { t } = useTranslation();

    return (
        <ListItem hover={false}>
            <ListItemPayload>
                <Label>{fee?.weiAmount.lt(0) ? t('txActions_refund') : t('transaction_fee')}</Label>
                {fee ? <ActionFeeDetailsUniversalValue fee={fee} /> : <SpinnerIcon />}
            </ListItemPayload>
        </ListItem>
    );
};

const ActionFeeDetailsUniversalValue: FC<{ fee: AssetAmount }> = ({ fee }) => {
    const { fiat } = useAppContext();
    const { data: fiatAmountBN, isLoading } = useAssetAmountFiatEquivalent(fee);

    const fiatAmount = formatFiatCurrency(fiat, fiatAmountBN?.abs() || '0');

    return isLoading ? (
        <SpinnerIcon />
    ) : (
        <ColumnText
            right
            text={fee.stringAssetAbsoluteRelativeAmount}
            secondary={fiatAmountBN ? `≈ ${fiatAmount}` : undefined}
        />
    );
};

const Block = styled.div`
    text-align: center;
    display: flex;
    gap: 2rem;
    flex-direction: column;
    align-items: center;
`;

export const ActionDetailsBlock: FC<PropsWithChildren<{ event: AccountEvent }>> = ({
    event,
    children
}) => {
    const { config } = useAppContext();
    const url = config.transactionExplorer ?? 'https://tonviewer.com/transaction/%s';
    return (
        <CommonActionDetailsBlock url={url} eventId={event.eventId}>
            {children}
        </CommonActionDetailsBlock>
    );
};

export const TronActionDetailsBlock: FC<PropsWithChildren<{ event: TronEvent }>> = ({
    event,
    children
}) => {
    const network = useActiveTonNetwork();
    const url =
        network === Network.TESTNET
            ? 'https://nile.tronscan.org/#/transaction/%s'
            : 'https://tronscan.org/#/transaction/%s';
    return (
        <CommonActionDetailsBlock url={url} eventId={event.txHash}>
            {children}
        </CommonActionDetailsBlock>
    );
};

const CommonActionDetailsBlock: FC<PropsWithChildren<{ eventId: string; url: string }>> = ({
    children,
    eventId,
    url
}) => {
    const { t } = useTranslation();
    const sdk = useAppSdk();
    return (
        <Block>
            {children}
            <Button size="large" fullWidth onClick={() => sdk.openPage(url.replace('%s', eventId))}>
                {t('nft_view_in_explorer')}
            </Button>
        </Block>
    );
};
