import React, { FC, useEffect, useState } from 'react';
import { css, styled } from 'styled-components';
import { useTranslation } from '../../../hooks/translation';
import { useDisclosure } from '../../../hooks/useDisclosure';
import { useProSubscription, useProSubscriptionPurchase } from '../../../state/pro';
import { Notification } from '../../Notification';
import { Body2, Body3, Label1, Label2 } from '../../Text';
import { Button } from '../../fields/Button';
import { ProNotification } from '../../pro/ProNotification';
import { ProTrialStartNotification } from '../../pro/ProTrialStartNotification';
import { ProDashboardIcon, ProMultisendIcon } from './Icons';
import { HideOnReview } from '../../ios/HideOnReview';
import { useAppSdk, useAppTargetEnv, useIsCapacitorApp } from '../../../hooks/appSdk';
import { IProductInfo, isIosSubscription, ProductIds } from '@tonkeeper/core/dist/entries/pro';
import { FormProvider, useForm, useFormContext } from 'react-hook-form';
import { useToast } from '../../../hooks/useNotification';

const NotificationStyled = styled(Notification)`
    max-width: 768px;
`;

export const ProFeaturesNotification: FC<{ isOpen: boolean; onClose: () => void }> = ({
    isOpen,
    onClose
}) => (
    <HideOnReview>
        <NotificationStyled isOpen={isOpen} handleClose={onClose}>
            {() => <ProFeaturesNotificationContent onClose={onClose} />}
        </NotificationStyled>
    </HideOnReview>
);

const ContentWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 40px;
    overflow: hidden;
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
    overflow: hidden;
    max-width: 100%;

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

const Subtitle = styled(Body3)<{ textAlign?: string }>`
    margin-bottom: 8px;
    max-width: 576px;
    display: block;
    color: ${p => p.theme.textSecondary};
    text-align: ${p => p.textAlign ?? 'unset'};
`;

const Text = styled(Body3)`
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

const RadioGroup = styled.fieldset`
    border: none;
    display: flex;
    gap: 8px;
    padding: 0;
    margin: 0;
`;

const Label = styled.label<{ selected: boolean }>`
    display: flex;
    flex: 1;
    flex-direction: column;
    padding: 12px 16px;
    border-radius: ${props => props.theme.corner2xSmall};
    cursor: pointer;
    text-align: center;
    transition: all 0.2s;

    input {
        display: none;
    }

    ${props =>
        props.selected
            ? css`
                  border: 1px solid ${props.theme.fieldActiveBorder};
                  background: ${props.theme.fieldBackground};
              `
            : css`
                  border: 1px solid transparent;
                  background: ${props.theme.fieldBackground};
              `}
`;

export const SubscriptionSelector: React.FC<{ products: IProductInfo[] }> = ({ products }) => {
    const { register, watch } = useFormContext<FormValues>();
    const selectedId = watch('productId');

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                width: '100%'
            }}
        >
            <Subtitle>Choose your Plan</Subtitle>
            <RadioGroup>
                {products.map(({ id, displayName, displayPrice }) => (
                    <Label key={id} selected={id === selectedId}>
                        <input
                            type="radio"
                            value={id}
                            {...register('productId', { required: true })}
                        />
                        <Text>{displayName}</Text>
                        <Label1>{displayPrice}</Label1>
                    </Label>
                ))}
            </RadioGroup>
        </div>
    );
};

const TEST_PRODUCTS: IProductInfo[] = [
    {
        id: ProductIds.MONTHLY,
        displayName: '1 month',
        displayPrice: '$2.99',
        description: 'Access to premium features for one month',
        subscriptionGroup: 'tonkeeper_pro',
        subscriptionPeriod: 'P1M'
    },
    {
        id: ProductIds.YEARLY,
        displayName: '1 year',
        displayPrice: '$24.99',
        description: 'Access to premium features for one year',
        subscriptionGroup: 'tonkeeper_pro',
        subscriptionPeriod: 'P1Y'
    }
];

const IncludedFeatures = () => {
    const features = [
        {
            title: 'Advanced Dashboard',
            description:
                'Get insights into your crypto portfolio with advanced analytics and charts.',
            iconLink: 'https://wallet.tonkeeper.com/img/pro/dashboard.webp'
        },
        {
            title: 'Multisend',
            description: 'Send TON to multiple addresses in one transaction, saving time and fees.',
            iconLink: 'https://wallet.tonkeeper.com/img/pro/dashboard.webp'
        },
        {
            title: 'Priority Support1',
            description: 'Get priority support for any issues or questions you may have.',
            iconLink: 'https://wallet.tonkeeper.com/img/pro/dashboard.webp'
        },
        {
            title: 'Priority Support2',
            description: 'Get priority support for any issues or questions you may have.',
            iconLink: 'https://wallet.tonkeeper.com/img/pro/dashboard.webp'
        },
        {
            title: 'Priority Support3',
            description: 'Get priority support for any issues or questions you may have.',
            iconLink: 'https://wallet.tonkeeper.com/img/pro/dashboard.webp'
        },
        {
            title: 'Priority Support4',
            description: 'Get priority support for any issues or questions you may have.',
            iconLink: 'https://wallet.tonkeeper.com/img/pro/dashboard.webp'
        },
        {
            title: 'Priority Support5',
            description: 'Get priority support for any issues or questions you may have.',
            iconLink: 'https://wallet.tonkeeper.com/img/pro/dashboard.webp'
        }
    ];

    return (
        <div
            style={{
                margin: '24px 0'
            }}
        >
            <Subtitle>What’s included</Subtitle>
            {features.map(({ title, description, iconLink }, index) => (
                <div key={title}>
                    <Label2>{title}</Label2>
                    <div
                        style={{
                            display: 'grid',
                            gap: '16px',
                            gridTemplateColumns: '1fr auto'
                        }}
                    >
                        <Text>{description}</Text>
                        <FeatureIconContainer>
                            <img src={iconLink} alt={title} width="16" height="16" />
                        </FeatureIconContainer>
                    </div>
                </div>
            ))}
        </div>
    );
};

const SubmitSubscriptionBlock = styled.div`
    position: fixed;
    bottom: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1rem;
    width: 100%;
    border-radius: ${p => p.theme.corner2xSmall};
    background-color: ${p => p.theme.backgroundPage};
    overflow: visible;

    &::before {
        content: '';
        position: absolute;
        top: -24px;
        left: 0;
        right: 0;
        height: 24px;
        background: linear-gradient(to top, rgba(0, 0, 0, 1), rgba(0, 0, 0, 0));
        pointer-events: none;
        z-index: 1;
    }
`;

type FormValues = {
    productId: ProductIds;
};

const SubscriptionForm = ({ onClose }: { onClose: () => void }) => {
    const sdk = useAppSdk();
    const methods = useForm<FormValues>({
        mode: 'onSubmit',
        reValidateMode: 'onChange'
    });
    const { handleSubmit } = methods;
    const { isValid, isSubmitted } = methods.formState;
    const [products, setProducts] = useState<IProductInfo[]>(TEST_PRODUCTS);
    const toast = useToast();
    const { mutateAsync, isSuccess } = useProSubscriptionPurchase();

    useEffect(() => {
        if (isSuccess) {
            toast('Subscription purchased successfully');
            onClose();
        }
    }, [isSuccess, toast]);

    useEffect(() => {
        (async () => {
            try {
                const productsInfo = await sdk.subscription?.getAllProductsInfo();

                if (!productsInfo?.length) return;

                setProducts(productsInfo);
            } catch (e) {
                console.log('e: ', e);
            }
        })();
    }, []);

    const handleBuySubscription = async ({ productId }: FormValues) => {
        if (!productId || typeof productId !== 'string') {
            console.error('No subscription selected');
            return;
        }

        await mutateAsync(productId);
    };

    const handleManageSubscriptions = async () => {
        try {
            if (isIosSubscription(sdk.subscription)) {
                await sdk.subscription?.manageSubscriptions();
            }
        } catch (e) {
            console.error('Failed to manage subscriptions:', e);
            toast('Failed to manage subscriptions');
        }
    };

    return !!products?.length ? (
        <FormProvider {...methods}>
            <form onSubmit={handleSubmit(handleBuySubscription)}>
                <ContentWrapper>
                    <ProImage src="https://tonkeeper.com/assets/icon.ico" />
                    <Title>Tonkeeper Pro Subscription</Title>
                    <Subtitle textAlign="center">
                        Tonkeeper Pro unlocks premium tools for power users. Manage your crypto
                        smarter and faster.
                    </Subtitle>

                    <SubscriptionSelector products={products} />

                    <IncludedFeatures />

                    <Button onClick={handleManageSubscriptions} secondary fullWidth>
                        <Label2>Manage Subscriptions</Label2>
                    </Button>

                    <SubmitSubscriptionBlock>
                        <Button primary fullWidth size="large" type="submit">
                            <Label2>Continue with Tonkeeper Pro</Label2>
                        </Button>

                        <Text
                            style={{
                                marginTop: 8,
                                textAlign: 'center'
                            }}
                        >
                            Subscription renews automatically unless cancelled at least 24 hours
                            before the end of the current period. You can manage your subscription
                            in the app or in your Apple ID settings. By subscribing, you agree to
                            our Terms of Use and Privacy Policy. Restore Purchases
                        </Text>
                    </SubmitSubscriptionBlock>

                    <div
                        style={{
                            height: 300
                        }}
                    />
                </ContentWrapper>
            </form>
        </FormProvider>
    ) : null;
};

export const ProFeaturesNotificationContent: FC<{ onClose: () => void }> = ({ onClose }) => {
    const { t } = useTranslation();
    const { data } = useProSubscription();
    const isCapacitorApp = useIsCapacitorApp();

    const {
        isOpen: isTrialModalOpen,
        onClose: onTrialModalClose,
        onOpen: onTrialModalOpen
    } = useDisclosure();
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

    return !isCapacitorApp ? (
        <ContentWrapper>
            <ProImage src="https://tonkeeper.com/assets/icon.ico" />
            <Title>{t('tonkeeper_pro')}</Title>
            <ProDescription>{t('pro_features_description')}</ProDescription>
            <ButtonsBlockStyled
                onBuy={onPurchaseModalOpen}
                onTrial={onTrialModalOpen}
                // onTrial={data.subscription.usedTrial ? undefined : onTrialModalOpen}
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
                onTrial={onTrialModalOpen}
                // onTrial={data.subscription.usedTrial ? undefined : onTrialModalOpen}
            />
            <ProNotification isOpen={isPurchaseModalOpen} onClose={onPurchaseClose} />
            <ProTrialStartNotification isOpen={isTrialModalOpen} onClose={onTrialClose} />
        </ContentWrapper>
    ) : (
        <SubscriptionForm onClose={onClose} />
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
    const appPlatform = useAppTargetEnv();

    return (
        <ButtonsContainer className={className}>
            {onTrial && appPlatform !== 'tablet' && appPlatform !== 'mobile' && (
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
