import styled from 'styled-components';
import { useTranslation } from '../../../hooks/translation';
import { fallbackRenderOver } from '../../Error';
import { GlobeIcon, TelegramIcon } from '../../Icon';
import { Button } from '../../fields/Button';
import { DesktopHeaderContainer } from './DesktopHeaderElements';

import { useAppSdk } from '../../../hooks/appSdk';
import { useSupport } from '../../../state/pro';
import { useActiveConfig } from '../../../state/wallet';
import { ErrorBoundary } from '../../shared/ErrorBoundary';

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
    const sdk = useAppSdk();
    const config = useActiveConfig();
    const { data: support, isLoading: isSupportLoading } = useSupport();

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
                    <Button
                        loading={isSupportLoading}
                        size="small"
                        onClick={() => sdk.openPage(support.url ?? support.url)}
                    >
                        <TelegramIcon />
                        {t(support.isPriority ? 'priority_support' : 'settings_support')}
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
