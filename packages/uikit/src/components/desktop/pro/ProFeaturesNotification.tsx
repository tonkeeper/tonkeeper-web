import { Notification } from '../../Notification';
import { FC } from 'react';
import { createGlobalStyle, styled } from 'styled-components';
import { Body2, Label1, Label2 } from '../../Text';
import { useTranslation } from '../../../hooks/translation';
import { Button } from '../../fields/Button';
import { ProDashboardIcon, ProMultisendIcon } from './Icons';
import { ProNotification } from '../../pro/ProNotification';
import { ProTrialStartNotification } from '../../pro/ProTrialStartNotification';
import { useDisclosure } from '../../../hooks/useDisclosure';
import { useProState } from '../../../state/pro';

const WrapperStyles = createGlobalStyle`
      .pro-features-notification {
        max-width: 768px;
      }
    `;

export const ProFeaturesNotification: FC<{ isOpen: boolean; onClose: () => void }> = ({
    isOpen,
    onClose
}) => {
    return (
        <>
            <WrapperStyles />
            <Notification
                isOpen={isOpen}
                handleClose={onClose}
                wrapperClassName="pro-features-notification"
            >
                {() => <ProFeaturesNotificationContent onClose={onClose} />}
            </Notification>
        </>
    );
};

const ContentWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 40px;
`;

const ProImage = styled.img`
    width: 78px;
    height: 78px;
    margin-bottom: 12px;
`;

const Title = styled(Label1)`
    margin-bottom: 4px;
`;

const ProDescription = styled(Body2)`
    color: ${p => p.theme.textSecondary};
    text-align: center;
    margin-bottom: 8px;
    max-width: 576px;
    display: block;
`;

const FeatureBlock = styled.div`
    padding-top: 48px;
    display: flex;
    flex-direction: column;
    text-align: center;
    align-items: center;

    > * {
        display: block;
    }
`;

const FeatureIconContainer = styled.div`
    color: ${p => p.theme.accentBlue};
    margin-bottom: 12px;
`;

const FeatureDescription = styled(Body2)`
    margin-top: 4px;
    margin-bottom: 26px;
    max-width: 576px;
    display: block;
    color: ${p => p.theme.textSecondary};
`;

const FeatureDescriptionLast = styled(FeatureDescription)`
    margin-top: 0;
`;

const FeatureImage = styled.img`
    width: 624px;
    border-radius: ${p => p.theme.corner2xSmall};
`;

export const ProFeaturesNotificationContent: FC<{ onClose: () => void }> = ({ onClose }) => {
    const { t } = useTranslation();
    const {
        isOpen: isTrialModalOpen,
        onClose: onTrialModalClose,
        onOpen: onTrialModalOpen
    } = useDisclosure();
    const { data } = useProState();
    const {
        isOpen: isPurchaseModalOpen,
        onOpen: onPurchaseModalOpen,
        onClose: onPurchaseModalClose
    } = useDisclosure();

    if (!data) {
        return null;
    }

    const onTrialClose = (confirmed?: boolean) => {
        onTrialModalClose();
        if (confirmed) {
            onClose();
        }
    };

    const onPurchaseClose = (confirmed?: boolean) => {
        onPurchaseModalClose();
        if (confirmed) {
            onClose();
        }
    };

    return (
        <ContentWrapper>
            <ProImage src="https://tonkeeper.com/assets/icon.ico" />
            <Title>{t('tonkeeper_pro')}</Title>
            <ProDescription>{t('pro_features_description')}</ProDescription>
            <ButtonsBlockStyled
                onBuy={onPurchaseModalOpen}
                onTrial={data.subscription.usedTrial ? undefined : onTrialModalOpen}
            />
            <FeatureBlock>
                <FeatureIconContainer>
                    <ProDashboardIcon />
                </FeatureIconContainer>
                <Label2>{t('pro_features_dashboard')}</Label2>
                <FeatureDescription>{t('pro_features_dashboard_description')}</FeatureDescription>
                <FeatureImage src="https://wallet.tonkeeper.com/img/pro/dashboard.webp" />
            </FeatureBlock>
            <FeatureBlock>
                <FeatureIconContainer>
                    <ProMultisendIcon />
                </FeatureIconContainer>
                <Label2>{t('pro_feature_multisend')}</Label2>
                <FeatureDescription>{t('pro_feature_multisend_description')}</FeatureDescription>
                <FeatureImage src="https://wallet.tonkeeper.com/img/pro/multisend.webp" />
            </FeatureBlock>
            <FeatureBlock>
                <FeatureDescriptionLast>{t('pro_other_features')}</FeatureDescriptionLast>
            </FeatureBlock>
            <ButtonsBlockStyled
                onBuy={onPurchaseModalOpen}
                onTrial={data.subscription.usedTrial ? undefined : onTrialModalOpen}
            />
            <ProNotification isOpen={isPurchaseModalOpen} onClose={onPurchaseClose} />
            <ProTrialStartNotification isOpen={isTrialModalOpen} onClose={onTrialClose} />
        </ContentWrapper>
    );
};

const ButtonsContainer = styled.div`
    display: flex;
    padding: 1rem;
    gap: 0.5rem;
`;

const ButtonsBlock: FC<{ className?: string; onBuy: () => void; onTrial?: () => void }> = ({
    className,
    onBuy,
    onTrial
}) => {
    const { t } = useTranslation();
    return (
        <ButtonsContainer className={className}>
            {onTrial && (
                <Button secondary onClick={onTrial}>
                    {t('pro_banner_start_trial')}
                </Button>
            )}
            <Button primary onClick={onBuy}>
                {t('pro_banner_buy')}
            </Button>
        </ButtonsContainer>
    );
};

const ButtonsBlockStyled = styled(ButtonsBlock)`
    margin-bottom: 1rem;
`;
