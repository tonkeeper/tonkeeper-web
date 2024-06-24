import { Label2 } from '../../components/Text';
import { SwapMainForm } from '../../components/swap/SwapMainForm';
import { styled } from 'styled-components';
import { Notification } from '../../components/Notification';
import { useSwapMobileNotification } from '../../state/swap/useSwapMobileNotification';
import { ErrorBoundary } from 'react-error-boundary';
import { fallbackRenderOver } from '../../components/Error';
import { SwapSettingsButton } from '../../components/swap/icon-buttons/SwapSettingsButton';
import { SwapRefreshButton } from '../../components/swap/icon-buttons/SwapRefreshButton';
import { useTranslation } from '../../hooks/translation';

const SwapMobileNotification = () => {
    const [isOpen, setIsOpen] = useSwapMobileNotification();

    return (
        <ErrorBoundary fallbackRender={fallbackRenderOver('Failed to display Swap page')}>
            <Notification
                isOpen={isOpen}
                handleClose={() => setIsOpen(false)}
                title={<NotificationHeader />}
            >
                {() => <NotificationContent />}
            </Notification>
        </ErrorBoundary>
    );
};

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
    left: 5rem;
    right: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
`;

const NotificationHeader = () => {
    const { t } = useTranslation();
    return (
        <NotificationHeaderContainer>
            <HeaderButtons>
                <SwapRefreshButton />
                <SwapSettingsButton />
            </HeaderButtons>
            <HeaderLabel>{t('wallet_swap')}</HeaderLabel>
        </NotificationHeaderContainer>
    );
};

const SwapPageWrapper = styled.div`
    overflow-y: auto;
    min-height: calc(var(--app-height) - 7rem);
`;

const NotificationContent = () => {
    return (
        <SwapPageWrapper>
            <SwapMainForm />
        </SwapPageWrapper>
    );
};

export default SwapMobileNotification;
