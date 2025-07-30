import { FC, PropsWithChildren, useCallback } from 'react';
import { useEstimateTransfer } from '../../hooks/blockchain/useEstimateTransfer';
import { useSendTransfer } from '../../hooks/blockchain/useSendTransfer';
import { ConfirmState } from '../../state/pro';

import { Notification } from '../Notification';
import { ConfirmView } from '../transfer/ConfirmView';

export const ConfirmNotification: FC<{
    state: ConfirmState | null;
    onClose: (success?: boolean) => void;
    waitResult: (state: ConfirmState) => void;
}> = ({ state, onClose, waitResult }) => {
    const content = useCallback(() => {
        if (!state) return <></>;
        return (
            <ConfirmBuyProService
                {...state}
                onClose={confirmed => {
                    if (confirmed) {
                        waitResult(state);
                        setTimeout(() => onClose(true), 3000);
                    } else {
                        onClose();
                    }
                }}
            />
        );
    }, [state]);

    return (
        <Notification isOpen={state != null} hideButton handleClose={() => onClose()} backShadow>
            {content}
        </Notification>
    );
};

const ConfirmBuyProService: FC<
    PropsWithChildren<
        {
            onBack?: () => void;
            onClose: (confirmed?: boolean) => void;
            fitContent?: boolean;
        } & ConfirmState
    >
> = ({ ...rest }) => {
    const estimation = useEstimateTransfer({
        recipient: rest.recipient,
        amount: rest.assetAmount,
        isMax: false,
        senderType: 'external'
    });
    const mutation = useSendTransfer({
        recipient: rest.recipient,
        amount: rest.assetAmount,
        isMax: false,
        estimation: estimation.data!,
        senderType: 'external'
    });

    return <ConfirmView estimation={estimation} {...mutation} {...rest} />;
};
