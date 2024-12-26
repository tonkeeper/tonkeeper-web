import { Button } from '../../fields/Button';
import {
    TwoFAWalletConfig,
    useBoundTwoFABot,
    useGetBoundingTwoFABotLink,
    useIsTwoFAActivationProcess,
    useTwoFAWalletConfig
} from '../../../state/two-fa';
import styled, { useTheme } from 'styled-components';
import { Body2 } from '../../Text';
import { useTranslation } from '../../../hooks/translation';
import { FC, forwardRef, LegacyRef, useLayoutEffect, useRef, useState } from 'react';
import {
    TwoFAConnectBotNotification,
    TwoFAReConnectBotNotification
} from './TwoFAConnectBotNotification';
import { useDisclosure } from '../../../hooks/useDisclosure';
import { useIsFullWidthMode } from '../../../hooks/useIsFullWidthMode';
import { DeployTwoFAConfirmNotification } from './DeployTwoFAConfirmNotification';

export const TwoFASetUp: FC<{ className?: string }> = ({ className }) => {
    const { data: config } = useTwoFAWalletConfig();
    const { ref1, ref2, params } = useDrawConnector();

    if (config === undefined) {
        return null;
    }

    return (
        <StepsContainer className={className}>
            <LinkTGStep config={config} ref={ref1} />
            <DeployPluginStep config={config} ref={ref2} />
            {params && <ConnectorStyled {...params} />}
        </StepsContainer>
    );
};

const useDrawConnector = () => {
    const ref1 = useRef<HTMLElement>(null);
    const ref2 = useRef<HTMLElement>(null);
    const [params, setParams] = useState<{ $left: number; $top: number; $right: number }>();
    const isFullWidth = useIsFullWidthMode();

    useLayoutEffect(() => {
        const el1 = ref1.current;
        const el2 = ref2.current;

        if (!el1 || !el2) {
            return;
        }

        if (!isFullWidth) {
            setParams(undefined);
            return;
        }

        const el1Rect = el1.getBoundingClientRect();

        const left = el1Rect.right + 10;
        const top = el1Rect.top + 13;
        const right = el2.getBoundingClientRect().left - 10;

        if (left !== params?.$left || top !== params?.$top || right !== params?.$right) {
            setParams({ $left: left, $top: top, $right: right });
        }
    });

    return {
        ref1,
        ref2,
        params
    };
};

const LinkTGStep = forwardRef<HTMLElement, { config: TwoFAWalletConfig }>(({ config }, ref) => {
    const { t } = useTranslation();
    const { isOpen, onClose, onOpen } = useDisclosure();

    const isStepActive = config === null || config.status === 'tg-bot-bounding';

    const { mutateAsync: boundBot } = useBoundTwoFABot();

    const {
        isOpen: isOpenReconnectTG,
        onClose: onCloseReconnectTG,
        onOpen: onOpenReconnectTG
    } = useDisclosure();
    const {
        mutateAsync: getReconnectTGLink,
        data: reconnectTGLink,
        reset: resetReconnectTGLink
    } = useGetBoundingTwoFABotLink({ forReconnect: true });

    const onClickReconnectTG = async () => {
        try {
            await getReconnectTGLink();
            onOpenReconnectTG();
        } catch (e) {
            console.error(e);
        }
    };

    const onClickCloseReconnectTG = () => {
        onCloseReconnectTG();
        setTimeout(resetReconnectTGLink, 300);
    };

    const onClickContinue = async () => {
        if (config === null) {
            await boundBot();
        }

        onOpen();
    };

    useLayoutEffect(() => {
        if (!isStepActive && isOpen) {
            onClose();
        }
    }, [isStepActive, isOpen, onClose]);

    return (
        <>
            <StepContainer $active={isStepActive}>
                <TgIcon28 ref={ref} />
                <Body2>{t('two_fa_settings_set_up_tg_step_description')}</Body2>
                {isStepActive ? (
                    <Button primary onClick={onClickContinue}>
                        {t('continue')}
                    </Button>
                ) : (
                    <Button onClick={() => onClickReconnectTG()}>
                        {t('two_fa_settings_change_tg_short_button')}
                    </Button>
                )}
            </StepContainer>
            <TwoFAReConnectBotNotification
                isOpen={isOpenReconnectTG}
                onClose={onClickCloseReconnectTG}
                authLink={reconnectTGLink}
            />
            <TwoFAConnectBotNotification isOpen={isOpen} onClose={onClose} />
        </>
    );
});

const DeployPluginStep = forwardRef<HTMLElement, { config: TwoFAWalletConfig }>(
    ({ config }, ref) => {
        const { t } = useTranslation();
        const { isOpen, onClose, onOpen } = useDisclosure();
        const { data: isDeploying } = useIsTwoFAActivationProcess();

        const isStepActive = config?.status === 'ready-for-deployment';

        return (
            <>
                <StepContainer $active={isStepActive}>
                    <DoneIcon28 ref={ref} />
                    <Body2>{t('two_fa_settings_set_up_deploy_step_description')}</Body2>
                    <Button
                        primary={isStepActive}
                        disabled={!isStepActive}
                        onClick={onOpen}
                        loading={isDeploying}
                    >
                        {t('two_fa_settings_set_up_deploy_step_button')}
                    </Button>
                </StepContainer>
                <DeployTwoFAConfirmNotification isOpen={isOpen} onClose={onClose} />
            </>
        );
    }
);

const Connector: FC<{ className?: string }> = ({ className }) => {
    const theme = useTheme();
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="154"
            height="2"
            viewBox="0 0 154 2"
            fill="none"
            className={className}
        >
            <path
                d="M1 1H153"
                stroke={theme.backgroundContentTint}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeDasharray="4 4"
            />
        </svg>
    );
};

const ConnectorStyled = styled(Connector)<{ $left: number; $right: number; $top: number }>`
    position: fixed;
    top: ${p => p.$top}px;
    left: ${p => p.$left}px;
    right: ${p => p.$right}px;
`;

const StepsContainer = styled.div`
    display: flex;
    max-width: 400px;

    > * {
        flex: 1;
    }
`;

const StepContainer = styled.div<{ $active?: boolean }>`
    display: flex;
    flex-direction: column;
    padding: 0 16px;
    align-items: center;

    > *:first-child {
        margin-bottom: 8px;

        color: ${p => (p.$active ? p.theme.iconPrimary : p.theme.iconTertiary)};
    }

    > *:nth-child(2) {
        margin-bottom: 16px;
        flex: 1;
        max-width: 196px;

        color: ${p => (p.$active ? p.theme.textPrimary : p.theme.textSecondary)};
        text-wrap: balance;
        text-align: center;
    }
`;

const TgIcon28 = forwardRef<HTMLElement>(({}, ref) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 28 28"
            fill="none"
            ref={ref as unknown as LegacyRef<SVGSVGElement>}
        >
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M5.40927 12.8184C10.9122 10.4193 14.5817 8.83767 16.4177 8.0735C21.6599 5.89166 22.7492 5.51265 23.4592 5.50013C23.6154 5.49738 23.9645 5.53611 24.1907 5.71974C24.3816 5.8748 24.4342 6.08426 24.4593 6.23128C24.4845 6.37829 24.5158 6.71319 24.4909 6.97487C24.2068 9.96165 22.9776 17.2098 22.3523 20.555C22.0876 21.9705 21.5666 22.4451 21.0622 22.4916C19.966 22.5925 19.1336 21.7667 18.0719 21.0702C16.4105 19.9805 15.4719 19.3021 13.8593 18.2387C11.9955 17.0097 13.2037 16.3343 14.2658 15.2304C14.5438 14.9415 19.3737 10.5455 19.4672 10.1467C19.4789 10.0968 19.4897 9.91089 19.3793 9.81273C19.269 9.71456 19.1061 9.74813 18.9885 9.77483C18.8219 9.81267 16.1678 11.5681 11.0262 15.041C10.2729 15.5587 9.59052 15.8109 8.97914 15.7977C8.30515 15.7831 7.00866 15.4163 6.04485 15.1028C4.8627 14.7183 3.92315 14.515 4.00497 13.862C4.04758 13.5218 4.51568 13.174 5.40927 12.8184Z"
                fill="currentColor"
            />
        </svg>
    );
});

const DoneIcon28 = forwardRef<HTMLElement>(({}, ref) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 28 28"
            fill="none"
            ref={ref as unknown as LegacyRef<SVGSVGElement>}
        >
            <path
                d="M22.2071 9.70711C22.5976 9.31658 22.5976 8.68342 22.2071 8.29289C21.8166 7.90237 21.1834 7.90237 20.7929 8.29289L10.5 18.5858L6.70711 14.7929C6.31658 14.4024 5.68342 14.4024 5.29289 14.7929C4.90237 15.1834 4.90237 15.8166 5.29289 16.2071L9.79289 20.7071C10.1834 21.0976 10.8166 21.0976 11.2071 20.7071L22.2071 9.70711Z"
                fill="currentColor"
            />
        </svg>
    );
});
