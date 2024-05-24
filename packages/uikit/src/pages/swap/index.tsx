import { styled } from 'styled-components';
import { SwapMainForm } from '../../components/swap/SwapMainForm';
import { RefreshIcon, SlidersIcon } from '../../components/Icon';
import { IconButton } from '../../components/fields/IconButton';
import { Label2 } from '../../components/Text';
import { DesktopViewHeader } from '../../components/desktop/DesktopViewLayout';
import { useCalculatedSwap } from '../../state/swap/useCalculatedSwap';
import { SwapProviders } from '../../components/swap/SwapProviders';
import { useSwapsConfig } from '../../state/swap/useSwapsConfig';
import { useAppSdk } from '../../hooks/appSdk';
import { useStonfiSwapLink } from '../../state/stonfi';
import { swapFromAsset$, swapToAsset$ } from '../../state/swap/useSwapForm';
import { Navigate } from 'react-router-dom';

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

const SwapPage = () => {
    const { refetch } = useCalculatedSwap();
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
                    <IconButton transparent onClick={() => refetch()}>
                        <RefreshIcon />
                    </IconButton>
                    <IconButton transparent>
                        <SlidersIcon />
                    </IconButton>
                </HeaderButtons>
            </DesktopViewHeader>
            <ContentWrapper>
                <SwapMainForm />
                <SwapProviders />
            </ContentWrapper>
        </SwapPageWrapper>
    );
};

export default SwapPage;
