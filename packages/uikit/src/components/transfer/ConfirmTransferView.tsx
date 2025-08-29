import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { RecipientData } from '@tonkeeper/core/dist/entries/send';
import React, { FC, PropsWithChildren, useCallback, useEffect, useMemo, useState } from 'react';
import { useEstimateTransfer } from '../../hooks/blockchain/useEstimateTransfer';
import { useSendTransfer } from '../../hooks/blockchain/useSendTransfer';
import { ConfirmView, ConfirmViewButtonsSlot } from './ConfirmView';
import {
    TonSenderChoiceUserAvailable,
    useAvailableTonSendersChoices
} from '../../hooks/blockchain/useSender';
import {
    TonAsset,
    tonAssetAddressToString
} from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import {
    TON_ASSET,
    TON_USDT_ASSET,
    TRON_TRX_ASSET
} from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { useAssetWeiBalance } from '../../state/home';
import { JettonEncoder } from '@tonkeeper/core/dist/service/ton-blockchain/encoder/jetton-encoder';
import BigNumber from 'bignumber.js';
import { RatesApi } from '@tonkeeper/core/dist/tonApiV2';
import { isTonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/asset';
import { useQuery } from '@tanstack/react-query';
import { shiftedDecimals } from '@tonkeeper/core/dist/utils/balance';
import { useActiveApi } from '../../state/wallet';
import {
    TRON_SENDER_TYPE,
    TronSenderOption,
    useAvailableTronSendersChoices
} from '../../hooks/blockchain/sender/useTronSender';
import { AllChainsSenderType, isTronSenderOption } from '../../hooks/blockchain/sender/sender-type';
import { Button } from '../fields/Button';
import styled from 'styled-components';
import { ExclamationMarkCircleIcon } from '../Icon';
import { Label2 } from '../Text';
import { useTranslation } from '../../hooks/translation';
import { BLOCKCHAIN_NAME } from '@tonkeeper/core/dist/entries/crypto';
import { useAppSdk } from '../../hooks/appSdk';
import { assertUnreachableSoft } from '@tonkeeper/core/dist/utils/types';
import { AppRoute, WalletSettingsRoute } from '../../libs/routes';
import { useNavigate } from '../../hooks/router/useNavigate';
import { useTopUpTronFeeBalanceNotification } from '../modals/TopUpTronFeeBalanceNotificationControlled';
import { useConfirmDiscardNotification } from '../modals/ConfirmDiscardNotificationControlled';

const gaslessApproximateFee = (asset: TonAsset, tokenToTonRate: number) => {
    const k = asset.id === TON_USDT_ASSET.id ? 0.9 : 0.5;

    const relativeAmount = shiftedDecimals(
        new BigNumber(JettonEncoder.jettonTransferAmount.toString())
    )
        .multipliedBy(1.2)
        .div(k)
        .div(tokenToTonRate);

    return AssetAmount.fromRelativeAmount({ asset: asset, amount: relativeAmount });
};

const ExclamationMarkCircleIconStyled = styled(ExclamationMarkCircleIcon)`
    min-width: 32px;
    min-height: 32px;
    color: ${p => p.theme.accentRed};
`;

const TopUpFeeBanner = styled.div`
    display: flex;
    flex-direction: column;
    gap: 6px;
    align-items: center;
    width: 100%;
`;

const ErrorLabel = styled(Label2)`
    color: ${p => p.theme.accentRed};
`;

export const ConfirmTransferView: FC<
    PropsWithChildren<{
        recipient: RecipientData;
        assetAmount: AssetAmount;
        isMax: boolean;
        onBack?: () => void;
        onClose: (confirmed?: boolean) => void;
        fitContent?: boolean;
    }>
> = ({ isMax, assetAmount, ...rest }) => {
    const { t } = useTranslation();
    const { onOpen: openTopUpTronFeeBalanceNotification } = useTopUpTronFeeBalanceNotification();
    const { onOpen: openConfirmDiscardNotification } = useConfirmDiscardNotification();

    const api = useActiveApi();
    const operationType = useMemo(() => {
        return {
            type: 'transfer',
            asset: assetAmount.asset as TonAsset
        } as const;
    }, [assetAmount.asset]);
    const assetWeiBalance = useAssetWeiBalance(assetAmount.asset);
    /**
     * for MAX button jettons gasless
     */
    const [assetAmountPatched, setAssetAmountPatched] = useState<AssetAmount>(assetAmount);
    const isTonBlockchainAssetTransfer = isTonAsset(assetAmount.asset);

    const { data: availableTonSendersChoices } = useAvailableTonSendersChoices(operationType);
    const { data: availableTronSendersChoices } = useAvailableTronSendersChoices(
        rest.recipient.address.address,
        assetAmount
    );
    const availableSenderChoices = isTonBlockchainAssetTransfer
        ? availableTonSendersChoices
        : availableTronSendersChoices;

    const [selectedSenderType, setSelectedSenderType] = useState<AllChainsSenderType>();
    const sdk = useAppSdk();
    const navigate = useNavigate();

    const onSenderTypeChange = useCallback(
        (type: AllChainsSenderType) => {
            const choice = (
                availableSenderChoices as
                    | (TonSenderChoiceUserAvailable | TronSenderOption)[]
                    | undefined
            )?.find(c => c.type === type);

            if (!choice) {
                return;
            }

            if (!isTronSenderOption(choice) || choice.isEnoughBalance) {
                return setSelectedSenderType(type);
            }

            if (!choice.isEnoughBalance) {
                openConfirmDiscardNotification({
                    onClose(isDiscarded: boolean) {
                        if (isDiscarded) {
                            rest.onClose();
                            if (choice.type === TRON_SENDER_TYPE.TRX) {
                                sdk.uiEvents.emit('receive', {
                                    method: 'receive',
                                    params: {
                                        chain: BLOCKCHAIN_NAME.TRON,
                                        jetton: TRON_TRX_ASSET.id
                                    }
                                });
                            } else if (choice.type === TRON_SENDER_TYPE.TON_ASSET) {
                                sdk.uiEvents.emit('receive', {
                                    method: 'receive',
                                    params: {
                                        chain: BLOCKCHAIN_NAME.TON,
                                        jetton: TON_ASSET.id
                                    }
                                });
                            } else if (choice.type === TRON_SENDER_TYPE.BATTERY) {
                                navigate(AppRoute.walletSettings + WalletSettingsRoute.battery, {
                                    disableMobileAnimation: true
                                });
                            } else {
                                assertUnreachableSoft(choice);
                            }
                        }
                    }
                });
            }
        },
        [availableSenderChoices, navigate, rest.onClose, openConfirmDiscardNotification]
    );

    const estimation = useEstimateTransfer({
        recipient: rest.recipient,
        amount: assetAmountPatched,
        isMax,
        senderType: selectedSenderType
    });
    const mutation = useSendTransfer({
        recipient: rest.recipient,
        amount: assetAmountPatched,
        isMax,
        estimation: estimation.data!,
        senderType: selectedSenderType!
    });

    useEffect(() => {
        if (!mutation.isIdle || !isTonBlockchainAssetTransfer || selectedSenderType) {
            return;
        }

        if (availableTonSendersChoices) {
            setSelectedSenderType(availableTonSendersChoices[0].type);
        }
    }, [
        selectedSenderType,
        isTonBlockchainAssetTransfer,
        JSON.stringify(availableTonSendersChoices),
        mutation.isIdle
    ]);
    useEffect(() => {
        if (!mutation.isIdle || isTonBlockchainAssetTransfer || selectedSenderType) {
            return;
        }

        const choice = availableTronSendersChoices?.[0];
        if (choice?.isEnoughBalance) {
            return setSelectedSenderType(choice.type);
        }
    }, [
        selectedSenderType,
        isTonBlockchainAssetTransfer,
        JSON.stringify(availableTronSendersChoices),
        mutation.isIdle
    ]);

    const assetAddress = isTonAsset(assetAmount.asset)
        ? tonAssetAddressToString((assetAmount.asset as TonAsset).address)
        : undefined;
    const shouldPatchAmount =
        assetAddress !== TON_ASSET.address &&
        isMax &&
        selectedSenderType === 'gasless' &&
        isTonAsset(assetAmount.asset) &&
        assetWeiBalance;

    const tokenToTonRate = useQuery(
        [
            'current-token-to-ton-rate',
            tonAssetAddressToString((assetAmount.asset as TonAsset).address)
        ],
        async () => {
            const response = await new RatesApi(api.tonApiV2).getRates({
                tokens: [assetAddress!],
                currencies: ['TON']
            });

            return Object.values(response.rates)[0].prices!.TON;
        },
        {
            enabled: !!shouldPatchAmount
        }
    );

    useEffect(() => {
        if (!shouldPatchAmount) {
            return setAssetAmountPatched(assetAmount);
        }

        if (!tokenToTonRate.data) {
            return;
        }

        const fee = gaslessApproximateFee(assetAmount.asset as TonAsset, tokenToTonRate.data);
        setAssetAmountPatched(
            new AssetAmount({
                asset: assetAmount.asset,
                weiAmount: assetWeiBalance.minus(fee.weiAmount)
            })
        );
    }, [isMax, assetAmount, selectedSenderType, assetWeiBalance?.toFixed(0), tokenToTonRate.data]);

    const noAvailableTronSenders = (
        availableSenderChoices as (TonSenderChoiceUserAvailable | TronSenderOption)[]
    )?.every(c => isTronSenderOption(c) && !c.isEnoughBalance);

    return (
        <ConfirmView
            estimation={estimation}
            {...mutation}
            {...rest}
            assetAmount={assetAmountPatched}
            selectedSenderType={selectedSenderType}
            onSenderTypeChange={onSenderTypeChange}
            availableSendersOptions={availableSenderChoices}
        >
            {noAvailableTronSenders && (
                <ConfirmViewButtonsSlot>
                    <TopUpFeeBanner>
                        <ExclamationMarkCircleIconStyled />
                        <ErrorLabel>
                            {t('send_confirm_tron_no_enough_balance_for_fee_error')}
                        </ErrorLabel>
                        <Button
                            size="large"
                            marginTop
                            primary
                            fullWidth
                            onClick={() => {
                                rest.onClose();
                                openTopUpTronFeeBalanceNotification();
                            }}
                        >
                            {t('tron_fee_banner_fee_options')}
                        </Button>
                    </TopUpFeeBanner>
                </ConfirmViewButtonsSlot>
            )}
        </ConfirmView>
    );
};
