import React, { FC, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { useTranslation } from '../../hooks/translation';
import { SpinnerIcon } from '../Icon';
import { Notification, NotificationFooter, NotificationFooterPortal } from '../Notification';
import { Body2, Body3, Label2 } from '../Text';
import { Button } from '../fields/Button';
import { ConfirmMainButtonProps } from '../transfer/common';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { TON_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { ListItem, ListItemPayload } from '../List';
import { useFormatFiat, useRate } from '../../state/rates';
import { formatDecimals } from '@tonkeeper/core/dist/utils/balance';
import { ErrorBoundary } from '../shared/ErrorBoundary';
import { fallbackRenderOver } from '../Error';
import {
    useCancelSubscription,
    useEstimateRemoveExtension
} from '../../hooks/blockchain/subscription';
import {
    ConfirmView,
    ConfirmViewButtons,
    ConfirmViewButtonsSlot,
    ConfirmViewDetailsSlot,
    ConfirmViewHeadingSlot
} from '../transfer/ConfirmView';
import { ProSubscriptionHeader } from '../pro/ProSubscriptionHeader';
import { CryptoCurrency } from '@tonkeeper/core/dist/pro';
import { useProCompatibleAccountsWallets } from '../../state/wallet';
import { backwardCompatibilityFilter } from '@tonkeeper/core/dist/service/proService';
import { useToast } from '../../hooks/useNotification';
import { useDateTimeFormat } from '../../hooks/useDateTimeFormat';
import { hexToRGBA } from '../../libs/css';
import { toNano } from '@ton/core';
import { CancelSubscriptionV2Payload } from '@tonkeeper/core/dist/entries/tonConnect';

export const RemoveSubscriptionV2Notification: FC<{
    params: CancelSubscriptionV2Payload | null;
    handleClose: (boc?: string) => void;
}> = ({ params, handleClose }) => {
    return (
        <>
            <NotificationStyled
                isOpen={params !== null}
                handleClose={() => handleClose()}
                hideButton
                backShadow
            >
                {() => (
                    <ErrorBoundary
                        fallbackRender={fallbackRenderOver('Failed to display Pro Confirm modal')}
                    >
                        {!!params?.extensionAddress && (
                            <ProRemoveSubscriptionV2NotificationContent
                                params={params}
                                onClose={handleClose}
                            />
                        )}
                    </ErrorBoundary>
                )}
            </NotificationStyled>
        </>
    );
};

const ProRemoveSubscriptionV2NotificationContent: FC<{
    params: any;
    onClose: (boc?: string) => void;
}> = ({ onClose, params }) => {
    const { extensionAddress, from } = params;
    const destroyValue = toNano('0.05').toString();

    const accountsWallets = useProCompatibleAccountsWallets(backwardCompatibilityFilter);

    const accountWallet = accountsWallets.find(accWallet => accWallet.wallet.id === from);

    const selectedWallet = accountWallet?.wallet;
    const finalExpiresDate = new Date();

    const toast = useToast();
    const { t } = useTranslation();
    const formatDate = useDateTimeFormat();
    const { data: rate } = useRate(CryptoCurrency.TON);

    const removeMutation = useCancelSubscription();
    const estimateFeeMutation = useEstimateRemoveExtension();
    const {
        data: estimation,
        error: estimationError,
        isLoading: isEstimating
    } = estimateFeeMutation;

    const { fiatAmount: feeEquivalent } = useFormatFiat(
        rate,
        formatDecimals(estimation?.fee?.extra?.stringWeiAmount ?? 0)
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
        if (!selectedWallet) return;

        estimateFeeMutation.mutate({
            destroyValue,
            selectedWallet,
            extensionContract: extensionAddress
        });
    }, [selectedWallet]);

    const removeMutate = async () => {
        if (!selectedWallet) {
            throw new Error('Selected wallet not found!');
        }

        const boc = await removeMutation.mutateAsync({
            destroyValue,
            selectedWallet,
            extensionContract: extensionAddress
        });

        setTimeout(() => {
            onClose(boc);
        }, 1500);

        return !!boc;
    };

    const deployReserve = useMemo(
        () =>
            new AssetAmount({
                asset: TON_ASSET,
                weiAmount: destroyValue
            }),
        [destroyValue]
    );

    return (
        <ConfirmView
            assetAmount={deployReserve}
            onClose={() => onClose()}
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
                                {isEstimating && <SpinnerIcon />}
                                {!!estimationError && <>—</>}
                                {estimation?.fee?.extra &&
                                    estimation.fee.extra.toStringAssetRelativeAmount()}
                            </Label2>
                            {!estimationError && !isEstimating && (
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

export const ConfirmMainButton: ConfirmMainButtonProps = props => {
    const { isLoading, isDisabled, onClick } = props;

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
    justify-items: end;
`;

const CancelButtonStyled = styled(Button)`
    color: ${p => p.theme.accentRed};
    background-color: ${({ theme }) => hexToRGBA(theme.accentRed, 0.16)};
    transition: background-color 0.1s ease-in;

    &:enabled:hover {
        background-color: ${({ theme }) => hexToRGBA(theme.accentRed, 0.12)};
    }
`;
