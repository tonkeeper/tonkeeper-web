import { BLOCKCHAIN_NAME } from '@tonkeeper/core/dist/entries/crypto';
import { TonRecipientData } from '@tonkeeper/core/dist/entries/send';
import { formatAddress } from '@tonkeeper/core/dist/utils/common';
import { useEffect, useMemo, useRef } from 'react';
import { useGetToAccount } from '../../components/transfer/RecipientView';
import { useActiveTonNetwork } from '../../state/wallet';

export function useTonRecipient(address: string): {
    recipient: TonRecipientData;
    isLoading: boolean;
} {
    const network = useActiveTonNetwork();
    const isFirstRender = useRef(true);
    const { isLoading, data: toAccount, mutate: mutateRecipient } = useGetToAccount();
    useEffect(() => {
        isFirstRender.current = false;
        mutateRecipient({ address });
    }, [address]);
    const recipient = useMemo(
        () => ({
            address: {
                address: formatAddress(address, network, true),
                blockchain: BLOCKCHAIN_NAME.TON
            } as const,
            comment: '',
            done: false,
            toAccount: toAccount!
        }),
        [toAccount, network]
    );

    return {
        recipient,
        isLoading: isFirstRender.current ? true : isLoading
    };
}
