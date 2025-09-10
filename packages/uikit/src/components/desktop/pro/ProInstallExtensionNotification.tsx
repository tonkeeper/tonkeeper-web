import React, { FC, PropsWithChildren, useEffect, useMemo } from 'react';
import { styled } from 'styled-components';
import { Notification, NotificationFooter, NotificationFooterPortal } from '../../Notification';
import { Body2, Body3, Label2 } from '../../Text';
import { Button } from '../../fields/Button';
import { ErrorBoundary } from '../../shared/ErrorBoundary';
import { fallbackRenderOver } from '../../Error';
import {
    useCreateSubscriptionV5,
    useEstimateDeploySubscriptionV5
} from '../../../hooks/blockchain/subscription/useCreateSubscriptionV5';
import {
    ConfirmView,
    ConfirmViewAdditionalBottomSlot,
    ConfirmViewButtons,
    ConfirmViewButtonsSlot,
    ConfirmViewDetailsSlot,
    ConfirmViewHeadingSlot
} from '../../transfer/ConfirmView';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { TON_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { useActiveWallet } from '../../../state/wallet';
import { ListBlock, ListItem, ListItemPayload } from '../../List';
import { useTranslation } from '../../../hooks/translation';
import { ProSubscriptionHeader } from '../../pro/ProSubscriptionHeader';
import { ProActiveWallet } from '../../pro/ProActiveWallet';
import { ConfirmMainButtonProps } from '../../transfer/common';
import { SubscriptionExtension } from '@tonkeeper/core/dist/pro';
import { useAppContext } from '../../../hooks/appContext';
import { useRate } from '../../../state/rates';
import { CryptoCurrency } from '@tonkeeper/core/dist/entries/crypto';
import { getFiatEquivalent } from '../../../hooks/balance';
import { SpinnerIcon } from '../../Icon';
import { secondsToUnitCount } from '@tonkeeper/core/dist/utils/pro';

interface IProInstallExtensionProps {
    isOpen: boolean;
    onClose: () => void;
    extensionData?: SubscriptionExtension;
    onConfirm?: (success?: boolean) => void;
    onCancel?: () => void;
}

export const ProInstallExtensionNotification: FC<IProInstallExtensionProps> = props => {
    const { isOpen, onConfirm, onClose, onCancel, extensionData } = props;

    return (
        <NotificationStyled
            isOpen={isOpen}
            handleClose={() => {
                onCancel?.();
                onClose();
            }}
            hideButton
            backShadow
        >
            {() => (
                <ErrorBoundary
                    fallbackRender={fallbackRenderOver('Failed to display Pro Confirm modal')}
                >
                    {extensionData && (
                        <ProInstallExtensionNotificationContent
                            extensionData={extensionData}
                            onClose={confirmed => {
                                onConfirm?.(confirmed);
                                onClose();
                            }}
                        />
                    )}
                </ErrorBoundary>
            )}
        </NotificationStyled>
    );
};

const ProInstallExtensionNotificationContent: FC<
    PropsWithChildren<{
        onBack?: () => void;
        onClose: (confirmed?: boolean) => void;
        extensionData: SubscriptionExtension;
        fitContent?: boolean;
    }>
> = ({ onClose, extensionData }) => {
    const { t } = useTranslation();
    const deployMutation = useCreateSubscriptionV5();
    const activeWallet = useActiveWallet();
    const estimateFeeMutation = useEstimateDeploySubscriptionV5();

    const { fiat } = useAppContext();
    const { data: rate } = useRate(CryptoCurrency.TON);

    const fiatEquivalent: string = useMemo(
        () =>
            getFiatEquivalent({
                amount: extensionData.payment_per_period,
                fiat,
                ratePrice: rate?.prices
            }),
        [extensionData.payment_per_period, fiat, rate?.prices]
    );

    const feeEquivalent: string = useMemo(
        () =>
            getFiatEquivalent({
                amount: estimateFeeMutation?.data?.fee?.extra?.stringWeiAmount ?? null,
                fiat,
                ratePrice: rate?.prices
            }),
        [estimateFeeMutation?.data?.fee?.extra?.stringWeiAmount, fiat, rate?.prices]
    );

    useEffect(() => {
        if (!activeWallet) return;

        estimateFeeMutation.mutate({
            fromWallet: activeWallet.id,
            ...extensionData
        });
    }, [activeWallet?.id]);

    const price = useMemo(
        () =>
            new AssetAmount({
                asset: TON_ASSET,
                weiAmount: extensionData.payment_per_period
            }),
        [extensionData?.payment_per_period]
    );

    const deployMutate = async () =>
        deployMutation.mutateAsync({
            fromWallet: activeWallet.id,
            ...extensionData
        });

    const {
        unit: periodUnit,
        count: periodCount,
        form: periodForm
    } = secondsToUnitCount(extensionData.period);

    return (
        <ConfirmView
            assetAmount={price}
            onClose={onClose}
            estimation={{ ...estimateFeeMutation }}
            {...deployMutation}
            mutateAsync={deployMutate}
        >
            <ConfirmViewHeadingSlot>
                <ProSubscriptionHeaderStyled subtitleKey="subscription_activates_after_confirmation" />
            </ConfirmViewHeadingSlot>

            <ConfirmViewDetailsSlot />

            <ConfirmViewAdditionalBottomSlot>
                <ProActiveWallet isLoading={false} disableRightElement />
                <ListBlock margin={false} fullWidth>
                    <ListItemStyled hover={false}>
                        <ListItemPayloadStyled alignItems="start">
                            <Body2Styled>{t('price')}</Body2Styled>
                            <FiatEquivalentWrapper>
                                <Label2>{price.toStringAssetRelativeAmount()}</Label2>
                                <Body3Styled>{`≈ ${fiatEquivalent}`}</Body3Styled>
                            </FiatEquivalentWrapper>
                        </ListItemPayloadStyled>
                    </ListItemStyled>

                    <ListItemStyled hover={false}>
                        <ListItemPayloadStyled>
                            <Body2Styled>{t('interval')}</Body2Styled>
                            <Label2>
                                {t(`every_${periodUnit}_${periodForm}`, {
                                    count: periodCount
                                })}
                            </Label2>
                        </ListItemPayloadStyled>
                    </ListItemStyled>

                    <ListItemStyled hover={false}>
                        <ListItemPayloadStyled alignItems="start">
                            <Body2Styled>{t('swap_blockchain_fee')}</Body2Styled>
                            <FiatEquivalentWrapper>
                                <Label2>
                                    {estimateFeeMutation.isLoading && <SpinnerIcon />}
                                    {estimateFeeMutation.error && <>—</>}
                                    {estimateFeeMutation?.data?.fee?.extra &&
                                        new AssetAmount({
                                            asset: TON_ASSET,
                                            weiAmount: estimateFeeMutation.data.fee.extra.weiAmount
                                                .minus(extensionData.payment_per_period)
                                                .toString()
                                        }).toStringAssetRelativeAmount()}
                                </Label2>
                                {!estimateFeeMutation.error && (
                                    <Body3Styled>{`≈ ${feeEquivalent}`}</Body3Styled>
                                )}
                            </FiatEquivalentWrapper>
                        </ListItemPayloadStyled>
                    </ListItemStyled>
                </ListBlock>
            </ConfirmViewAdditionalBottomSlot>

            <ConfirmViewButtonsSlot>
                <NotificationFooterPortal>
                    <NotificationFooter>
                        <ConfirmViewButtons MainButton={ConfirmMainButton} />
                    </NotificationFooter>
                </NotificationFooterPortal>
            </ConfirmViewButtonsSlot>
        </ConfirmView>
    );
};

export const ConfirmMainButton: ConfirmMainButtonProps = ({ isLoading, isDisabled, onClick }) => {
    const { t } = useTranslation();
    return (
        <Button
            fullWidth
            size="large"
            primary
            type="submit"
            disabled={isDisabled}
            loading={isLoading}
            onClick={onClick}
        >
            {t('confirm')}
        </Button>
    );
};

const Body2Styled = styled(Body2)`
    color: ${props => props.theme.textSecondary};
`;

const Body3Styled = styled(Body3)`
    color: ${props => props.theme.textSecondary};
`;

const ProSubscriptionHeaderStyled = styled(ProSubscriptionHeader)`
    margin-bottom: 0;
`;

const NotificationStyled = styled(Notification)`
    max-width: 650px;

    @media (pointer: fine) {
        &:hover {
            [data-swipe-button] {
                color: ${p => p.theme.textSecondary};
            }
        }
    }
`;

const ListItemStyled = styled(ListItem)`
    &:not(:first-child) > div {
        padding-top: 10px;
    }
`;

const ListItemPayloadStyled = styled(ListItemPayload)<{ alignItems?: string }>`
    padding-top: 10px;
    padding-bottom: 10px;

    align-items: ${({ alignItems }) => alignItems ?? 'center'};
`;

const FiatEquivalentWrapper = styled.div`
    display: grid;
    justify-items: end;
`;
