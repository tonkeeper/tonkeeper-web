import React, { FC } from 'react';
import styled from 'styled-components';
import { Notification } from '../Notification';
import { Body3, Label2 } from '../Text';
import { Button } from '../fields/Button';
import { useTranslation } from '../../hooks/translation';
import { Image } from '../shared/Image';
import { TON_ASSET, TRON_TRX_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { ExternalLink } from '../shared/ExternalLink';
import { hover } from '../../libs/css';
import { useAppContext } from '../../hooks/appContext';
import { useAppSdk } from '../../hooks/appSdk';
import { BLOCKCHAIN_NAME } from '@tonkeeper/core/dist/entries/crypto';
import { useNavigate } from '../../hooks/router/useNavigate';
import { AppRoute, WalletSettingsRoute } from '../../libs/routes';
import { useTrc20TransferDefaultFees } from '../../state/tron/tron';
import { Skeleton } from '../shared/Skeleton';

const NotificationStyled = styled(Notification)`
    max-width: 648px;
`;

const Content = styled.div`
    display: flex;
    flex-direction: column;
    padding-bottom: 4px;
    align-items: center;

    > ${Label2} {
        text-align: center;
        margin-bottom: 24px;
    }
`;

const BatteryIcon = () => {
    return (
        <svg
            width="56"
            height="56"
            viewBox="0 0 56 56"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                opacity="0.64"
                d="M28 2C30.873 2 33.2294 4.20296 33.4766 7.01172C37.6185 7.05021 39.9661 7.26697 41.7021 8.52832C42.3812 9.02171 42.9783 9.61879 43.4717 10.2979C44.9995 12.4008 45 15.4008 45 21.4004V39.5996C45 45.5992 44.9995 48.5992 43.4717 50.7021C42.9783 51.3812 42.3812 51.9783 41.7021 52.4717C39.5992 53.9995 36.5992 54 30.5996 54H25.4004C19.4008 54 16.4008 53.9995 14.2979 52.4717C13.6188 51.9783 13.0217 51.3812 12.5283 50.7021C11.0005 48.5992 11 45.5992 11 39.5996V21.4004C11 15.4008 11.0005 12.4008 12.5283 10.2979C13.0217 9.61879 13.6188 9.02171 14.2979 8.52832C16.0338 7.26707 18.3811 7.05023 22.5225 7.01172C22.7696 4.20292 25.127 2 28 2ZM23.7998 9C19.3006 9 17.0508 8.99992 15.4736 10.1455C14.9643 10.5156 14.5156 10.9643 14.1455 11.4736C12.9999 13.0508 13 15.3006 13 19.7998V41.2002C13 45.6994 12.9999 47.9492 14.1455 49.5264C14.5156 50.0357 14.9643 50.4844 15.4736 50.8545C17.0508 52.0001 19.3006 52 23.7998 52H32.2002C36.6994 52 38.9492 52.0001 40.5264 50.8545C41.0357 50.4844 41.4844 50.0357 41.8545 49.5264C43.0001 47.9492 43 45.6994 43 41.2002V19.7998C43 15.3006 43.0001 13.0508 41.8545 11.4736C41.4844 10.9643 41.0357 10.5156 40.5264 10.1455C38.9492 8.99992 36.6994 9 32.2002 9H23.7998Z"
                fill="#4E4E52"
            />
            <path
                d="M15 20C15 16.2503 15 14.3754 15.9549 13.0611C16.2633 12.6366 16.6366 12.2633 17.0611 11.9549C18.3754 11 20.2503 11 24 11H32C35.7497 11 37.6246 11 38.9389 11.9549C39.3634 12.2633 39.7367 12.6366 40.0451 13.0611C41 14.3754 41 16.2503 41 20V41C41 44.7497 41 46.6246 40.0451 47.9389C39.7367 48.3634 39.3634 48.7367 38.9389 49.0451C37.6246 50 35.7497 50 32 50H24C20.2503 50 18.3754 50 17.0611 49.0451C16.6366 48.7367 16.2633 48.3634 15.9549 47.9389C15 46.6246 15 44.7497 15 41V20Z"
                fill="#39CC83"
            />
        </svg>
    );
};

const Cards = styled.div`
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
`;

const MethodImage = styled(Image)`
    border-radius: 100%;
    width: 44px;
    height: 44px;
    padding: 6px;
`;

const MethodCard = styled.div`
    display: flex;
    flex-direction: column;
    text-align: center;
    padding: 32px 12px 12px;
    border-radius: ${p => p.theme.cornerSmall};
    background: ${props => props.theme.backgroundContent};
    align-items: center;
    gap: 12px;
`;

const MethodInfo = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;

    > ${Body3} {
        color: ${props => props.theme.textSecondary};
    }
`;

const MethodPrice = styled(Body3)`
    color: ${props => props.theme.textSecondary};
`;

const FooterNote = styled(Body3)`
    color: ${props => props.theme.textTertiary};
    text-align: center;
    margin: 20px 0 4px;
`;

const FooterLink = styled(ExternalLink)`
    color: ${props => props.theme.textSecondary};
    opacity: 1;
    transition: opacity 0.15s ease;

    ${hover`
        opacity: 0.8;`}
`;

export const TopUpTronFeeBalance: FC<{ isOpen: boolean; onClose: () => void }> = ({
    isOpen,
    onClose
}) => {
    return (
        <NotificationStyled isOpen={isOpen} handleClose={onClose}>
            {() => <TopUpTronFeeBalanceContent onClose={onClose} />}
        </NotificationStyled>
    );
};

const TopUpTronFeeBalanceContent: FC<{ onClose: () => void }> = ({ onClose }) => {
    const { t } = useTranslation();
    const { mainnetConfig } = useAppContext();
    const sdk = useAppSdk();
    const navigate = useNavigate();
    const { tonSenderFee, trxSenderFee, batterySenderFee } = useTrc20TransferDefaultFees();

    const onTopupToken = (asset: 'ton' | 'trx') => {
        sdk.uiEvents.emit('receive', {
            method: 'receive',
            params: {
                chain: asset === 'ton' ? BLOCKCHAIN_NAME.TON : BLOCKCHAIN_NAME.TRON,
                jetton: asset === 'ton' ? TON_ASSET.id : TRON_TRX_ASSET.id
            }
        });
    };

    return (
        <Content>
            <Label2>{t('topup_tron_fee_title')}</Label2>

            <Cards>
                <MethodCard>
                    <BatteryIcon />
                    <MethodInfo>
                        <Label2>{t('battery_title')}</Label2>
                        <Body3>{t('topup_tron_fee_battery_description')}</Body3>
                    </MethodInfo>
                    {batterySenderFee.fiatAmount ? (
                        <MethodPrice>
                            {t('topup_tron_fee_price_per_transfer', {
                                fiat: batterySenderFee.fiatAmount
                            })}
                        </MethodPrice>
                    ) : (
                        <Skeleton height="14px" marginTop="2px" width="100px" />
                    )}
                    <Button
                        primary
                        size="small"
                        onClick={() => {
                            onClose();
                            navigate(AppRoute.walletSettings + WalletSettingsRoute.battery, {
                                disableMobileAnimation: true
                            });
                        }}
                        fullWidth
                    >
                        {t('topup_tron_fee_top_up')}
                    </Button>
                </MethodCard>
                <MethodCard>
                    <MethodImage src={TON_ASSET.image} />
                    <MethodInfo>
                        <Label2>{TON_ASSET.symbol}</Label2>
                        <Body3>{t('topup_tron_fee_ton_description')}</Body3>
                    </MethodInfo>
                    {tonSenderFee.fiatAmount ? (
                        <MethodPrice>
                            {t('topup_tron_fee_price_per_transfer', {
                                fiat: tonSenderFee.fiatAmount
                            })}
                        </MethodPrice>
                    ) : (
                        <Skeleton height="14px" marginTop="2px" width="100px" />
                    )}
                    <Button size="small" onClick={() => onTopupToken('ton')} fullWidth>
                        {t('topup_tron_fee_top_up')}
                    </Button>
                </MethodCard>
                <MethodCard>
                    <MethodImage src={TRON_TRX_ASSET.image} />
                    <MethodInfo>
                        <Label2>{TRON_TRX_ASSET.symbol}</Label2>
                        <Body3>{t('topup_tron_fee_trx_description')}</Body3>
                    </MethodInfo>
                    {trxSenderFee.fiatAmount ? (
                        <MethodPrice>
                            {t('topup_tron_fee_price_per_transfer', {
                                fiat: trxSenderFee.fiatAmount
                            })}
                        </MethodPrice>
                    ) : (
                        <Skeleton height="14px" marginTop="2px" width="100px" />
                    )}
                    <Button size="small" onClick={() => onTopupToken('trx')} fullWidth>
                        {t('topup_tron_fee_top_up')}
                    </Button>
                </MethodCard>
            </Cards>

            <FooterNote>
                {t('topup_tron_fee_disclaimer')}

                {!!mainnetConfig.faq_tron_fee_url && (
                    <>
                        &nbsp;
                        <FooterLink href={mainnetConfig.faq_tron_fee_url}>
                            {t('learn_more')}
                        </FooterLink>
                    </>
                )}
            </FooterNote>
        </Content>
    );
};
