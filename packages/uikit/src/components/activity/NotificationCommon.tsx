import { intlLocale } from '@tonkeeper/core/dist/entries/language';
import {
    AccountAddress,
    AccountEvent,
    JettonSwapActionDexEnum
} from '@tonkeeper/core/dist/tonApiV2';
import { formatAddress, toShortValue } from '@tonkeeper/core/dist/utils/common';
import React, { FC, PropsWithChildren, useMemo } from 'react';
import styled, { useTheme } from 'styled-components';
import { useAppContext } from '../../hooks/appContext';
import { useAppSdk } from '../../hooks/appSdk';
import { formatFiatCurrency } from '../../hooks/balance';
import { useTranslation } from '../../hooks/translation';
import { useAssetAmountFiatEquivalent } from '../../state/asset';
import { useFormatFiat, useRate } from '../../state/rates';
import { ChevronRightIcon, SpinnerIcon } from '../Icon';
import { ColumnText } from '../Layout';
import { ListItem, ListItemPayload } from '../List';
import { Body1, Body2Class, H2, Label1, Label2 } from '../Text';
import { Button } from '../fields/Button';
import { hexToRGBA } from '../../libs/css';
import { useActiveConfig, useActiveTonNetwork } from '../../state/wallet';
import {
    SenderChoiceUserAvailable,
    SenderTypeUserAvailable
} from '../../hooks/blockchain/useSender';
import { SelectDropDown } from '../fields/Select';
import { DropDownContent, DropDownItem, DropDownItemsDivider } from '../DropDown';
import { TON_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { useBatteryBalance } from '../../state/battery';
import {
    isTransactionFeeRefund,
    TransactionFee,
    TransactionFeeBattery,
    TransactionFeeTonAsset
} from '@tonkeeper/core/dist/entries/crypto/transaction-fee';
import { tonAssetAddressToString } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { assertUnreachableSoft } from '@tonkeeper/core/dist/utils/types';

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

export const LabelPrimary = styled(Body1)`
    user-select: none;
    color: ${props => props.theme.textPrimary};
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

export const ActionExtraDetails: FC<{
    extra: number;
}> = ({ extra }) => {
    const fee = useMemo(
        () => ({
            type: 'ton-asset' as const,
            extra: new AssetAmount({ asset: TON_ASSET, weiAmount: extra })
        }),
        [extra]
    );

    return <ActionFeeTonAssetDetails fee={fee} />;
};

export const ActionFeeDetails: FC<{
    fee: TransactionFee;
}> = ({ fee }) => {
    if (fee.type === 'ton-asset') {
        return <ActionFeeTonAssetDetails fee={fee} />;
    }

    if (fee.type === 'battery') {
        return <ActionFeeBatteryDetails fee={fee} />;
    }

    assertUnreachableSoft(fee);
    return null;
};

export const ActionFeeTonAssetDetails: FC<{
    fee: TransactionFeeTonAsset;
}> = ({ fee }) => {
    const { t } = useTranslation();

    const feeAbs = useMemo(
        () => new AssetAmount({ asset: fee.extra.asset, weiAmount: fee.extra.weiAmount.abs() }),
        [fee.extra]
    );

    const { data: rate } = useRate(tonAssetAddressToString(fee.extra.asset.address));
    const { fiatAmount } = useFormatFiat(rate, feeAbs.relativeAmount);

    return (
        <ListItem hover={false}>
            <ListItemPayload>
                <Label>
                    {fee.extra.relativeAmount.gt(0) ? t('txActions_refund') : t('transaction_fee')}
                </Label>
                <ColumnText
                    right
                    text={feeAbs.stringAssetRelativeAmount}
                    secondary={fiatAmount ? `≈ ${fiatAmount}` : undefined}
                />
            </ListItemPayload>
        </ListItem>
    );
};

export const ActionFeeBatteryDetails: FC<{
    fee: TransactionFeeBattery;
}> = ({ fee }) => {
    const { t } = useTranslation();

    return (
        <ListItem hover={false}>
            <ListItemPayload>
                <Label>{t('transaction_fee')}</Label>
                <LabelPrimary>
                    {t('battery_n_battery_charges', { charges: fee.charges })}
                </LabelPrimary>
            </ListItemPayload>
        </ListItem>
    );
};

const FeeLabelColumn = styled.div`
    display: flex;
    flex-direction: column;
`;

const TransparentButton = styled.button`
    text-align: start;
    ${Body2Class};
    color: ${p => p.theme.accentBlue};
    border: none;
    background: transparent;
    display: flex;
    align-items: center;
    padding: 0;
`;

const TokenImage = styled.img`
    width: 24px;
    height: 24px;
    border-radius: ${p => p.theme.cornerFull};
    margin-right: 12px;
`;

const BatteryIcon = () => {
    const theme = useTheme();
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            style={{ marginRight: '12px' }}
        >
            <path
                d="M6.35428 9.51938L11.4006 3.57258C12.9788 1.71282 13.7678 0.782938 14.3453 1.04296C14.9227 1.30299 14.7201 2.49695 14.3148 4.88488L13.8679 7.51798C13.7699 8.09565 13.7209 8.38449 13.869 8.60008C14.0171 8.81568 14.3081 8.8792 14.8903 9.00624L15.8145 9.20792C18.195 9.72741 19.3852 9.98716 19.6863 10.8541C19.9874 11.7211 19.2068 12.6409 17.6457 14.4806L12.5994 20.4274C11.0212 22.2872 10.2322 23.2171 9.65472 22.957C9.0773 22.697 9.27993 21.503 9.6852 19.1151L10.1321 16.482C10.2301 15.9043 10.2791 15.6155 10.131 15.3999C9.98293 15.1843 9.69186 15.1208 9.10971 14.9938L8.18552 14.7921C5.80504 14.2726 4.61481 14.0128 4.3137 13.1459C4.0126 12.2789 4.79316 11.3591 6.35428 9.51938Z"
                fill={theme.accentGreen}
            />
        </svg>
    );
};

export const ActionFeeDetailsUniversal: FC<{
    fee: TransactionFee | undefined | null;
    onSenderTypeChange?: (type: SenderTypeUserAvailable) => void;
    selectedSenderType?: SenderTypeUserAvailable;
    availableSendersChoices?: SenderChoiceUserAvailable[];
    className?: string;
}> = ({ fee, availableSendersChoices, onSenderTypeChange, selectedSenderType, className }) => {
    const { t } = useTranslation();

    return (
        <ListItem hover={false} className={className}>
            <ListItemPayload>
                <FeeLabelColumn>
                    <Label>
                        {isTransactionFeeRefund(fee ?? undefined)
                            ? t('txActions_refund')
                            : t('transaction_fee')}
                    </Label>
                    <SelectSenderDropdown
                        availableSendersChoices={availableSendersChoices}
                        onSenderTypeChange={onSenderTypeChange}
                        selectedSenderType={selectedSenderType}
                    />
                </FeeLabelColumn>
                {fee ? (
                    <ActionFeeDetailsUniversalValue fee={fee} />
                ) : fee === null ? (
                    <></>
                ) : (
                    <SpinnerIcon />
                )}
            </ListItemPayload>
        </ListItem>
    );
};

export const SelectSenderDropdown: FC<{
    onSenderTypeChange?: (type: SenderTypeUserAvailable) => void;
    selectedSenderType?: SenderTypeUserAvailable;
    availableSendersChoices?: SenderChoiceUserAvailable[];
    className?: string;
}> = ({ onSenderTypeChange, selectedSenderType, availableSendersChoices, className }) => {
    const { t } = useTranslation();
    if (!availableSendersChoices?.length || availableSendersChoices.length <= 1) {
        return null;
    }

    return (
        <SelectDropDown
            left="0"
            bottom="0"
            className={className}
            payload={onClose => (
                <DropDownContent>
                    {availableSendersChoices.map(s => (
                        <>
                            <DropDownItem
                                onClick={() => {
                                    onClose();
                                    onSenderTypeChange?.(s.type);
                                }}
                                key={s.type}
                                isSelected={selectedSenderType === s.type}
                            >
                                {s.type === 'battery' ? (
                                    <>
                                        <BatteryIcon />
                                        <Label2>{t('battery_title')}</Label2>
                                    </>
                                ) : s.type === 'gasless' ? (
                                    <>
                                        <TokenImage src={s.asset.image} />
                                        <Label2>{s.asset.symbol}</Label2>
                                    </>
                                ) : (
                                    <>
                                        <TokenImage src={TON_ASSET.image} />
                                        <Label2>{TON_ASSET.symbol}</Label2>
                                    </>
                                )}
                            </DropDownItem>
                            <DropDownItemsDivider />
                        </>
                    ))}
                </DropDownContent>
            )}
        >
            <TransparentButton>
                {t('send_change_fee_payment_method')}
                <ChevronRightIcon />
            </TransparentButton>
        </SelectDropDown>
    );
};

const ActionFeeDetailsUniversalValue: FC<{
    fee: TransactionFee;
}> = ({ fee }) => {
    if (fee.type === 'battery') {
        return <ActionFeeDetailsUniversalBatteryValue fee={fee} />;
    } else {
        return <ActionFeeDetailsUniversalTokenValue fee={fee} />;
    }
};

const ActionFeeDetailsUniversalTokenValue: FC<{ fee: TransactionFeeTonAsset }> = ({ fee }) => {
    const { fiat } = useAppContext();
    const { data: fiatAmountBN, isLoading } = useAssetAmountFiatEquivalent(fee.extra);

    const fiatAmount = formatFiatCurrency(fiat, fiatAmountBN?.abs() || '0');

    return isLoading ? (
        <SpinnerIcon />
    ) : (
        <ColumnText
            right
            text={fee.extra.stringAssetAbsoluteRelativeAmount}
            secondary={fiatAmountBN ? `≈ ${fiatAmount}` : undefined}
        />
    );
};

const ActionFeeDetailsUniversalBatteryValue: FC<{ fee: TransactionFeeBattery }> = ({ fee }) => {
    const { t } = useTranslation();
    const { data: balance } = useBatteryBalance();

    if (!balance) {
        return <SpinnerIcon />;
    }

    const balanceNumber = balance.batteryUnitsBalance.toNumber();

    return (
        <ColumnText
            right
            text={t('battery_n_battery_charges', { charges: fee.charges })}
            secondary={
                balanceNumber !== 0 && balanceNumber >= fee.charges
                    ? t('battery_out_of_num_available', {
                          number: balanceNumber
                      })
                    : ''
            }
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
    const config = useActiveConfig();
    const url = config.transactionExplorer ?? 'https://tonviewer.com/transaction/%s';
    return (
        <CommonActionDetailsBlock url={url} eventId={event.eventId}>
            {children}
        </CommonActionDetailsBlock>
    );
};

export const CommonActionDetailsBlock: FC<PropsWithChildren<{ eventId: string; url: string }>> = ({
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
