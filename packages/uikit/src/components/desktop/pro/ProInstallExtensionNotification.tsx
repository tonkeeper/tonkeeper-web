import React, { FC, useEffect, useMemo } from 'react';
import { styled } from 'styled-components';
import { Notification, NotificationFooter, NotificationFooterPortal } from '../../Notification';
import { Body2, Body3, Label2 } from '../../Text';
import { Button } from '../../fields/Button';
import { ErrorBoundary } from '../../shared/ErrorBoundary';
import { fallbackRenderOver } from '../../Error';
import {
    useCreateSubscription,
    useEstimateDeploySubscription
} from '../../../hooks/blockchain/subscription';
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
import { ListBlock, ListItem, ListItemPayload } from '../../List';
import { useTranslation } from '../../../hooks/translation';
import { ProSubscriptionHeader } from '../../pro/ProSubscriptionHeader';
import { ProActiveWallet } from '../../pro/ProActiveWallet';
import { ConfirmMainButtonProps } from '../../transfer/common';
import { SubscriptionExtension } from '@tonkeeper/core/dist/pro';
import { useFormatFiat, useRate } from '../../../state/rates';
import { CryptoCurrency } from '@tonkeeper/core/dist/entries/crypto';
import { SpinnerIcon } from '../../Icon';
import { secondsToUnitCount } from '@tonkeeper/core/dist/utils/pro';
import { useAtomValue } from '../../../libs/useAtom';
import { subscriptionFormTempAuth$ } from '@tonkeeper/core/dist/ProAuthTokenService';
import { formatDecimals } from '@tonkeeper/core/dist/utils/balance';

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

interface IProInstallExtensionContentProps {
    onBack?: () => void;
    onClose: (confirmed?: boolean) => void;
    extensionData: SubscriptionExtension;
    fitContent?: boolean;
}

const ProInstallExtensionNotificationContent: FC<IProInstallExtensionContentProps> = ({
    onClose,
    extensionData
}) => {
    const { t } = useTranslation();
    const deployMutation = useCreateSubscription();
    const targetAuth = useAtomValue(subscriptionFormTempAuth$);
    const estimateFeeMutation = useEstimateDeploySubscription();
    const {
        data: estimation,
        error: estimationError,
        isLoading: isEstimating
    } = estimateFeeMutation;

    const { data: rate } = useRate(CryptoCurrency.TON);

    const { fiatAmount: fiatEquivalent } = useFormatFiat(
        rate,
        formatDecimals(extensionData.payment_per_period)
    );
    const { fiatAmount: feeEquivalent } = useFormatFiat(
        rate,
        formatDecimals(estimation?.fee?.extra?.stringWeiAmount ?? 0)
    );

    useEffect(() => {
        if (!targetAuth?.wallet) return;

        estimateFeeMutation.mutate({
            selectedWallet: targetAuth.wallet,
            ...extensionData
        });
    }, [targetAuth?.wallet]);

    const price = useMemo(
        () =>
            new AssetAmount({
                asset: TON_ASSET,
                weiAmount: extensionData.payment_per_period
            }),
        [extensionData?.payment_per_period]
    );

    const deployMutate = async () => {
        if (!targetAuth?.wallet) {
            throw new Error('Selected wallet is required!');
        }

        return deployMutation.mutateAsync({
            selectedWallet: targetAuth.wallet,
            ...extensionData
        });
    };

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
                                    {isEstimating && <SpinnerIcon />}
                                    {estimationError && <>—</>}
                                    {estimation?.fee?.extra &&
                                        new AssetAmount({
                                            asset: TON_ASSET,
                                            weiAmount:
                                                estimateFeeMutation.data.fee.extra.weiAmount.minus(
                                                    extensionData.payment_per_period
                                                )
                                        }).toStringAssetAbsoluteRelativeAmount()}
                                </Label2>
                                {!estimationError && (
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

export const ConfirmMainButton: ConfirmMainButtonProps = props => {
    const { isLoading, isDisabled, onClick } = props;

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
