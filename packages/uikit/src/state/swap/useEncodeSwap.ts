import { useMutation } from '@tanstack/react-query';
import { CalculatedSwap } from './useCalculatedSwap';
import type { SwapService } from '@tonkeeper/core/dist/swapsApi';
import { assertUnreachable, NonNullableFields } from '@tonkeeper/core/dist/utils/types';
import { Address } from '@ton/core';
import { useSwapsConfig } from './useSwapsConfig';
import BigNumber from 'bignumber.js';
import { useSwapOptions } from './useSwapOptions';
import { useActiveConfig, useActiveTonWalletConfig, useActiveWallet } from '../wallet';
import {
    TON_CONNECT_MSG_VARIANTS_ID,
    TonConnectTransactionPayload
} from '@tonkeeper/core/dist/entries/tonConnect';
import { useBatteryBalance, useBatteryServiceConfig } from '../battery';
import {
    isTon,
    tonAssetAddressToString
} from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { useGaslessConfig } from '../gasless';

export function useEncodeSwap() {
    const wallet = useActiveWallet();
    const { swapService } = useSwapsConfig();
    const config = useActiveConfig();
    const { data: swapOpaitons } = useSwapOptions();
    const referral = config.web_swaps_referral_address;

    return useMutation<
        { value: string; to: string; body: string },
        Error,
        NonNullableFields<CalculatedSwap> & { excessAddress?: string }
    >(swap => {
        if (!swapOpaitons) {
            throw new Error('SwapOptions query was not resolved yet');
        }
        return swapService.encodeSwap({
            swap: swapToProviderSwap(swap),
            options: {
                senderAddress: wallet.rawAddress,
                slippage: new BigNumber(swapOpaitons.slippagePercent)
                    .div(100)
                    .decimalPlaces(5)
                    .toString(),
                ...(referral && { referralAddress: Address.parse(referral).toRawString() }),
                ...(swap.excessAddress && { excessAddress: swap.excessAddress })
            }
        });
    });
}

export function useEncodeSwapToTonConnectParams(options: { forceCalculateBattery?: boolean } = {}) {
    const { mutateAsync: encode } = useEncodeSwap();
    const { data: batteryBalance } = useBatteryBalance();
    const { excessAccount: batteryExcess } = useBatteryServiceConfig();
    const { data: activeWalletConfig } = useActiveTonWalletConfig();
    const gaslessConfig = useGaslessConfig();

    const encodeAs = async (variant: string, ...params: Parameters<typeof encode>) => {
        const encoded = await encode(...params);
        return {
            encoded,
            variant
        };
    };

    return useMutation<TonConnectTransactionPayload, Error, NonNullableFields<CalculatedSwap>>(
        async swap => {
            const resultsPromises = [encodeAs('external', swap)];

            const batterySwapsEnabled = activeWalletConfig
                ? activeWalletConfig.batterySettings.enabledForSwaps
                : true;
            if (
                options.forceCalculateBattery ||
                (batteryBalance?.batteryUnitsBalance.gt(0) && batterySwapsEnabled)
            ) {
                resultsPromises.push(
                    encodeAs('battery', {
                        ...swap,
                        excessAddress: Address.parse(batteryExcess).toRawString()
                    })
                );
            }

            if (!isTon(swap.trade.from.asset.address)) {
                resultsPromises.push(
                    encodeAs('gasless', {
                        ...swap,
                        excessAddress: Address.parse(gaslessConfig.relayAddress).toRawString()
                    })
                );
            }

            const results = await Promise.all(resultsPromises);
            const gasMessage = results.find(r => r.variant === 'external')!.encoded;

            const tonConnectPayload: TonConnectTransactionPayload = {
                valid_until: (Date.now() + 10 * 60 * 1000) / 1000,
                messages: [
                    {
                        address: Address.parse(gasMessage.to).toString({ bounceable: true }),
                        amount: gasMessage.value,
                        payload: gasMessage.body
                    }
                ]
            };

            const batteryMessage = results.find(r => r.variant === 'battery')?.encoded;
            if (batteryMessage) {
                tonConnectPayload.messagesVariants = {
                    [TON_CONNECT_MSG_VARIANTS_ID.BATTERY]: {
                        messages: [
                            {
                                address: Address.parse(batteryMessage.to).toString({
                                    bounceable: true
                                }),
                                amount: batteryMessage.value,
                                payload: batteryMessage.body
                            }
                        ]
                    }
                };
            }

            const gaslessMessage = results.find(r => r.variant === 'gasless')?.encoded;
            if (gaslessMessage) {
                if (!tonConnectPayload.messagesVariants) {
                    tonConnectPayload.messagesVariants = {};
                }

                tonConnectPayload.messagesVariants[TON_CONNECT_MSG_VARIANTS_ID.GASLESS] = {
                    messages: [
                        {
                            address: Address.parse(gaslessMessage.to).toString({
                                bounceable: true
                            }),
                            amount: gaslessMessage.value,
                            payload: gaslessMessage.body
                        }
                    ],
                    options: {
                        asset: tonAssetAddressToString(swap.trade.from.asset.address)
                    }
                };
            }

            return tonConnectPayload;
        }
    );
}

const swapToProviderSwap = (
    swap: NonNullableFields<CalculatedSwap>
): Parameters<typeof SwapService.encodeSwap>[0]['swap'] => {
    if (swap.provider === 'stonfi') {
        return {
            provider: 'stonfi',
            stonfiTrade: swap.trade.rawTrade as {
                fromAsset: string;
                toAsset: string;
                fromAmount: string;
                toAmount: string;
                routerAddress: string;
            }
        };
    }
    if (swap.provider === 'dedust') {
        return {
            provider: 'dedust',
            dedustTrade: swap.trade.rawTrade as Array<{
                fromAsset: string;
                toAsset: string;
                fromAmount: string;
                toAmount: string;
                poolAddress: string;
            }>
        };
    }

    assertUnreachable(swap);
};
