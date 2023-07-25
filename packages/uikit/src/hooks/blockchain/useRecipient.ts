import { useGetToAccount } from '../../components/transfer/RecipientView';
import { useEffect, useMemo, useRef } from 'react';

export function useRecipient(address: string) {
    const isFirstRender = useRef(true);
    const { isLoading, data: toAccount, mutate: mutateRecipient } = useGetToAccount();
    useEffect(() => {
        isFirstRender.current = false;
        mutateRecipient({ address });
    }, [address]);
    const recipient = useMemo(
        () => ({
            address: { address },
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
