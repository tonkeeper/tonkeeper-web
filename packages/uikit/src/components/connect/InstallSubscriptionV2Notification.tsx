import {
    CreateSubscriptionV2Payload,
    SubscriptionMetadataSource
} from '@tonkeeper/core/dist/entries/tonConnect';
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
import { ListBlock, ListItem, ListItemPayload } from '../List';
import { secondsToUnitCount } from '@tonkeeper/core/dist/utils/pro';
import { useFormatFiat, useRate } from '../../state/rates';
import { formatDecimals } from '@tonkeeper/core/dist/utils/balance';
import { ErrorBoundary } from '../shared/ErrorBoundary';
import { fallbackRenderOver } from '../Error';
import {
    useCreateSubscription,
    useEstimateDeploySubscription
} from '../../hooks/blockchain/subscription';
import {
    ConfirmView,
    ConfirmViewAdditionalBottomSlot,
    ConfirmViewButtons,
    ConfirmViewButtonsSlot,
    ConfirmViewDetailsSlot,
    ConfirmViewHeadingSlot
} from '../transfer/ConfirmView';
import { ProActiveWallet } from '../pro/ProActiveWallet';
import { ProSubscriptionHeader } from '../pro/ProSubscriptionHeader';
import {
    CryptoCurrency,
    SubscriptionExtension,
    SubscriptionExtensionMetadata,
    SubscriptionExtensionStatus,
    SubscriptionExtensionVersion
} from '@tonkeeper/core/dist/pro';
import { useProCompatibleAccountsWallets } from '../../state/wallet';
import { backwardCompatibilityFilter } from '@tonkeeper/core/dist/service/proService';
import { toNano } from '@ton/core';

interface IProInstallExtensionProps {
    isOpen: boolean;
    onClose: (boc?: string) => void;
    extensionData?: SubscriptionExtension;
}

function toSubscriptionMetadata(src: SubscriptionMetadataSource): SubscriptionExtensionMetadata {
    return {
        l: src.logo,
        n: src.name,
        u: src.link,
        m: src.merchant,
        w: src.website,
        ...(src.description ? { d: src.description } : {}),
        ...(src.tos ? { t: src.tos } : {})
    };
}

export const InstallSubscriptionV2Notification: FC<{
    params: CreateSubscriptionV2Payload | null;
    handleClose: (boc?: string) => void;
}> = ({ params, handleClose }) => {
    const subscription = params?.subscription;

    if (!subscription || !params?.from) return null;

    const extensionData: SubscriptionExtension = {
        version: SubscriptionExtensionVersion.V2,
        status: SubscriptionExtensionStatus.NOT_INITIALIZED,
        admin: subscription.beneficiary,
        recipient: subscription.beneficiary,
        subscription_id: subscription.id,
        first_charging_date: 0,
        last_charging_date: 0,
        grace_period: 0,
        payment_per_period: subscription.amount,
        currency: CryptoCurrency.TON,
        created_at: Date.now(),
        deploy_value: toNano('0.1').toString(),
        destroy_value: toNano('0.05').toString(),
        caller_fee: toNano('0.05').toString(),
        payer: params.from,
        contract: '',
        period: subscription.period,
        metadata: toSubscriptionMetadata(subscription.metadata)
    };

    return (
        <>
            <NotificationStyled
                isOpen={true}
                handleClose={() => handleClose()}
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
                                onClose={handleClose}
                            />
                        )}
                    </ErrorBoundary>
                )}
            </NotificationStyled>
        </>
    );
};

const ProInstallExtensionNotificationContent: FC<
    Required<Omit<IProInstallExtensionProps, 'isOpen'>>
> = ({ onClose, extensionData }) => {
    const { t } = useTranslation();
    const deployMutation = useCreateSubscription();
    const estimateFeeMutation = useEstimateDeploySubscription();
    const {
        data: estimation,
        error: estimationError,
        isLoading: isEstimating
    } = estimateFeeMutation;

    const accountsWallets = useProCompatibleAccountsWallets(backwardCompatibilityFilter);

    const accountWallet = accountsWallets.find(
        accWallet => accWallet.wallet.id === extensionData.payer
    );

    const selectedWallet = accountWallet?.wallet;

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
        if (!selectedWallet) return;

        estimateFeeMutation.mutate({
            selectedWallet,
            ...extensionData
        });
    }, [selectedWallet]);

    const price = useMemo(
        () =>
            new AssetAmount({
                asset: TON_ASSET,
                weiAmount: extensionData.payment_per_period
            }),
        [extensionData?.payment_per_period]
    );

    const deployMutate = async () => {
        if (!selectedWallet) {
            throw new Error('Selected wallet is required!');
        }

        const boc = await deployMutation.mutateAsync({
            selectedWallet,
            ...extensionData
        });

        setTimeout(() => {
            onClose(boc.toString());
        }, 1500);

        return !!boc;
    };

    const {
        unit: periodUnit,
        count: periodCount,
        form: periodForm
    } = secondsToUnitCount(extensionData.period);

    return (
        <ConfirmView
            assetAmount={price}
            onClose={() => onClose()}
            estimation={{ ...estimateFeeMutation }}
            {...deployMutation}
            mutateAsync={deployMutate}
        >
            <ConfirmViewHeadingSlot>
                <ProSubscriptionHeaderStyled subtitleKey="subscription_activates_after_confirmation" />
            </ConfirmViewHeadingSlot>

            <ConfirmViewDetailsSlot />

            <ConfirmViewAdditionalBottomSlot>
                <ProActiveWallet
                    rawAddress={selectedWallet?.rawAddress}
                    isLoading={false}
                    disableRightElement
                />
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
                                    {!!estimationError && <>—</>}
                                    {estimation?.fee?.extra &&
                                        estimateFeeMutation.data.fee.extra.toStringAssetRelativeAmount()}
                                </Label2>
                                {!estimationError && !isEstimating && (
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
