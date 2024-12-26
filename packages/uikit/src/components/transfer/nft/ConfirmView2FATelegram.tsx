import { closeAllNotifications } from '../../Notification';
import styled from 'styled-components';
import { FC, useEffect, useRef } from 'react';
import { useCountdown } from '../../../hooks/useCountDown';
import { Body2, Body2Class, Label2 } from '../../Text';
import { useTranslation } from '../../../hooks/translation';
import { Button } from '../../fields/Button';
import { TelegramIcon } from '../../Icon';
import { useAppSdk } from '../../../hooks/appSdk';
import { Link } from 'react-router-dom';
import { AppRoute, WalletSettingsRoute } from '../../../libs/routes';

const ContentWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
`;

const TextWrapper = styled.div`
    display: flex;
    flex-direction: column;
    max-width: 304px;
    gap: 4px;
    text-align: center;
    align-items: center;
    text-wrap: balance;
    margin-bottom: 24px;

    > ${Body2} {
        color: ${p => p.theme.textSecondary};
    }
`;

const TelegramIconStyled = styled(TelegramIcon)`
    color: ${p => p.theme.buttonPrimaryForeground};
`;

const CannotAccessTgText = styled(Body2)`
    display: block;
    margin-top: 12px;
    color: ${p => p.theme.textSecondary};

    a {
        color: ${p => p.theme.accentBlueConstant};
        text-decoration: none;
    }
`;

export const ConfirmView2FATelegramContent: FC<{
    validUntilSeconds: number;
    creationTimeSeconds: number;
    onClose: () => void;
    openTgLink: string;
}> = ({ validUntilSeconds, onClose, openTgLink, creationTimeSeconds }) => {
    const { t } = useTranslation();
    const renderTime = useRef(Math.floor(Date.now() / 1000));
    const totalSeconds = validUntilSeconds - creationTimeSeconds;
    const secondsLeft = useCountdown(validUntilSeconds - renderTime.current);
    const sdk = useAppSdk();

    useEffect(() => {
        if (!secondsLeft) {
            onClose();
        }
    }, [secondsLeft, onClose]);

    const onHelp = () => {
        onClose();
        closeAllNotifications();
    };

    return (
        <ContentWrapper>
            <CircularTimerStyled totalSeconds={totalSeconds} secondsLeft={secondsLeft} />
            <TextWrapper>
                <Label2>{t('two_fa_confirm_tg_title')}</Label2>
                <Body2>{t('two_fa_confirm_tg_description')}</Body2>
            </TextWrapper>
            <Button primary fullWidth onClick={() => sdk.openPage(openTgLink)}>
                <TelegramIconStyled />
                {t('two_fa_settings_set_up_tg_connection_modal_open_button')}
            </Button>
            <CannotAccessTgText>
                {t('two_fa_confirm_tg_cannot_access_tg')}
                <Link to={AppRoute.settings + WalletSettingsRoute.twoFa} onClick={onHelp}>
                    {' '}
                    {t('help')}
                </Link>
            </CannotAccessTgText>
        </ContentWrapper>
    );
};

const TimerWrapper = styled.div`
    position: relative;
    width: 76px;
    height: 76px;
`;

const TimerCircle = styled.svg`
    transform: rotate(-90deg);
    width: 76px;
    height: 76px;
`;

const CircleBackground = styled.circle`
    fill: none;
    stroke: ${p => p.theme.backgroundContent};
    stroke-width: 4px;
`;

const CircleProgress = styled.circle<{ $progress: number }>`
    fill: none;
    stroke: ${p => p.theme.accentBlueConstant};
    stroke-width: 4px;
    stroke-linecap: round;
    stroke-dasharray: 215.04;
    stroke-dashoffset: ${p => 215.04 * (1 - p.$progress)};
    transition: stroke-dashoffset 0.3s ease;
`;

const TimeDisplay = styled.div`
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 1.125rem;
    font-weight: 500;
    color: white;

    ${Body2Class};
`;

const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const CircularTimer: FC<{
    totalSeconds: number;
    secondsLeft: number;
    className?: string;
}> = ({ totalSeconds, secondsLeft, className }) => {
    const progress = secondsLeft / totalSeconds;
    const radius = 34.25; // (76px - 4px stroke width) / 2 - 1px for safety

    return (
        <TimerWrapper className={className}>
            <TimerCircle viewBox="0 0 76 76">
                <CircleBackground cx="38" cy="38" r={radius} />
                <CircleProgress cx="38" cy="38" r={radius} $progress={progress} />
            </TimerCircle>
            <TimeDisplay>{formatTime(secondsLeft)}</TimeDisplay>
        </TimerWrapper>
    );
};

const CircularTimerStyled = styled(CircularTimer)`
    margin-bottom: 1rem;
`;
