import React, { useMemo } from 'react';
import styled from 'styled-components';
import { InnerBody } from '../../components/Body';
import { ChevronRightIcon } from '../../components/Icon';
import { SettingsItem, SettingsList } from '../../components/settings/SettingsList';
import { SubHeader } from '../../components/SubHeader';
import { H3 } from '../../components/Text';
import { useAppSdk } from '../../hooks/appSdk';
import { useTranslation } from '../../hooks/translation';

const Icon = styled.span`
    display: flex;
    color: ${props => props.theme.iconTertiary};
`;

const Title = styled(H3)`
    margin: 14px 0;
`;

export const Legal = React.memo(() => {
    const { t } = useTranslation();
    const sdk = useAppSdk();
    const items = useMemo<SettingsItem[]>(() => {
        return [
            {
                name: t('legal_terms'),
                icon: (
                    <Icon>
                        <ChevronRightIcon />
                    </Icon>
                ),
                action: () => sdk.openPage('https://tonkeeper.com/terms/')
            },
            {
                name: t('legal_privacy'),
                icon: (
                    <Icon>
                        <ChevronRightIcon />
                    </Icon>
                ),
                action: () => sdk.openPage('https://tonkeeper.com/privacy/')
            }
        ];
    }, [t]);

    const licenses = useMemo<SettingsItem[]>(() => {
        return [
            {
                name: t('legal_font_license'),
                icon: (
                    <Icon>
                        <ChevronRightIcon />
                    </Icon>
                ),
                action: () => sdk.openPage('https://tonkeeper.com/privacy/') // TODO: Update link
            }
        ];
    }, [t]);

    return (
        <>
            <SubHeader title={t('legal_header_title')} />
            <InnerBody>
                <SettingsList items={items} />
                <Title>{t('legal_licenses_title')}</Title>
                <SettingsList items={licenses} />
            </InnerBody>
        </>
    );
});
Legal.displayName = 'Legal';
