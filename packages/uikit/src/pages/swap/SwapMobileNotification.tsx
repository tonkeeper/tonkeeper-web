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

const SwapMobileNotification = () => {
    const [isOpen, setIsOpen] = useSwapMobileNotification();
    const { t } = useTranslation();

    return (
        <IfFeatureEnabled feature={FLAGGED_FEATURE.SWAPS}>
            <ErrorBoundary fallbackRender={fallbackRenderOver('Failed to display Swap page')}>
                <Notification
                    isOpen={isOpen}
                    handleClose={() => setIsOpen(false)}
                    title={t('wallet_swap')}
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
