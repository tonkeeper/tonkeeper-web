import { SwapMainForm } from '../../components/swap/SwapMainForm';
import { styled } from 'styled-components';
import { Notification } from '../../components/Notification';
import { useSwapMobileNotification } from '../../state/swap/useSwapMobileNotification';
import { fallbackRenderOver } from '../../components/Error';
import { useSwapStreamEffect } from '../../state/swap/useSwapStreamEffect';
import { useTranslation } from '../../hooks/translation';
import { ErrorBoundary } from '../../components/shared/ErrorBoundary';
import { IfFeatureEnabled } from '../../components/shared/IfFeatureEnabled';
import { FLAGGED_FEATURE } from '../../state/tonendpoint';
import { SwapSettingsButton } from '../../components/swap/SwapSettingsButton';
import { Label2 } from '../../components/Text';

const NotificationHeaderContainer = styled.div`
    position: relative;
`;

const HeaderButtons = styled.div`
    display: flex;
`;

const HeaderLabel = styled(Label2)`
    position: absolute;
    top: 0;
    bottom: 0;
    left: 3rem;
    right: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
`;

const NotificationHeader = () => {
    const { t } = useTranslation();
    return (
        <NotificationHeaderContainer>
            <HeaderButtons>
                <SwapSettingsButton />
            </HeaderButtons>
            <HeaderLabel>{t('wallet_swap')}</HeaderLabel>
        </NotificationHeaderContainer>
    );
};

const SwapMobileNotification = () => {
    const [isOpen, setIsOpen] = useSwapMobileNotification();

    return (
        <IfFeatureEnabled feature={FLAGGED_FEATURE.SWAPS}>
            <ErrorBoundary fallbackRender={fallbackRenderOver('Failed to display Swap page')}>
                <Notification
                    isOpen={isOpen}
                    handleClose={() => setIsOpen(false)}
                    title={<NotificationHeader />}
                >
                    {() => <NotificationContent />}
                </Notification>
            </ErrorBoundary>
        </IfFeatureEnabled>
    );
};

const SwapPageWrapper = styled.div`
    overflow-y: auto;
    min-height: calc(var(--app-height) - 7rem);
`;

const NotificationContent = () => {
    useSwapStreamEffect();

    return (
        <SwapPageWrapper>
            <SwapMainForm />
        </SwapPageWrapper>
    );
};

export default SwapMobileNotification;
