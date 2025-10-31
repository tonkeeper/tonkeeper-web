import { useWalletLegacyPlugins } from '../../state/plugins';
import styled from 'styled-components';
import { Body2, Label1 } from '../Text';
import { useTranslation } from '../../hooks/translation';
import { ButtonFlat } from '../fields/Button';
import React, { FC, PropsWithChildren, Suspense, useState } from 'react';
import { CancelLegacySubscriptionNotification } from './CancelLegacySubscriptionNotification';

const Banner = styled.div`
    width: 100%;
    box-sizing: border-box;
    margin: 8px 0;

    background: ${p => p.theme.accentOrange};
    border-radius: ${p => p.theme.cornerSmall};
    padding: 12px 16px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;

    color: ${p => p.theme.constantBlack};
`;

const ColumnText = styled.div`
    display: flex;
    flex-direction: column;
    margin-bottom: 4px;
`;

const ButtonFlatStyled = styled(ButtonFlat)`
    color: ${p => p.theme.constantBlack};
`;

export const MobileCancelLegacySubscriptionBanner: FC<
    PropsWithChildren<{ className?: string }>
> = ({ className, children }) => {
    const { data: legacyPlugins } = useWalletLegacyPlugins();
    const { t } = useTranslation();
    const [pluginToUnsubscribe, setPluginToUnsubscribe] = useState<string | undefined>();

    if (!legacyPlugins?.length) {
        return null;
    }

    return (
        <>
            {children}
            <Banner className={className}>
                <ColumnText>
                    <Label1>
                        {t('unsubscribe_legacy_plugin_banner_title', {
                            count: legacyPlugins.length
                        })}
                    </Label1>
                    <Body2>
                        {t(
                            legacyPlugins.length === 1
                                ? 'unsubscribe_legacy_plugin_banner_subtitle'
                                : 'unsubscribe_legacy_plugin_many_banner_subtitle'
                        )}
                    </Body2>
                </ColumnText>
                <ButtonFlatStyled onClick={() => setPluginToUnsubscribe(legacyPlugins![0].address)}>
                    {t('disable')}
                </ButtonFlatStyled>
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
