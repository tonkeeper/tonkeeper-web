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
import { hasUsedTrial, IDisplayPlan } from '@tonkeeper/core/dist/entries/pro';
import { HideOnReview } from '../../ios/HideOnReview';
import { PromoNotificationCarousel } from '../../pro/PromoNotificationCarousel';
import { ClosePromoIcon } from '../../Icon';
import { FeatureSlideNames } from '../../../enums/pro';
import { useProAuthNotification } from '../../modals/ProAuthNotificationControlled';

interface IProFeaturesNotificationProps {
    isOpen: boolean;
    onClose: () => void;
    initialSlideName?: FeatureSlideNames;
}

export const ProFeaturesNotification: FC<IProFeaturesNotificationProps> = props => {
    const { isOpen, onClose, initialSlideName } = props;

    return (
        <NotificationStyled hideButton isOpen={isOpen} handleClose={onClose}>
            {() => (
                <ProFeaturesNotificationContent
                    onClose={onClose}
                    initialSlideName={initialSlideName}
                />
            )}
        </NotificationStyled>
    );
};

export const ProFeaturesNotificationContent: FC<Omit<IProFeaturesNotificationProps, 'isOpen'>> = ({
    onClose,
    initialSlideName
}) => {
    const formId = useId();
    const { t } = useTranslation();
    const { data } = useProState();
    const { onOpen: onProAuthOpen } = useProAuthNotification();
    const {
        isOpen: isTrialModalOpen,
        onClose: onTrialModalClose,
        onOpen: onTrialModalOpen
    } = useDisclosure();

    const { data: products, isError, isLoading, refetch } = useProPlans();
    useNotifyError(isError && new Error(t('failed_subscriptions_loading')));

    if (!data) {
        return null;
    }

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
        }
    };

    const displayPlans = adaptPlansToViewModel(products);

    return (
        <ContentWrapper onSubmit={handleSubmit(handleProAuth)} id={formId}>
            <CloseButtonStyled type="button" onClick={onClose}>
                <ClosePromoIcon />
            </CloseButtonStyled>

            <PromoNotificationCarousel initialSlideName={initialSlideName} />
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
    gap: 1rem;
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
