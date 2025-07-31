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
import { useTranslation } from '../../../hooks/translation';
import { useDisclosure } from '../../../hooks/useDisclosure';
import { useProPlans, useProState, useTrialAvailability } from '../../../state/pro';
import { useNotifyError } from '../../../hooks/useNotification';
import { ProTrialStartNotification } from '../../pro/ProTrialStartNotification';
import { hasUsedTrial, IDisplayPlan, isValidSubscription } from '@tonkeeper/core/dist/entries/pro';
import { HideOnReview } from '../../ios/HideOnReview';
import { PromoNotificationCarousel } from '../../pro/PromoNotificationCarousel';
import { ClosePromoIcon } from '../../Icon';
import { useProAuthNotification } from '../../modals/ProAuthNotificationControlled';
import { useNavigate } from '../../../hooks/router/useNavigate';
import { AppRoute, SettingsRoute } from '../../../libs/routes';

interface IProFeaturesNotificationProps {
    isOpen: boolean;
    onClose: () => void;
    onOpenProps?: {
        removeButtonsBlock?: boolean;
    };
}

export const ProFeaturesNotification: FC<IProFeaturesNotificationProps> = props => {
    const { isOpen, onClose, onOpenProps } = props;

    return (
        <NotificationStyled hideButton isOpen={isOpen} handleClose={onClose}>
            {() => <ProFeaturesNotificationContent onOpenProps={onOpenProps} onClose={onClose} />}
        </NotificationStyled>
    );
};

export const ProFeaturesNotificationContent: FC<Omit<IProFeaturesNotificationProps, 'isOpen'>> = ({
    onClose,
    onOpenProps
}) => {
    const formId = useId();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { data: proState } = useProState();
    const { data: isTrialAvailable } = useTrialAvailability();
    const { onOpen: onProAuthOpen } = useProAuthNotification();
    const {
        isOpen: isTrialModalOpen,
        onClose: onTrialModalClose,
        onOpen: onTrialModalOpen
    } = useDisclosure();

    const { data: products, isError, isLoading: isProPlanLoading, refetch } = useProPlans();
    useNotifyError(isError && new Error(t('failed_subscriptions_loading')));

    if (!proState) {
        return null;
    }

    const currentSubscription = proState.current;
    const isFinalTrialAvailable = !hasUsedTrial(currentSubscription) && isTrialAvailable;

    const handleProAuth = () => {
        if (isError) {
            void refetch();
        } else {
            onClose();
            onProAuthOpen();
        }
    };

    const onTrialClose = (confirmed?: boolean) => {
        onTrialModalClose();

        if (confirmed) {
            onClose();
            navigate(AppRoute.settings + SettingsRoute.pro);
        }
    };

    const { removeButtonsBlock } = onOpenProps ?? {};
    const displayPlans = products?.plans ?? [];
    const isButtonsBlockVisible = !removeButtonsBlock && !isValidSubscription(currentSubscription);

    return (
        <ContentWrapper onSubmit={handleSubmit(handleProAuth)} id={formId}>
            <CloseButtonStyled type="button" onClick={onClose}>
                <ClosePromoIcon />
            </CloseButtonStyled>

            <PromoNotificationCarousel />

            {isButtonsBlockVisible && (
                <NotificationFooterPortal>
                    <NotificationFooter>
                        <ButtonsBlockStyled
                            formId={formId}
                            isError={isError}
                            isLoading={isProPlanLoading}
                            displayPlans={displayPlans}
                            onTrial={isFinalTrialAvailable ? onTrialModalOpen : undefined}
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
                    {t(isError ? 'try_again' : 'continue_from')}
                    {!isError && ` ${formattedDisplayPrice} / ${subscriptionPeriod}`}
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
    position: relative;
    padding: 0 0 2rem;
    overflow: hidden;
`;

const NotificationStyled = styled(Notification)`
    max-width: 650px;

    @media (pointer: fine) {
        &:hover {
            [data-swipe-button] {
                color: ${props => props.theme.textSecondary};
            }
        }
    }
`;

const ButtonsBlockStyled = styled(ButtonsBlock)`
    display: flex;
    flex-direction: column;
    gap: 8px;
`;

const CloseButtonStyled = styled.button`
    position: absolute;
    top: 12px;
    right: 12px;
    z-index: 10;
    cursor: pointer;
    opacity: 1;
    transition: opacity 0.3s ease;

    &:hover {
        opacity: 0.7;
    }
`;
