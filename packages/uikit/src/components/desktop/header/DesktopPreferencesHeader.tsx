import { ErrorBoundary } from 'react-error-boundary';
import styled from 'styled-components';
import { useTranslation } from '../../../hooks/translation';
import { fallbackRenderOver } from '../../Error';
import { GlobeIcon, TelegramIcon } from '../../Icon';
import { Button } from '../../fields/Button';
import { DesktopHeaderContainer } from './DesktopHeaderElements';
import React from 'react';

import { useAppContext } from '../../../hooks/appContext';
import { useAppSdk } from '../../../hooks/appSdk';

const ButtonsContainer = styled.div`
    display: flex;
    gap: 0.5rem;
    padding: 1rem;
    margin-left: auto;

    > * {
        text-decoration: none;
    }

    svg {
        color: ${p => p.theme.iconPrimary};
    }
`;

const DesktopPreferencesHeaderPayload = () => {
    const { t } = useTranslation();
    const { config } = useAppContext();
    const sdk = useAppSdk();

    const newsUrl = config.tonkeeperNewsUrl;
    const supportUrl = config.directSupportUrl;
    const faqUrl = config.faq_url;

    return (
        <DesktopHeaderContainer>
            <ButtonsContainer>
                {!!faqUrl && (
                    <Button size="small" onClick={() => sdk.openPage(faqUrl)}>
                        <GlobeIcon />
                        {t('preferences_aside_faq')}
                    </Button>
                )}
                {!!supportUrl && (
                    <Button size="small" onClick={() => sdk.openPage(supportUrl)}>
                        <TelegramIcon />
                        {t('settings_support')}
                    </Button>
                )}
                {!!newsUrl && (
                    <Button size="small" onClick={() => sdk.openPage(newsUrl)}>
                        <TelegramIcon />
                        {t('settings_news')}
                    </Button>
                )}
            </ButtonsContainer>
        </DesktopHeaderContainer>
    );
};

export const DesktopPreferencesHeader = () => {
    return (
        <ErrorBoundary fallbackRender={fallbackRenderOver('Failed to display desktop header')}>
            <DesktopPreferencesHeaderPayload />
        </ErrorBoundary>
    );
};
