import { FC, useId } from 'react';
import { styled } from 'styled-components';

import {
    Notification,
    NotificationBlock,
    NotificationFooter,
    NotificationFooterPortal
} from '../../Notification';
import { Body2, Label2 } from '../../Text';
import { Button } from '../../fields/Button';
import { handleSubmit } from '../../../libs/form';
import { adaptPlansToViewModel } from '../../../libs/pro';
import { useTranslation } from '../../../hooks/translation';
import { useDisclosure } from '../../../hooks/useDisclosure';
import { useProPlans, useProState } from '../../../state/pro';
import { useNotifyError } from '../../../hooks/useNotification';
import { ProTrialStartNotification } from '../../pro/ProTrialStartNotification';
import { hasUsedTrial, IDisplayPlan, isValidSubscription } from '@tonkeeper/core/dist/entries/pro';
import { HideOnReview } from '../../ios/HideOnReview';
import { useProPurchaseNotification } from '../../modals/ProPurchaseNotificationControlled';

interface IProFeaturesNotificationProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ProFeaturesNotification: FC<IProFeaturesNotificationProps> = ({ isOpen, onClose }) => (
    <NotificationStyled isOpen={isOpen} handleClose={onClose}>
        {() => <ProFeaturesNotificationContent onClose={onClose} />}
    </NotificationStyled>
);

export const ProFeaturesNotificationContent: FC<Pick<IProFeaturesNotificationProps, 'onClose'>> = ({
    onClose
}) => {
    const formId = useId();
    const { data } = useProState();
    const { onOpen: onProPurchaseOpen } = useProPurchaseNotification();
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
            onClose();
            onProPurchaseOpen();
        }
    };

    const onTrialClose = (confirmed?: boolean) => {
        onTrialModalClose();
        if (confirmed) {
            onClose();
        }
    };

    const displayPlans = adaptPlansToViewModel(products);

    return (
        <ContentWrapper onSubmit={handleSubmit(handlePurchasePro)} id={formId}>
            {!isValidSubscription(data.current) && (
                <NotificationFooterPortal>
                    <NotificationFooter>
                        <ButtonsBlockStyled
                            formId={formId}
                            isError={isError}
                            isLoading={isLoading}
                            displayPlans={displayPlans}
                            onTrial={hasUsedTrial(data.current) ? undefined : onTrialModalOpen}
                        />
                    </NotificationFooter>
                </NotificationFooterPortal>
            )}
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
    displayPlans: IDisplayPlan[];
}

const ButtonsBlock: FC<IButtonBlock> = props => {
    const { formId, onTrial, className, isError, isLoading, displayPlans } = props;
    const { t } = useTranslation();

    const filteredPlan = displayPlans?.filter(p => p.formattedDisplayPrice !== '-')?.[0];

    const { formattedDisplayPrice, subscriptionPeriod } = filteredPlan || {};

    return (
        <div className={className}>
            <Button primary fullWidth size="large" type="submit" form={formId} loading={isLoading}>
                <Label2>
                    {t(
                        isError
                            ? 'try_again'
                            : `continue_from ${formattedDisplayPrice} / ${subscriptionPeriod}`
                    )}
                </Label2>
            </Button>
            <HideOnReview>
                {onTrial && (
                    <Button fullWidth secondary onClick={onTrial}>
                        <Body2>{t('start_free_trial')}</Body2>
                    </Button>
                )}
            </HideOnReview>
        </div>
    );
};

const ContentWrapper = styled(NotificationBlock)`
    padding: 1rem 0 2rem;
    overflow: hidden;
`;

const NotificationStyled = styled(Notification)`
    max-width: 768px;
`;

const ButtonsBlockStyled = styled(ButtonsBlock)`
    display: flex;
    flex-direction: column;
    gap: 1rem;
`;
