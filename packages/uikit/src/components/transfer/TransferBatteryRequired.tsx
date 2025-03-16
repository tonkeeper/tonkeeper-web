import styled, { css } from 'styled-components';
import { TRON_USDT_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { PlusIconSmall } from '../Icon';
import { Body2, Label2 } from '../Text';
import { useTranslation } from '../../hooks/translation';
import { ButtonResponsiveSize } from '../fields/Button';
import React, { FC, useCallback } from 'react';
import {
    FullHeightBlock,
    NotificationBackButton,
    NotificationCancelButton,
    NotificationFooter,
    NotificationFooterPortal,
    NotificationHeader,
    NotificationHeaderPortal,
    NotificationTitleBlock
} from '../Notification';
import { useIsFullWidthMode } from '../../hooks/useIsFullWidthMode';
import { useNavigate } from 'react-router-dom';
import { AppRoute, WalletSettingsRoute } from '../../libs/routes';
import { BatteryChargingIcon } from '../settings/battery/BatteryIcons';

export const TransferBatteryRequired: FC<{
    onBack: () => void;
    onClose: () => void;
    isAnimationProcess: boolean;
}> = ({ onBack, onClose, isAnimationProcess }) => {
    const { t } = useTranslation();
    const isFullWidth = useIsFullWidthMode();
    const shouldHideHeaderAndFooter = isFullWidth && isAnimationProcess;

    const navigate = useNavigate();
    const onCharge = useCallback(() => {
        onClose();
        navigate(AppRoute.walletSettings + WalletSettingsRoute.battery);
    }, [onClose]);

    return (
        <FullHeightBlock>
            {!shouldHideHeaderAndFooter && (
                <NotificationHeaderPortal>
                    <NotificationHeader>
                        <NotificationTitleBlock>
                            <NotificationBackButton onBack={onBack} />
                            <NotificationCancelButton handleClose={onClose} />
                        </NotificationTitleBlock>
                    </NotificationHeader>
                </NotificationHeaderPortal>
            )}

            <Icon />
            <TextContainer>
                <Label2>{t('transfer_battery_required_title')}</Label2>
                <Body2Styled>{t('transfer_battery_required_description')}</Body2Styled>
            </TextContainer>
            {!shouldHideHeaderAndFooter && (
                <NotificationFooterPortal>
                    <NotificationFooter>
                        <ChargeBatteryButton primary fullWidth onClick={onCharge}>
                            {t('transfer_battery_required_button')}
                        </ChargeBatteryButton>
                    </NotificationFooter>
                </NotificationFooterPortal>
            )}
        </FullHeightBlock>
    );
};

const TextContainer = styled.div`
    margin-bottom: 24px;
`;

const Body2Styled = styled(Body2)`
    display: block;
    margin-top: 4px;
    color: ${p => p.theme.textSecondary};
`;

const ChargeBatteryButton = styled(ButtonResponsiveSize)`
    ${p =>
        p.theme.displayType === 'compact' &&
        css`
            position: absolute;
            bottom: 16px;
        `}
`;

const IconContainer = styled.div`
    display: flex;
    align-items: center;
    margin: 0 auto 16px;
    gap: 12px;

    > img {
        width: 56px;
        height: 56px;
    }

    *:last-child {
        height: 62px;
        width: auto;
    }
`;

const Icon = () => {
    return (
        <IconContainer>
            <img src={TRON_USDT_ASSET.image} />
            <PlusIconSmall />
            <BatteryChargingIcon />
        </IconContainer>
    );
};
