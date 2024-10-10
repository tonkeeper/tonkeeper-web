import { FC } from 'react';
import { InnerBody } from '../../components/Body';
import { SubHeader } from '../../components/SubHeader';
import { Label2 } from '../../components/Text';
import { useTranslation } from '../../hooks/translation';
import { useActiveAccount } from '../../state/wallet';
import { Navigate } from 'react-router-dom';
import {
    DesktopViewHeader,
    DesktopViewPageLayout
} from '../../components/desktop/DesktopViewLayout';
import { useIsFullWidthMode } from '../../hooks/useIsFullWidthMode';
import styled from 'styled-components';
import { BatteryInfoHeading } from '../../components/settings/battery/BatteryInfoHeading';

export const BatteryPage = () => {
    const { t } = useTranslation();
    const account = useActiveAccount();
    const isFullWidth = useIsFullWidthMode();

    if (account.type !== 'mnemonic') {
        return <Navigate to="../" />;
    }

    if (isFullWidth) {
        return (
            <DesktopViewPageLayout>
                <DesktopViewHeader backButton borderBottom>
                    <Label2>{t('battery_title')}</Label2>
                </DesktopViewHeader>
                <BatteryPageContent />
            </DesktopViewPageLayout>
        );
    }

    return (
        <>
            <SubHeader title={t('battery_title')} />
            <InnerBody>
                <BatteryPageContent />
            </InnerBody>
        </>
    );
};

const ContentWrapper = styled.div`
    max-width: 368px;
    margin: 0 auto;
`;

const HeadingBlock = styled.div`
    padding: 32px 0;
`;

export const BatteryPageContent: FC = () => {
    return (
        <ContentWrapper>
            <HeadingBlock>
                <BatteryInfoHeading />
            </HeadingBlock>
        </ContentWrapper>
    );
};
