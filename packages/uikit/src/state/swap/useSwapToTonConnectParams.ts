import { useMutation } from '@tanstack/react-query';
import { useActiveTonWalletConfig } from '../wallet';
import {
    TON_CONNECT_MSG_VARIANTS_ID,
    TonConnectTransactionPayload
} from '@tonkeeper/core/dist/entries/tonConnect';
import { useBatteryBalance } from '../battery';
import type { SwapConfirmation } from '@tonkeeper/core/dist/swapsApi';

export function useSwapToTonConnectParams(options: { forceCalculateBattery?: boolean } = {}) {
    const { data: batteryBalance } = useBatteryBalance();
    const { data: activeWalletConfig } = useActiveTonWalletConfig();

    return useMutation<TonConnectTransactionPayload, Error, SwapConfirmation>(
        async confirmation => {
            const messages = confirmation.messages.map(msg => ({
                address: msg.targetAddress,
                amount: msg.sendAmount,
                payload: Buffer.from(msg.payload, 'hex').toString('base64')
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
