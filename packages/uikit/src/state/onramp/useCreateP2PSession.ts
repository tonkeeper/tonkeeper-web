import { useMutation } from '@tanstack/react-query';
import { createP2PSession } from '@tonkeeper/core/dist/onrampApi';
import type { CreateP2PSessionRequest, P2PSessionResult } from '@tonkeeper/core/dist/onrampApi';
import { useActiveConfig } from '../wallet';

export const useCreateP2PSession = () => {
    const config = useActiveConfig();
    const baseUrl = config.web_swaps_url ?? '';

    return useMutation<P2PSessionResult, Error, CreateP2PSessionRequest>(body =>
        createP2PSession(baseUrl, body)
    );
};
