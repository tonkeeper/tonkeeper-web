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
import { ChevronRightIcon } from '../../Icon';
import { handleSubmit } from '../../../libs/form';
import { ProPricesList } from '../../pro/ProPricesList';
import { adaptPlansToViewModel } from '../../../libs/pro';
import { ProFeaturesList } from '../../pro/ProFeaturesList';
import { useTranslation } from '../../../hooks/translation';
import { useDisclosure } from '../../../hooks/useDisclosure';
import { useProPlans, useProState } from '../../../state/pro';
import { AppRoute, SettingsRoute } from '../../../libs/routes';
import { useNavigate } from '../../../hooks/router/useNavigate';
import { useNotifyError } from '../../../hooks/useNotification';
import { ProSubscriptionHeader } from '../../pro/ProSubscriptionHeader';
import { ProTrialStartNotification } from '../../pro/ProTrialStartNotification';
import { hasUsedTrial, isValidSubscription } from '@tonkeeper/core/dist/entries/pro';
import { HideOnReview } from '../../ios/HideOnReview';

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
    const navigate = useNavigate();
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
            navigate(AppRoute.settings + SettingsRoute.pro);
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
            {!isValidSubscription(data.current) && (
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
    overflow: hidden;
`;

const NotificationStyled = styled(Notification)`
    max-width: 768px;
`;

const ButtonStyled = styled(Button)`
    color: ${p => p.theme.textSecondary};
    background-color: transparent;
`;

const ButtonsBlockStyled = styled(ButtonsBlock)`
    display: flex;
    flex-direction: column;
    gap: 1rem;
`;
