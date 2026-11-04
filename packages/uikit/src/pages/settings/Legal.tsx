import React, { useMemo } from 'react';
import styled from 'styled-components';
import { InnerBody } from '../../components/Body';
import { ChevronRightIcon } from '../../components/Icon';
import { SettingsItem, SettingsList } from '../../components/settings/SettingsList';
import { SubHeader } from '../../components/SubHeader';
import { useAppSdk } from '../../hooks/appSdk';
import { useTranslation } from '../../hooks/translation';
import { useIsFullWidthMode } from '../../hooks/useIsFullWidthMode';
import {
    DesktopViewHeader,
    DesktopViewHeaderContent,
    DesktopViewPageLayout
} from '../../components/desktop/DesktopViewLayout';
import { ForTargetEnv } from '../../components/shared/TargetEnv';
import { useIsOnIosReview } from '../../hooks/ios';
import { useLegalLinks } from '../../state/legal';

const Icon = styled.span`
    display: flex;
    color: ${props => props.theme.iconTertiary};
`;

export const Legal = React.memo(() => {
    const { t } = useTranslation();
    const sdk = useAppSdk();
    const isProDisplay = useIsFullWidthMode();
    const isOnReview = useIsOnIosReview();
    const { termsLink, privacyLink } = useLegalLinks();

    const items = useMemo<SettingsItem[]>(() => {
        const val = [
            {
                name: t('legal_privacy'),
                icon: (
                    <Icon>
                        <ChevronRightIcon />
                    </Icon>
                ),
                action: () => sdk.openPage(privacyLink)
            }
        ];

        if (!isOnReview) {
            val.unshift({
                name: t('legal_terms'),
                icon: (
                    <Icon>
                        <ChevronRightIcon />
                    </Icon>
                ),
                action: () => sdk.openPage(termsLink)
            });
        }

        return val;
    }, [t, isOnReview, sdk, privacyLink, termsLink]);

    if (isProDisplay) {
        return (
            <DesktopViewPageLayout>
                <ForTargetEnv env="mobile">
                    <DesktopViewHeader>
                        <DesktopViewHeaderContent
                            title={t('legal_header_title')}
                        ></DesktopViewHeaderContent>
                    </DesktopViewHeader>
                </ForTargetEnv>
                <SettingsList items={items} />
            </DesktopViewPageLayout>
        );
    }

    return (
        <>
            <SubHeader title={t('legal_header_title')} />
            <InnerBody>
                <SettingsList items={items} />
            </InnerBody>
        </>
    );
});
Legal.displayName = 'Legal';
