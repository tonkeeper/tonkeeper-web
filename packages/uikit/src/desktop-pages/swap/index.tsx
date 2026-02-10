import {
    DesktopViewHeader,
    DesktopViewHeaderContent,
    DesktopViewPageLayout
} from '../../components/desktop/DesktopViewLayout';
import { SwapMainForm } from '../../components/swap/SwapMainForm';
import { css, styled } from 'styled-components';
import { useSwapsConfig } from '../../state/swap/useSwapsConfig';
import { useAppSdk } from '../../hooks/appSdk';
import { useStonfiSwapLink } from '../../state/stonfi';
import { swapFromAsset$, swapToAsset$ } from '../../state/swap/useSwapForm';
import { fallbackRenderOver } from '../../components/Error';
import { SwapRefreshButton } from '../../components/swap/icon-buttons/SwapRefreshButton';
import { useSwapStreamEffect } from '../../state/swap/useSwapStreamEffect';
import { useTranslation } from '../../hooks/translation';
import { HideOnReview } from '../../components/ios/HideOnReview';
import { Navigate } from '../../components/shared/Navigate';
import { ErrorBoundary } from '../../components/shared/ErrorBoundary';
import { IfFeatureEnabled } from '../../components/shared/IfFeatureEnabled';
import { FLAGGED_FEATURE } from '../../state/tonendpoint';

const SwapPageWrapper = styled(DesktopViewPageLayout)`
    overflow-y: auto;

    ${p =>
        p.theme.proDisplayType === 'desktop' &&
        css`
            min-width: 580px;
        `}
`;

const HeaderButtons = styled.div`
    margin-left: auto;
    display: flex;

    > * {
        color: ${p => p.theme.iconSecondary};
        padding: 10px;
    }
`;

const ContentWrapper = styled.div`
    padding: 0 1rem;

    > * {
        max-width: 450px;
    }
`;

const DesktopSwapPageContent = () => {
    const { t } = useTranslation();
    const { isSwapsEnabled } = useSwapsConfig();
    const sdk = useAppSdk();
    const swapLink = useStonfiSwapLink(swapFromAsset$.value.address, swapToAsset$.value.address);

    useSwapStreamEffect();

    if (!isSwapsEnabled) {
        sdk.openPage(swapLink);
        return <Navigate to=".." replace={true} />;
    }

    return (
        <SwapPageWrapper mobileContentPaddingTop>
            <DesktopViewHeader>
                <DesktopViewHeaderContent
                    title={t('wallet_swap')}
                    right={
                        <HeaderButtons>
                            <SwapRefreshButton />
                        </HeaderButtons>
                    }
                />
            </DesktopViewHeader>
            <ContentWrapper>
                <SwapMainForm />
            </ContentWrapper>
        </SwapPageWrapper>
    );
};

export const DesktopSwapPage = () => {
    return (
        <HideOnReview>
            <IfFeatureEnabled feature={FLAGGED_FEATURE.SWAPS}>
                <ErrorBoundary fallbackRender={fallbackRenderOver('Failed to display Swaps page')}>
                    <DesktopSwapPageContent />
                </ErrorBoundary>
            </IfFeatureEnabled>
        </HideOnReview>
    );
};
