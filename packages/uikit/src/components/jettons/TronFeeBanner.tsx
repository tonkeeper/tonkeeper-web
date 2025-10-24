import styled, { css, useTheme } from 'styled-components';
import { Body1Class, Body2Class, Body3, Body3Class, Label1Class } from '../Text';
import { useTranslation } from '../../hooks/translation';
import {
    useTrc20FreeTransfersConfig,
    useTrc20TransferDefaultFees,
    useTrc20TransfersNumberAvailable,
    useTronBalances
} from '../../state/tron/tron';
import { Button, ButtonFlat } from '../fields/Button';
import { InfoCircleIcon } from '../Icon';
import { Skeleton } from '../shared/Skeleton';
import { useBatteryBalance } from '../../state/battery';
import { Dot } from '../Dot';
import { useActiveConfig, useTonBalance } from '../../state/wallet';
import { FC } from 'react';
import { BLOCKCHAIN_NAME } from '@tonkeeper/core/dist/entries/crypto';
import { TON_ASSET, TRON_TRX_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { AppRoute, WalletSettingsRoute } from '../../libs/routes';
import { useAppSdk } from '../../hooks/appSdk';
import { useNavigate } from '../../hooks/router/useNavigate';
import { DropDown } from '../DropDown';
import { useTopUpTronFeeBalanceNotification } from '../modals/TopUpTronFeeBalanceNotificationControlled';
import { ExternalLink } from '../shared/ExternalLink';
import { IconButtonTransparentBackground } from '../fields/IconButton';
import { Notification } from '../Notification';
import { useDisclosure } from '../../hooks/useDisclosure';
import { useDateTimeFormat } from '../../hooks/useDateTimeFormat';
import { useProFeaturesNotification } from '../modals/ProFeaturesNotificationControlled';
import { FLAGGED_FEATURE, useIsFeatureEnabled } from '../../state/tonendpoint';
import { useProState } from '../../state/pro';
import { isTelegramActiveSubscription } from '@tonkeeper/core/dist/entries/pro';
import { useProAuthNotification } from '../modals/ProAuthNotificationControlled';

const SmallDivider = styled.div`
    width: 100%;
    height: 1px;
    background-color: ${p => p.theme.separatorCommon};

    ${p =>
        p.theme.displayType === 'compact' &&
        css`
            display: none;
        `}
`;

const TransfersNumberStatusWrapper = styled.div`
    display: grid;
    padding: 12px 16px;
    grid-template-columns: auto auto 1fr;
    align-items: center;
    gap: 6px;

    ${Body3Class};
    grid-template-areas: 'a b c';

    ${p =>
        (p.theme.proDisplayType === 'mobile' || p.theme.displayType === 'compact') &&
        css`
            ${Body2Class};
            padding: 16px;
            grid-template-columns: auto 1fr;
            grid-template-rows: auto auto;
            grid-template-areas:
                'a b'
                'c b';
        `}

    ${p =>
        p.theme.displayType === 'compact' &&
        css`
            ${Label1Class};
            background-color: ${p.theme.backgroundContent};
            border-radius: ${p.theme.cornerSmall};
            margin: 16px 0;
        `}

    > *:first-child {
        grid-area: a;
    }
    > *:nth-child(2) {
        grid-area: b;
    }
    > *:nth-child(3) {
        grid-area: c;
    }
`;

const ButtonFlatStyled = styled(ButtonFlat)`
    ${Body3Class};
    justify-self: end;
    color: ${p => p.theme.textSecondary};

    ${p =>
        (p.theme.proDisplayType === 'mobile' || p.theme.displayType === 'compact') &&
        css`
            ${Body2Class};
            justify-self: start;
            color: ${p.theme.accentBlue};
        `}

    ${p =>
        p.theme.displayType === 'compact' &&
        css`
            ${Body1Class};
        `}
`;

const InfoWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-end;
`;

const DropDownStyled = styled(DropDown)`
    .tron-fee-info-container {
        max-height: unset;
        width: 280px;
        right: -120px;
        top: 24px;
    }

    > *:first-child {
        height: 12px;
    }
`;

export const TronFeeBanner = () => {
    const { t } = useTranslation();
    const { onOpen: openTopUpNotification } = useTopUpTronFeeBalanceNotification();
    const { total } = useTrc20TransfersNumberAvailable();
    const { isOpen, onClose, onOpen: openFeeTable } = useDisclosure();
    const theme = useTheme();

    if (total === undefined) {
        return null;
    }

    const showDropDown = theme.displayType === 'full-width' && theme.proDisplayType === 'desktop';

    return (
        <>
            <TransfersNumberStatusWrapper>
                <span>{t('tron_fee_banner_available_label', { transfers: total })}</span>
                <InfoWrapper>
                    {showDropDown ? (
                        <DropDownStyled
                            payload={() => <FeeTable />}
                            trigger="click"
                            containerClassName="tron-fee-info-container"
                        >
                            <InfoCircleIcon />
                        </DropDownStyled>
                    ) : (
                        <MobileIconButton onClick={openFeeTable}>
                            <InfoCircleIcon />
                        </MobileIconButton>
                    )}
                </InfoWrapper>
                <ButtonFlatStyled onClick={openTopUpNotification}>
                    {t('tron_fee_banner_fee_options')}
                </ButtonFlatStyled>
            </TransfersNumberStatusWrapper>
            <SmallDivider />
            <Notification
                title={t('tron_fee_banner_available_fee_options')}
                isOpen={isOpen}
                handleClose={onClose}
            >
                {() => <FeeTable />}
            </Notification>
        </>
    );
};

const MobileIconButton = styled(IconButtonTransparentBackground)`
    padding: 8px;

    > svg {
        width: 16px;
        height: 16px;
    }
`;

const TableWrapper = styled.div`
    border-radius: ${p => p.theme.corner2xSmall};
    background-color: ${p =>
        p.theme.prodisplayType === 'mobile' || p.theme.displayType === 'compact'
            ? p.theme.backgroundContent
            : p.theme.backgroundContentTint};
`;

const TableRow = styled.div`
    padding: 10px 16px;
    display: grid;
    grid-template-columns: 1fr auto;
    grid-template-rows: 1fr 1fr;
    align-items: center;
    flex-direction: column;

    *:nth-child(2),
    *:nth-child(4) {
        justify-self: flex-end;
    }

    &:not(:last-child) {
        border-bottom: 1px solid ${p => p.theme.separatorAlternate};
    }
`;

const TableRowDisclaimer = styled(TableRow)`
    display: block;
`;

const TextSkeleton = () => <Skeleton width="100px" height="14px" marginTop="2px" />;
const RefillButton = styled(ButtonFlat)`
    ${Body3Class};
`;

const TableFirsLineText = styled.span`
    ${Body3Class};

    ${p =>
        p.theme.proDisplayType === 'mobile' &&
        css`
            ${Body2Class};
        `}

    ${p =>
        p.theme.displayType === 'compact' &&
        css`
            ${Body1Class};
        `}
}
`;

const TableSecondLineText = styled(Body3)`
    color: ${p => p.theme.textSecondary};

    ${p =>
        p.theme.displayType === 'compact' &&
        css`
            ${Body2Class};
        `}
`;

const FooterLinkText = styled(Body3)`
    white-space: nowrap;
    ${p =>
        p.theme.displayType === 'compact' &&
        css`
            ${Body2Class};
        `}
`;

const FeeTable = () => {
    const { t } = useTranslation();
    const sdk = useAppSdk();
    const navigate = useNavigate();

    const { data: subscription } = useProState();
    const { batterySenderFee, tonSenderFee, trxSenderFee } = useTrc20TransferDefaultFees();
    const { batteryTransfers, tonTransfers, trxTransfers } = useTrc20TransfersNumberAvailable();
    const { data: batteryBalance } = useBatteryBalance();
    const { data: tonBalance } = useTonBalance();
    const { data: tronBalances } = useTronBalances();
    const { faq_tron_fee_url } = useActiveConfig();
    const { data: trc20FreeTransfers } = useTrc20FreeTransfersConfig();
    const formatDate = useDateTimeFormat();
    const { onOpen: onGetPro } = useProFeaturesNotification();
    const { onOpen: onProAuthOpen } = useProAuthNotification();
    const isTronEnabled = useIsFeatureEnabled(FLAGGED_FEATURE.TRON);

    const hasBatteryTransfers = typeof batteryTransfers === 'number' && batteryTransfers > 0;

    const onRefillToken = (asset: 'ton' | 'trx') => {
        sdk.uiEvents.emit('receive', {
            method: 'receive',
            params: {
                chain: asset === 'ton' ? BLOCKCHAIN_NAME.TON : BLOCKCHAIN_NAME.TRON,
                jetton: asset === 'ton' ? TON_ASSET.id : TRON_TRX_ASSET.id
            }
        });
    };

    const handleProButtonClick = () => {
        if (isTelegramActiveSubscription(subscription)) {
            onProAuthOpen();
        } else {
            onGetPro();
        }
    };

    return (
        <TableWrapper>
            {isTronEnabled && (
                <TableRow>
                    <TableFirsLineText>{t('tron_fee_table_free_transfer_title')}</TableFirsLineText>
                    {trc20FreeTransfers === undefined ? (
                        <span />
                    ) : trc20FreeTransfers.type === 'inactive' ? (
                        <GetProButton primary size="small" onClick={handleProButtonClick}>
                            {t('pro_subscription_get_pro')}
                        </GetProButton>
                    ) : trc20FreeTransfers.availableTransfersNumber > 0 ? (
                        <TableFirsLineText>
                            {t('tron_fee_table_free_transfer_transfers_left', {
                                number: trc20FreeTransfers.availableTransfersNumber
                            })}
                        </TableFirsLineText>
                    ) : (
                        <TableFirsLineText>
                            {t('tron_fee_table_free_transfer_no_transfers_left')}
                        </TableFirsLineText>
                    )}

                    {trc20FreeTransfers === undefined ? (
                        <TextSkeleton />
                    ) : trc20FreeTransfers.type === 'inactive' ? (
                        <TableSecondLineText>
                            {t('tron_fee_table_free_transfer_subtitle_inactive')}
                        </TableSecondLineText>
                    ) : trc20FreeTransfers.availableTransfersNumber > 0 ? (
                        <TableSecondLineText>
                            {t('tron_fee_table_free_transfer_subtitle_active')}
                        </TableSecondLineText>
                    ) : (
                        <span>
                            <TableSecondLineText>
                                {t('tron_fee_table_free_transfer_subtitle_active')}
                            </TableSecondLineText>
                            <Dot />
                            <TableSecondLineText>
                                {t('tron_fee_table_free_transfer_subtitle_used_next_on_date', {
                                    date: formatDate(trc20FreeTransfers.rechargeDate, {
                                        day: 'numeric',
                                        month: 'long'
                                    })
                                })}
                            </TableSecondLineText>
                        </span>
                    )}
                    <span />
                </TableRow>
            )}
            {(isTronEnabled || hasBatteryTransfers) && (
                <TableRowTemplate
                    heading="Tonkeeper Battery"
                    formattedBalance={
                        batteryBalance
                            ? t('battery_charges', {
                                  charges: batteryBalance?.batteryUnitsBalance.toString() ?? 0
                              })
                            : undefined
                    }
                    transfersNumber={batteryTransfers}
                    fiatPerTransfer={
                        batterySenderFee.charges !== undefined
                            ? t('battery_charges', {
                                  charges: batterySenderFee.charges
                              })
                            : undefined
                    }
                    onRefill={
                        isTronEnabled
                            ? () =>
                                  navigate(AppRoute.walletSettings + WalletSettingsRoute.battery, {
                                      disableMobileAnimation: true
                                  })
                            : null
                    }
                />
            )}
            {isTronEnabled && (
                <TableRowTemplate
                    heading="Toncoin"
                    formattedBalance={tonBalance?.stringAssetRelativeAmount}
                    transfersNumber={tonTransfers}
                    fiatPerTransfer={tonSenderFee.fiatAmount}
                    onRefill={() => onRefillToken('ton')}
                />
            )}
            <TableRowTemplate
                heading="TRX"
                formattedBalance={tronBalances?.trx.stringAssetRelativeAmount}
                transfersNumber={trxTransfers}
                fiatPerTransfer={trxSenderFee.fiatAmount}
                onRefill={() => onRefillToken('trx')}
            />
            {!!faq_tron_fee_url && (
                <TableRowDisclaimer>
                    <TableSecondLineText>{t('tron_fee_table_disclaimer')}</TableSecondLineText>
                    &nbsp;
                    <ExternalLink colored href={faq_tron_fee_url}>
                        <FooterLinkText>{t('learn_more')}</FooterLinkText>
                    </ExternalLink>
                </TableRowDisclaimer>
            )}
        </TableWrapper>
    );
};

const TableRowTemplate: FC<{
    heading: string;
    transfersNumber: number | undefined;
    formattedBalance: string | undefined;
    fiatPerTransfer: string | undefined;
    onRefill: (() => void) | null;
}> = ({ heading, transfersNumber, formattedBalance, fiatPerTransfer, onRefill }) => {
    const { t } = useTranslation();
    return (
        <TableRow>
            <TableFirsLineText>{heading}</TableFirsLineText>
            {transfersNumber === undefined ? (
                <TextSkeleton />
            ) : (
                <TableFirsLineText>
                    {t('tron_fee_table_transfers', { transfers: transfersNumber })}
                </TableFirsLineText>
            )}
            {formattedBalance === undefined ? (
                <TextSkeleton />
            ) : (
                <span>
                    <TableSecondLineText>{formattedBalance}</TableSecondLineText>
                    {!!onRefill && (
                        <>
                            <Dot />
                            <RefillButton onClick={onRefill}>
                                {t('tron_fee_start_banner_button')}
                            </RefillButton>
                        </>
                    )}
                </span>
            )}
            {fiatPerTransfer === undefined ? (
                <TextSkeleton />
            ) : (
                <TableSecondLineText>
                    {t('tron_fee_table_charges_per_one', { fiat: fiatPerTransfer })}
                </TableSecondLineText>
            )}
        </TableRow>
    );
};

const GetProButton = styled(Button)`
    grid-row: span 2;
    height: 32px;
`;
