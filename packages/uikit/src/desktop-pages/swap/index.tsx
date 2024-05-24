import { DesktopViewHeader } from '../../components/desktop/DesktopViewLayout';
import { Label2 } from '../../components/Text';
import { SwapMainForm } from '../../components/swap/SwapMainForm';
import { SwapProviders } from '../../components/swap/SwapProviders';
import { styled } from 'styled-components';
import { useSwapsConfig } from '../../state/swap/useSwapsConfig';
import { useAppSdk } from '../../hooks/appSdk';
import { useStonfiSwapLink } from '../../state/stonfi';
import { swapFromAsset$, swapToAsset$ } from '../../state/swap/useSwapForm';
import { Navigate } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import { fallbackRenderOver } from '../../components/Error';
import { SwapRefreshButton } from '../../components/swap/icon-buttons/SwapRefreshButton';
import { SwapSettingsButton } from '../../components/swap/icon-buttons/SwapSettingsButton';

const SwapPageWrapper = styled.div`
    overflow-y: auto;
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
`;

const DesktopSwapPageContent = () => {
    const { isSwapsEnabled } = useSwapsConfig();
    const sdk = useAppSdk();
    const swapLink = useStonfiSwapLink(swapFromAsset$.value.address, swapToAsset$.value.address);

    if (!isSwapsEnabled) {
        sdk.openPage(swapLink);
        return <Navigate to=".." replace={true} />;
    }

    return (
        <SwapPageWrapper>
            <DesktopViewHeader backButton={false}>
                <Label2>Swap</Label2>
                <HeaderButtons>
                    <SwapRefreshButton />
                    <SwapSettingsButton />
                </HeaderButtons>
            </DesktopViewHeader>
            <ContentWrapper>
                <SwapMainForm />
                <SwapProviders />
            </ContentWrapper>
        </SwapPageWrapper>
    );
};

export const DesktopSwapPage = () => {
    return (
        <ErrorBoundary fallbackRender={fallbackRenderOver('Failed to display Swaps page')}>
            <DesktopSwapPageContent />
        </ErrorBoundary>
    );
};
