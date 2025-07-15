import { FC, useId } from 'react';
import { styled } from 'styled-components';
import { hasUsedTrial } from '@tonkeeper/core/dist/entries/pro';

import { PurchaseSubscriptionScreens } from '../../enums/pro';
import { useProPlans, useProState } from '../../state/pro';
import { adaptPlansToViewModel } from '../../libs/pro';
import { useTranslation } from '../../hooks/translation';
import { usePurchaseControlScreen } from '../../hooks/pro/usePurchaseControlScreen';
import { useDisclosure } from '../../hooks/useDisclosure';
import { useNotifyError } from '../../hooks/useNotification';
import { handleSubmit } from '../../libs/form';
import { ProTrialStartNotification } from './ProTrialStartNotification';
import { ProSubscriptionHeader } from './ProSubscriptionHeader';
import { ProPricesList } from './ProPricesList';
import { ProFeaturesList } from './ProFeaturesList';
import { NotificationBlock, NotificationFooter, NotificationFooterPortal } from '../Notification';
import { Button } from '../fields/Button';
import { Body2, Label2 } from '../Text';
import { HideOnReview } from '../ios/HideOnReview';
import { ChevronRightIcon } from '../Icon';

export const ProPromoScreen = () => {
    const formId = useId();
    const { data } = useProState();
    const { onClose, goTo } = usePurchaseControlScreen();
    const {
        isOpen: isTrialModalOpen,
        onClose: onTrialModalClose,
        onOpen: onTrialModalOpen
    } = useDisclosure();

    const { data: products, error, isError, isLoading, refetch } = useProPlans();
    useNotifyError(error);

    if (!data) {
        return null;
    }

    const handlePurchasePro = () => {
        if (isError) {
            void refetch();
        } else {
            goTo(PurchaseSubscriptionScreens.ACCOUNTS);
        }
    };

    const onTrialClose = (confirmed?: boolean) => {
        onTrialModalClose();
        if (confirmed) {
            onClose();
        }
    };

    return (
        <ContentWrapper onSubmit={handleSubmit(handlePurchasePro)} id={formId}>
            <ProSubscriptionHeader />
            <ProPricesList displayPlans={adaptPlansToViewModel(products)} />
            <ProFeaturesList headerOptions={{ rightElement: null }} />

            <NotificationFooterPortal>
                <NotificationFooter>
                    <ButtonsBlockStyled
                        formId={formId}
                        isError={isError}
                        isLoading={isLoading}
                        onTrial={hasUsedTrial(data.current) ? undefined : onTrialModalOpen}
                    />
                </NotificationFooter>
            </NotificationFooterPortal>
            <ProTrialStartNotification isOpen={isTrialModalOpen} onClose={onTrialClose} />
        </ContentWrapper>
    );
};

interface IButtonBlock {
    formId: string;
    onTrial?: () => void;
    className?: string;
    isError: boolean;
    isLoading: boolean;
}

const ButtonsBlock: FC<IButtonBlock> = props => {
    const { formId, onTrial, className, isError, isLoading } = props;
    const { t } = useTranslation();

    return (
        <div className={className}>
            <Button primary fullWidth size="large" type="submit" form={formId} loading={isLoading}>
                <Label2>{t(isError ? 'try_again' : 'get_tonkeeper_pro')}</Label2>
            </Button>
            <HideOnReview>
                {onTrial && (
                    <ButtonStyled fullWidth secondary onClick={onTrial}>
                        <Body2>{t('start_free_trial')}</Body2>
                        <ChevronRightIcon />
                    </ButtonStyled>
                )}
            </HideOnReview>
        </div>
    );
};

const ContentWrapper = styled(NotificationBlock)`
    padding-top: 1rem;
`;

const ButtonStyled = styled(Button)`
    color: ${p => p.theme.textSecondary};
    background-color: transparent;
`;

const ButtonsBlockStyled = styled(ButtonsBlock)`
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 100%;
`;
