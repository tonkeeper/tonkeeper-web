import { useMemo } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import BigNumber from 'bignumber.js';
import { AccountId } from '@tonkeeper/core/dist/entries/account';
import { TonWalletStandard } from '@tonkeeper/core/dist/entries/wallet';
import { Configuration, DefaultApi } from '@tonkeeper/core/dist/batteryApi';
import { getAppVersionHeaders } from '@tonkeeper/core/dist/utils/appVersion';

import { useAppSdk } from '../../hooks/appSdk';
import { useTranslation } from '../../hooks/translation';
import { QueryKey } from '../../libs/queryKey';
import {
    batteryAuthTokenStorageKey,
    useBatteryUnitTonRate,
    useRequestBatteryAuthToken
} from '../battery';
import { signTonConnectOver } from '../mnemonic';
import { FLAGGED_FEATURE, useIsFeatureEnabled } from '../tonendpoint';
import { useActiveConfig } from '../wallet';

/**
 * Battery config for the migration source. Unlike `useBatteryApi` it carries
 * no multichain wallet-id headers: the source is a legacy wallet whose
 * Battery is keyed on its own address, and that is the balance the
 * migration spends — as on iOS and Android. `undefined` while Battery is
 * disabled.
 */
export const useMigrationBatteryApi = (): Configuration | undefined => {
    const { batteryHost } = useActiveConfig();
    const enabled = useIsFeatureEnabled(FLAGGED_FEATURE.BATTERY);
    return useMemo(
        () =>
            enabled
                ? new Configuration({ basePath: batteryHost, headers: getAppVersionHeaders() })
                : undefined,
        [enabled, batteryHost]
    );
};

export const useMigrationBatteryToken = (publicKey: string | undefined) => {
    const sdk = useAppSdk();
    return useQuery([QueryKey.batteryAuthToken, publicKey], async () => {
        if (!publicKey) {
            return null;
        }
        const stored = await sdk.storage.get<{ token: string }>(
            batteryAuthTokenStorageKey(publicKey)
        );
        return stored?.token ?? null;
    });
};

/** `undefined` until the source's Battery is authorized and its balance is read. */
export const useMigrationBatteryCharges = (publicKey: string | undefined) => {
    const api = useMigrationBatteryApi();
    const rate = useBatteryUnitTonRate();
    const { data: authToken } = useMigrationBatteryToken(publicKey);

    const { data: availableCharges } = useQuery(
        [QueryKey.batteryBalance, 'migration', publicKey, authToken, rate],
        async () => {
            const balance = await new DefaultApi(api!).getBalance({
                xTonConnectAuth: authToken!,
                units: 'ton'
            });
            return new BigNumber(balance.balance)
                .div(rate)
                .integerValue(BigNumber.ROUND_FLOOR)
                .toNumber();
        },
        { enabled: !!api && !!authToken }
    );

    return { authToken, availableCharges };
};

/**
 * Mints the source wallet's Battery token with a TonProof signed by the
 * source key — the natives create it when the wallet is added, the web only
 * on first Battery use, so a legacy wallet usually has none yet.
 */
export const useAuthorizeMigrationBattery = () => {
    const api = useMigrationBatteryApi();
    const sdk = useAppSdk();
    const { t } = useTranslation();
    const { mutateAsync: requestToken } = useRequestBatteryAuthToken();

    return useMutation<string, Error, { accountId: AccountId; wallet: TonWalletStandard }>(
        async ({ accountId, wallet }) => {
            if (!api) {
                throw new Error('Battery is disabled');
            }
            return requestToken({
                wallet,
                batteryApi: api,
                signer: signTonConnectOver({ sdk, accountId, wallet, t })
            });
        }
    );
};
