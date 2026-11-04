import { useMutation } from '@tanstack/react-query';
import { createOfframpOrder } from '@tonkeeper/core/dist/offrampApi';
import type { CreateOfframpOrderRequest, OfframpOrder } from '@tonkeeper/core/dist/offrampApi';
import { useActiveConfig } from '../wallet';
import { useOnrampClientContext } from '../onramp/useOnrampClientContext';

export const useCreateOfframpOrder = () => {
    const config = useActiveConfig();
    const ctx = useOnrampClientContext();
    const baseUrl = config.web_swaps_url ?? '';

    return useMutation<OfframpOrder, Error, CreateOfframpOrderRequest>(body =>
        createOfframpOrder(baseUrl, {
            createOfframpOrderRequest: body,
            deviceCountryCode: ctx.deviceCountryCode,
            timezone: ctx.timezone,
            platform: ctx.platform,
            build: ctx.build
        })
    );
};
