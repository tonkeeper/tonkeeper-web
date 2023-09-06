import { useEffect, useMemo, useRef } from 'react';
import { useGetToAccount } from '../../components/transfer/RecipientView';
import { TonRecipientData } from '@tonkeeper/core/dist/entries/send';
import { BLOCKCHAIN_NAME } from '@tonkeeper/core/dist/entries/crypto';

export function useTonRecipient(address: string): {
    recipient: TonRecipientData;
    isLoading: boolean;
} {
    const isFirstRender = useRef(true);
    const { isLoading, data: toAccount, mutate: mutateRecipient } = useGetToAccount();
    useEffect(() => {
        isFirstRender.current = false;
        mutateRecipient({ address });
    }, [address]);
    const recipient = useMemo(
        () => ({
            address: { address, blockchain: BLOCKCHAIN_NAME.TON } as const,
            comment: '',
            done: false,
            toAccount: toAccount!
        }),
        [toAccount]
    );

    return {
        recipient,
        isLoading: isFirstRender.current ? true : isLoading
    };
}
