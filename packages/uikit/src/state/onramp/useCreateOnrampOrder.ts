import { useMutation } from '@tanstack/react-query';
import { createOnrampOrder } from '@tonkeeper/core/dist/onrampApi';
import type { CreateOnrampOrderRequest, OnrampOrder } from '@tonkeeper/core/dist/onrampApi';
import { useActiveConfig } from '../wallet';
import { useOnrampClientContext } from './useOnrampClientContext';

export const useCreateOnrampOrder = () => {
    const config = useActiveConfig();
    const ctx = useOnrampClientContext();
    const baseUrl = config.web_swaps_url ?? '';

    return useMutation<OnrampOrder, Error, CreateOnrampOrderRequest>(body =>
        createOnrampOrder(baseUrl, {
            createOnrampOrderRequest: body,
            deviceCountryCode: ctx.deviceCountryCode,
            timezone: ctx.timezone,
            platform: ctx.platform,
            build: ctx.build,
            xWalletID: ctx.walletId
        })
    );
};
