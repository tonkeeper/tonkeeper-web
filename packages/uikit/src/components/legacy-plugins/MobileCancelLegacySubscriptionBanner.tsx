import { useWalletLegacyPlugins } from '../../state/plugins';
import styled from 'styled-components';
import { Body2, Label1 } from '../Text';
import { useTranslation } from '../../hooks/translation';
import { ButtonFlat } from '../fields/Button';
import React, { FC, Suspense, useState } from 'react';

const CancelLegacySubscriptionNotification = React.lazy(
    () => import('./CancelLegacySubscriptionNotification')
);

const Banner = styled.div`
    width: 100%;
    margin: 16px;

    background: ${p => p.theme.accentOrange};
    border-radius: ${p => p.theme.cornerSmall};
    padding: 12px 16px;
    display: flex;
    align-items: center;

    color: ${p => p.theme.constantBlack};
`;

const ColumnText = styled.div`
    display: flex;
    flex-direction: column;
    ${Body2} {
        color: ${p => p.theme.textSecondary};
    }
    margin-bottom: 4px;
`;

export const MobileCancelLegacySubscriptionBanner: FC<{ className?: string }> = ({ className }) => {
    const { data: legacyPlugins } = useWalletLegacyPlugins();
    const { t } = useTranslation();
    const [pluginToUnsubscribe, setPluginToUnsubscribe] = useState<string | undefined>();

    if (!legacyPlugins?.length) {
        return null;
    }

    return (
        <>
            <Banner className={className}>
                <ColumnText>
                    <Label1>{t('unsubscribe_legacy_plugin_banner_title')}</Label1>
                    <Body2>{t('unsubscribe_legacy_plugin_banner_subtitle')}</Body2>
                </ColumnText>
                <ButtonFlat
                    primary
                    onClick={() => setPluginToUnsubscribe(legacyPlugins![0].address)}
                >
                    {t('disable')}
                </ButtonFlat>
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
