import styled from 'styled-components';
import { TRON_USDT_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { PlusIconSmall } from '../Icon';
import { BatteryIconCharging } from '../settings/battery/BatteryInfoHeading';
import { Body2, Label2 } from '../Text';
import { useTranslation } from '../../hooks/translation';
import { Button } from '../fields/Button';
import React, { FC, useCallback } from 'react';
import {
    FullHeightBlock,
    NotificationBackButton,
    NotificationCancelButton,
    NotificationHeader,
    NotificationHeaderPortal,
    NotificationTitleBlock
} from '../Notification';
import { useIsFullWidthMode } from '../../hooks/useIsFullWidthMode';
import { useNavigate } from 'react-router-dom';
import { AppRoute, WalletSettingsRoute } from '../../libs/routes';

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
            <div>
                <Label2>{t('transfer_battery_required_title')}</Label2>
                <Body2Styled>{t('transfer_battery_required_description')}</Body2Styled>
            </div>
            <ChargeBatteryButton primary fullWidth onClick={onCharge}>
                {t('transfer_battery_required_button')}
            </ChargeBatteryButton>
        </FullHeightBlock>
    );
};

const Body2Styled = styled(Body2)`
    display: block;
    margin-top: 4px;
    color: ${p => p.theme.textSecondary};
`;

const ChargeBatteryButton = styled(Button)`
    margin-top: 24px;
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
        width: 36px;
    }
`;

const Icon = () => {
    return (
        <IconContainer>
            <img src={TRON_USDT_ASSET.image} />
            <PlusIconSmall />
            <BatteryIconCharging />
        </IconContainer>
    );
};
