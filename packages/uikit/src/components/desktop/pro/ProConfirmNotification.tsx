import { styled } from 'styled-components';
import { ConfirmState } from '@tonkeeper/core/dist/entries/pro';

import { Notification } from '../../Notification';
import { FC, PropsWithChildren } from 'react';
import { useEstimateTransfer } from '../../../hooks/blockchain/useEstimateTransfer';
import { useSendTransfer } from '../../../hooks/blockchain/useSendTransfer';
import { ConfirmView } from '../../transfer/ConfirmView';
import { ErrorBoundary } from '../../shared/ErrorBoundary';
import { fallbackRenderOver } from '../../Error';

interface IProConfirmNotificationProps {
    onClose: () => void;
    confirmState: ConfirmState | null;
    onConfirm?: (success?: boolean) => void;
    onCancel?: () => void;
}

export const ProConfirmNotification: FC<IProConfirmNotificationProps> = props => {
    const { confirmState, onConfirm, onClose, onCancel } = props;

    return (
        <NotificationStyled
            isOpen={!!confirmState}
            handleClose={() => {
                onCancel?.();
                onClose();
            }}
            hideButton
            backShadow
        >
            {() =>
                confirmState ? (
                    <ErrorBoundary
                        fallbackRender={fallbackRenderOver('Failed to display Pro Confirm modal')}
                    >
                        <ProConfirmNotificationContent
                            {...confirmState}
                            onClose={confirmed => {
                                onConfirm?.(confirmed);
                                onClose();
                            }}
                        />
                    </ErrorBoundary>
                ) : (
                    <></>
                )
            }
        </NotificationStyled>
    );
};

const ProConfirmNotificationContent: FC<
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

const NotificationStyled = styled(Notification)`
    max-width: 650px;
`;
