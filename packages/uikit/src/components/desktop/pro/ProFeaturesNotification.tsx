import { FC, useEffect } from 'react';
import { styled } from 'styled-components';

import { useTranslation } from '../../../hooks/translation';
import { useDisclosure } from '../../../hooks/useDisclosure';
import { useFreeProAccessAvailable, useProState } from '../../../state/pro';
import { Notification, NotificationFooter, NotificationFooterPortal } from '../../Notification';
import { Body2, Label2 } from '../../Text';
import { Button } from '../../fields/Button';
import { ProTrialStartNotification } from '../../pro/ProTrialStartNotification';
import { HideOnReview } from '../../ios/HideOnReview';
import { ProFreeAccessContent } from '../../pro/ProFreeAccess';
import { ChevronRightIcon } from '../../Icon';
import { ProFeaturesList } from '../../pro/ProFeaturesList';
import { ProPricesList } from '../../pro/ProPricesList';
import { ProSubscriptionHeader } from '../../pro/ProSubscriptionHeader';
import { AppRoute, SettingsRoute } from '../../../libs/routes';
import { useNavigate } from '../../../hooks/router/useNavigate';
import { useGetAllProductsInfo } from '../../../hooks/pro/useGetAllProductsInfo';
import { useAppSdk } from '../../../hooks/appSdk';
import { AppKey } from '@tonkeeper/core/dist/Keys';

const NotificationStyled = styled(Notification)`
    max-width: 768px;
`;

interface IProFeaturesNotificationProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ProFeaturesNotification: FC<IProFeaturesNotificationProps> = ({ isOpen, onClose }) => {
    const isFreeSubscriptionAvailable = useFreeProAccessAvailable();

    if (isFreeSubscriptionAvailable) {
        return (
            <HideOnReview>
                <Notification isOpen={isOpen} handleClose={onClose}>
                    {() => (
                        <ProFreeAccessContent
                            access={isFreeSubscriptionAvailable}
                            onSubmit={onClose}
                        />
                    )}
                </Notification>
            </HideOnReview>
        );
    }

    return (
        <HideOnReview>
            <NotificationStyled isOpen={isOpen} handleClose={onClose}>
                {() => <ProFeaturesNotificationContent onClose={onClose} />}
            </NotificationStyled>
        </HideOnReview>
    );
};

const ContentWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding-top: 1rem;
    overflow: hidden;
`;

type ProFeaturesNotificationContentProps = Pick<IProFeaturesNotificationProps, 'onClose'>;
export const ProFeaturesNotificationContent: FC<ProFeaturesNotificationContentProps> = ({
    onClose
}) => {
    const sdk = useAppSdk();
    const { data } = useProState();
    const products = useGetAllProductsInfo();
    const navigate = useNavigate();
    const {
        isOpen: isTrialModalOpen,
        onClose: onTrialModalClose,
        onOpen: onTrialModalOpen
    } = useDisclosure();

    useEffect(() => {
        void sdk.storage.set(AppKey.PRO_HAS_PROMO_BEEN_SHOWN, true);
    }, []);

    if (!data) {
        return null;
    }

    const handlePurchaseClick = () => {
        onClose();
        navigate(AppRoute.settings + SettingsRoute.pro);
    };

    const onTrialClose = (confirmed?: boolean) => {
        onTrialModalClose();
        if (confirmed) {
            onClose();
        }
    };

    return (
        <ContentWrapper>
            <ProSubscriptionHeader />
            <ProPricesList products={products} />
            <ProFeaturesList />
            <NotificationFooterPortal>
                <NotificationFooter>
                    <ButtonsBlockStyled
                        onBuy={handlePurchaseClick}
                        onTrial={data.subscription.usedTrial ? undefined : onTrialModalOpen}
                    />
                </NotificationFooter>
            </NotificationFooterPortal>
            <ProTrialStartNotification isOpen={isTrialModalOpen} onClose={onTrialClose} />
        </ContentWrapper>
    );
};

const ButtonStyled = styled(Button)`
    color: ${p => p.theme.textSecondary};
    background-color: transparent;
`;

interface IButtonBlock {
    onBuy: () => void;
    onTrial?: () => void;
    className?: string;
}

const ButtonsBlock: FC<IButtonBlock> = props => {
    const { onBuy, onTrial, className } = props;
    const { t } = useTranslation();

    return (
        <div className={className}>
            <Button size="large" fullWidth primary onClick={onBuy}>
                <Label2>{t('get_tonkeeper_pro')}</Label2>
            </Button>
            {onTrial && (
                <ButtonStyled fullWidth secondary onClick={onTrial}>
                    <Body2>{t('start_free_trial')}</Body2>
                    <ChevronRightIcon />
                </ButtonStyled>
            )}
        </div>
    );
};

const ButtonsBlockStyled = styled(ButtonsBlock)`
    display: flex;
    flex-direction: column;
    gap: 1rem;
`;
