import { useMutation } from '@tanstack/react-query';
import { useActiveTonWalletConfig } from '../wallet';
import {
    TON_CONNECT_MSG_VARIANTS_ID,
    TonConnectTransactionPayload
} from '@tonkeeper/core/dist/entries/tonConnect';
import { useBatteryBalance } from '../battery';
import type { SwapConfirmation } from '@tonkeeper/core/dist/swapsApi';

function hexToBase64(hex: string): string {
    const bytes = new Uint8Array((hex.match(/.{1,2}/g) || []).map(byte => parseInt(byte, 16)));
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

export function useSwapToTonConnectParams(options: { forceCalculateBattery?: boolean } = {}) {
    const { data: batteryBalance } = useBatteryBalance();
    const { data: activeWalletConfig } = useActiveTonWalletConfig();

    return useMutation<TonConnectTransactionPayload, Error, SwapConfirmation>(
        async confirmation => {
            const messages = confirmation.messages.map(msg => ({
                address: msg.targetAddress,
                amount: msg.sendAmount,
                payload: hexToBase64(msg.payload)
            }));

            const validUntil = confirmation.tradeStartDeadline
                ? Number(confirmation.tradeStartDeadline)
                : (Date.now() + 10 * 60 * 1000) / 1000;

            const tonConnectPayload: TonConnectTransactionPayload = {
                valid_until: validUntil,
                messages
            };

            const batterySwapsEnabled = activeWalletConfig
                ? activeWalletConfig.batterySettings.enabledForSwaps
                : true;

            if (
                options.forceCalculateBattery ||
                (batteryBalance?.batteryUnitsBalance.gt(0) && batterySwapsEnabled)
            ) {
                tonConnectPayload.messagesVariants = {
                    [TON_CONNECT_MSG_VARIANTS_ID.BATTERY]: {
                        messages
                    }
                };
            }

            return tonConnectPayload;
        }
    );
}
