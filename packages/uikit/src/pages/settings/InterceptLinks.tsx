import { useTranslation } from '../../hooks/translation';
import { fallbackRenderOver } from '../../components/Error';
import { AppRoute } from '../../libs/routes';

import { SubHeader } from '../../components/SubHeader';
import { InnerBody } from '../../components/Body';
import React from 'react';
import { ListBlock, ListItem, ListItemPayload } from '../../components/List';
import styled from 'styled-components';
import { Navigate } from '../../components/shared/Navigate';
import { ErrorBoundary } from '../../components/shared/ErrorBoundary';
import { useAppSdk } from '../../hooks/appSdk';
import { useGlobalPreferences, useMutateGlobalPreferences } from '../../state/global-preferences';
import { InterceptTonLinksConfig } from '@tonkeeper/core/dist/service/globalPreferencesService';
import { CheckIcon } from '../../components/Icon';
import { Body2, Label1 } from '../../components/Text';

const Body2Styled = styled(Body2)`
    color: ${p => p.theme.textSecondary};
`;

const optionsTranslations: Record<InterceptTonLinksConfig, string> = {
    always: 'settings_intercept_links_option_open_extension',
    never: 'settings_intercept_links_option_open_browser',
    ask: 'settings_intercept_links_option_ask'
};

const ListBlockStyled = styled(ListBlock)`
    margin-bottom: 14px;
`;

const ListItemPayloadStyled = styled(ListItemPayload)`
    height: 28px;
    box-sizing: content-box;

    > svg {
        color: ${p => p.theme.accentBlue};
    }
`;

export const InterceptLinksPage = () => {
    const canInterceptLinks = useAppSdk().linksInterceptorAvailable;
    const { t } = useTranslation();
    const { interceptTonLinks } = useGlobalPreferences();
    const { mutate } = useMutateGlobalPreferences();

    const onSelectOption = (value: InterceptTonLinksConfig) => {
        if (value !== interceptTonLinks) {
            mutate({
                interceptTonLinks: value
            });
        }
    };

    if (!canInterceptLinks) {
        return <Navigate to={AppRoute.home} />;
    }

    return (
        <ErrorBoundary fallbackRender={fallbackRenderOver('Failed to display settings')}>
            <SubHeader title={t('settings_intercept_links')} />
            <InnerBody>
                <ListBlockStyled>
                    {Object.entries(optionsTranslations).map(([key, translation]) => (
                        <ListItem
                            hover
                            key={key}
                            onClick={() => onSelectOption(key as InterceptTonLinksConfig)}
                        >
                            <ListItemPayloadStyled>
                                <Label1>{t(translation)}</Label1>
                                {key === interceptTonLinks && <CheckIcon />}
                            </ListItemPayloadStyled>
                        </ListItem>
                    ))}
                </ListBlockStyled>
                <Body2Styled>{t('settings_intercept_links_help_text')}</Body2Styled>
            </InnerBody>
        </ErrorBoundary>
    );
};
