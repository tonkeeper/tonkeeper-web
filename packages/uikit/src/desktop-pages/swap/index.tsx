import {
    DesktopViewHeader,
    DesktopViewPageLayout
} from '../../components/desktop/DesktopViewLayout';
import { Label2 } from '../../components/Text';
import { SwapMainForm } from '../../components/swap/SwapMainForm';
import { SwapProviders } from '../../components/swap/SwapProviders';
import { css, styled } from 'styled-components';
import { useSwapsConfig } from '../../state/swap/useSwapsConfig';
import { useAppSdk, useAppTargetEnv } from '../../hooks/appSdk';
import { useStonfiSwapLink } from '../../state/stonfi';
import { swapFromAsset$, swapToAsset$ } from '../../state/swap/useSwapForm';
import { ErrorBoundary } from 'react-error-boundary';
import { fallbackRenderOver } from '../../components/Error';
import { SwapRefreshButton } from '../../components/swap/icon-buttons/SwapRefreshButton';
import { SwapSettingsButton } from '../../components/swap/icon-buttons/SwapSettingsButton';
import { useTranslation } from '../../hooks/translation';
import { HideOnReview } from '../../components/ios/HideOnReview';
import { Navigate } from '../../components/shared/Navigate';
import { NotForTargetEnv } from '../../components/shared/TargetEnv';

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
    display: flex;
    gap: 0.5rem;
    max-width: 900px;
    margin: 0 auto;

    > * {
        width: ${p => (p.theme.proDisplayType === 'desktop' ? 'calc(50% - 4px)' : '100%')};
    }
`;

const DesktopSwapPageContent = () => {
    const { t } = useTranslation();
    const { isSwapsEnabled } = useSwapsConfig();
    const sdk = useAppSdk();
    const swapLink = useStonfiSwapLink(swapFromAsset$.value.address, swapToAsset$.value.address);
    const env = useAppTargetEnv();

    if (!isSwapsEnabled) {
        sdk.openPage(swapLink);
        return <Navigate to=".." replace={true} />;
    }

    return (
        <SwapPageWrapper>
            <DesktopViewHeader backButton={env === 'mobile'}>
                <Label2>{t('wallet_swap')}</Label2>
                <HeaderButtons>
                    <SwapRefreshButton />
                    <SwapSettingsButton />
                </HeaderButtons>
            </DesktopViewHeader>
            <ContentWrapper>
                <SwapMainForm />
                <NotForTargetEnv env="mobile">
                    <div>
                        <SwapProviders />
                    </div>
                </NotForTargetEnv>
            </ContentWrapper>
        </SwapPageWrapper>
    );
};

export const DesktopSwapPage = () => {
    return (
        <HideOnReview>
            <ErrorBoundary fallbackRender={fallbackRenderOver('Failed to display Swaps page')}>
                <DesktopSwapPageContent />
            </ErrorBoundary>
        </HideOnReview>
    );
};
