import React, { FC, PropsWithChildren, useEffect, useMemo } from 'react';
import { styled } from 'styled-components';
import { Notification, NotificationFooter, NotificationFooterPortal } from '../../Notification';
import { Body2, Body3, Label2 } from '../../Text';
import { Button } from '../../fields/Button';
import { ErrorBoundary } from '../../shared/ErrorBoundary';
import { fallbackRenderOver } from '../../Error';
import {
    ConfirmView,
    ConfirmViewButtons,
    ConfirmViewButtonsSlot,
    ConfirmViewDetailsSlot,
    ConfirmViewHeadingSlot
} from '../../transfer/ConfirmView';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import BigNumber from 'bignumber.js';
import { TON_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { toNano } from '@ton/core';
import {
    useCancelSubscription,
    useEstimateRemoveExtension
} from '../../../hooks/blockchain/subscription';
import { ListItem, ListItemPayload } from '../../List';
import { useTranslation } from '../../../hooks/translation';
import { ProSubscriptionHeader } from '../../pro/ProSubscriptionHeader';
import { ConfirmMainButtonProps } from '../../transfer/common';
import { useDateTimeFormat } from '../../../hooks/useDateTimeFormat';
import { getFiatEquivalent } from '../../../hooks/balance';
import { useAppContext } from '../../../hooks/appContext';
import { useRate } from '../../../state/rates';
import { CryptoCurrency } from '@tonkeeper/core/dist/entries/crypto';
import { SpinnerIcon } from '../../Icon';
import { hexToRGBA } from '../../../libs/css';
import { useToast } from '../../../hooks/useNotification';
import { IExtensionActiveSubscription } from '@tonkeeper/core/dist/entries/pro';

const deployReserve = new AssetAmount({
    asset: TON_ASSET,
    weiAmount: new BigNumber(toNano('0.05').toString())
});

interface IProRecurrentNotificationProps {
    isOpen: boolean;
    onClose: () => void;
    subscription?: IExtensionActiveSubscription;
    onConfirm?: (success?: boolean) => void;
    onCancel?: () => void;
}

export const ProRemoveExtensionNotification: FC<IProRecurrentNotificationProps> = props => {
    const { isOpen, onConfirm, onClose, onCancel, subscription } = props;

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
                    {subscription && (
                        <ProRemoveExtensionNotificationContent
                            subscription={subscription}
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

const ProRemoveExtensionNotificationContent: FC<
    PropsWithChildren<{
        onBack?: () => void;
        onClose: (confirmed?: boolean) => void;
        subscription: IExtensionActiveSubscription;
        fitContent?: boolean;
    }>
> = ({ onClose, subscription }) => {
    const { contract: extensionContract, auth, expiresDate, nextChargeDate } = subscription;

    const selectedWallet = auth.wallet;
    const finalExpiresDate = expiresDate ?? nextChargeDate;

    const toast = useToast();
    const { t } = useTranslation();
    const { fiat } = useAppContext();
    const formatDate = useDateTimeFormat();
    const { data: rate } = useRate(CryptoCurrency.TON);

    const removeMutation = useCancelSubscription();
    const estimateFeeMutation = useEstimateRemoveExtension();

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
        if (!removeMutation.isSuccess || !finalExpiresDate) return;

        toast(
            `${t('extension_cancellation_success')} ${formatDate(finalExpiresDate, {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                inputUnit: 'seconds'
            })}`
        );
    }, [removeMutation.isSuccess]);

    useEffect(() => {
        estimateFeeMutation.mutate({
            selectedWallet,
            extensionContract
        });
    }, [selectedWallet]);

    const removeMutate = async () =>
        removeMutation.mutateAsync({
            selectedWallet,
            extensionContract
        });

    return (
        <ConfirmView
            assetAmount={deployReserve}
            onClose={onClose}
            estimation={{ ...estimateFeeMutation }}
            {...removeMutation}
            mutateAsync={removeMutate}
        >
            <ConfirmViewHeadingSlot>
                <ProSubscriptionHeaderStyled
                    titleKey="remove_extension_title"
                    subtitleKey="remove_extension_subtitle"
                />
            </ConfirmViewHeadingSlot>

            <ConfirmViewDetailsSlot>
                {finalExpiresDate && (
                    <ListItemStyled hover={false}>
                        <ListItemPayloadStyled>
                            <Body2Styled>{t('will_be_active_until')}</Body2Styled>
                            <Label2>
                                {formatDate(finalExpiresDate, {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                    inputUnit: 'seconds'
                                })}
                            </Label2>
                        </ListItemPayloadStyled>
                    </ListItemStyled>
                )}

                <ListItemStyled hover={false}>
                    <ListItemPayloadStyled>
                        <Body2Styled>{t('swap_blockchain_fee')}</Body2Styled>
                        <FiatEquivalentWrapper>
                            <Label2>
                                {estimateFeeMutation.isLoading && <SpinnerIcon />}
                                {estimateFeeMutation.error && <>—</>}
                                {estimateFeeMutation.data &&
                                    estimateFeeMutation.data.fee.extra.toStringAssetRelativeAmount()}
                            </Label2>
                            {!estimateFeeMutation.error && (
                                <Body3Styled>{`≈ ${feeEquivalent}`}</Body3Styled>
                            )}
                        </FiatEquivalentWrapper>
                    </ListItemPayloadStyled>
                </ListItemStyled>
            </ConfirmViewDetailsSlot>

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
        <CancelButtonStyled
            fullWidth
            size="large"
            type="submit"
            disabled={isDisabled}
            loading={isLoading}
            onClick={onClick}
        >
            <Label2>{t('cancel_subscription')}</Label2>
        </CancelButtonStyled>
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

const ListItemPayloadStyled = styled(ListItemPayload)`
    padding-top: 10px;
    padding-bottom: 10px;
`;

const FiatEquivalentWrapper = styled.div`
    display: grid;
`;

const CancelButtonStyled = styled(Button)`
    color: ${p => p.theme.accentRed};
    background-color: ${({ theme }) => hexToRGBA(theme.accentRed, 0.16)};
    transition: background-color 0.1s ease-in;

    &:enabled:hover {
        background-color: ${({ theme }) => hexToRGBA(theme.accentRed, 0.12)};
    }
`;
