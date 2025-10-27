import { useWalletLegacyPlugins } from '../../state/plugins';
import styled from 'styled-components';
import { Body2, Label2 } from '../Text';
import { useTranslation } from '../../hooks/translation';
import { Button } from '../fields/Button';
import React, { FC, Suspense, useState } from 'react';
import { CancelLegacySubscriptionNotification } from './CancelLegacySubscriptionNotification';
import { useOpenSupport } from '../../state/pro';

const Banner = styled.div`
    position: absolute;
    bottom: 16px;
    left: 16px;
    right: 16px;

    background: ${p => p.theme.backgroundContent};
    border-radius: ${p => p.theme.cornerSmall};
    padding: 0 16px;
    display: flex;
    align-items: center;

    > svg {
        flex-shrink: 0;
    }
`;

const ColumnText = styled.div`
    padding: 14px 16px;
    display: flex;
    flex-direction: column;

    ${Body2} {
        color: ${p => p.theme.textSecondary};
    }
`;

const WarnIcon = () => {
    return (
        <svg
            width="40"
            height="40"
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <g clipPath="url(#clip0_70397_204367)">
                <rect width="40" height="40" rx="10" fill="#17171A" />
                <path d="M0 0H40V40H0V0Z" fill="url(#paint0_linear_70397_204367)" />
                <path
                    d="M20 8C26.6274 8 32 13.3726 32 20C32 26.6274 26.6274 32 20 32C13.3726 32 8 26.6274 8 20C8 13.3726 13.3726 8 20 8ZM20 24C19.3096 24 18.75 24.5596 18.75 25.25C18.75 25.9404 19.3096 26.5 20 26.5C20.6904 26.5 21.25 25.9404 21.25 25.25C21.25 24.5596 20.6904 24 20 24ZM20 13.5C19.3153 13.5 18.7661 14.0656 18.7852 14.75L18.9727 21.5273C18.9877 22.0686 19.4312 22.5 19.9727 22.5H20.0273C20.5688 22.5 21.0123 22.0686 21.0273 21.5273L21.2148 14.75C21.2339 14.0656 20.6847 13.5 20 13.5Z"
                    fill="white"
                />
            </g>
            <defs>
                <linearGradient
                    id="paint0_linear_70397_204367"
                    x1="0"
                    y1="0"
                    x2="40"
                    y2="40"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="#F57F87" />
                    <stop offset="0.0666667" stopColor="#F57F87" />
                    <stop offset="0.133333" stopColor="#F57D86" />
                    <stop offset="0.2" stopColor="#F67B84" />
                    <stop offset="0.266667" stopColor="#F67881" />
                    <stop offset="0.333333" stopColor="#F7757D" />
                    <stop offset="0.4" stopColor="#F87079" />
                    <stop offset="0.466667" stopColor="#F96B74" />
                    <stop offset="0.533333" stopColor="#FB6670" />
                    <stop offset="0.6" stopColor="#FC616B" />
                    <stop offset="0.666667" stopColor="#FD5C67" />
                    <stop offset="0.733333" stopColor="#FE5963" />
                    <stop offset="0.8" stopColor="#FE5660" />
                    <stop offset="0.866667" stopColor="#FF545E" />
                    <stop offset="0.933333" stopColor="#FF525D" />
                    <stop offset="1" stopColor="#FF525D" />
                </linearGradient>
                <clipPath id="clip0_70397_204367">
                    <rect width="40" height="40" rx="10" fill="white" />
                </clipPath>
            </defs>
        </svg>
    );
};

const ButtonsBlock = styled.div`
    display: flex;
    gap: 8px;
    margin-left: auto;
`;

export const DesktopCancelLegacySubscriptionBanner: FC<{ className?: string }> = ({
    className
}) => {
    const { data: legacyPlugins } = useWalletLegacyPlugins();
    const openSupport = useOpenSupport();
    const { t } = useTranslation();
    const [pluginToUnsubscribe, setPluginToUnsubscribe] = useState<string | undefined>();

    if (!legacyPlugins?.length) {
        return null;
    }

    return (
        <>
            <Banner className={className}>
                <WarnIcon />
                <ColumnText>
                    <Label2>
                        {t('unsubscribe_legacy_plugin_banner_title', {
                            count: legacyPlugins.length
                        })}
                    </Label2>
                    <Body2>
                        {' '}
                        {t(
                            legacyPlugins.length === 1
                                ? 'unsubscribe_legacy_plugin_banner_subtitle'
                                : 'unsubscribe_legacy_plugin_many_banner_subtitle'
                        )}
                    </Body2>
                </ColumnText>
                <ButtonsBlock>
                    <Button onClick={openSupport}>{t('contact_support')}</Button>
                    <Button
                        primary
                        onClick={() => setPluginToUnsubscribe(legacyPlugins![0].address)}
                    >
                        {t('disable')}
                    </Button>
                </ButtonsBlock>
            </Banner>
            <Suspense>
                <CancelLegacySubscriptionNotification
                    pluginAddress={pluginToUnsubscribe}
                    onClose={() => setPluginToUnsubscribe(undefined)}
                />
            </Suspense>
        </>
    );
};
