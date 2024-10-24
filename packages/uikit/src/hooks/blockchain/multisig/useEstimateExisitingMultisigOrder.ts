import { useMutation } from '@tanstack/react-query';
import { useAppContext } from '../../appContext';
import { useActiveMultisigWalletInfo } from '../../../state/multisig';
import { useAsyncQueryData } from '../../useAsyncQueryData';
import { AccountEvent, AccountsApi, MultisigOrder } from '@tonkeeper/core/dist/tonApiV2';
import {
    estimateExistingOrder,
    OrderEstimation
} from '@tonkeeper/core/dist/service/ton-blockchain/encoder/multisig-encoder';

export function useEstimateExisitingMultisigOrder(orderAddress: MultisigOrder['address']) {
    const { api } = useAppContext();
    const { data: multisigInfoData } = useActiveMultisigWalletInfo();
    const multisigInfoPromise = useAsyncQueryData(multisigInfoData);

    return useMutation<OrderEstimation, Error>(async () => {
        const multisig = await multisigInfoPromise;
        if (!multisig) {
            throw new Error('Multisig not found');
        }

        const order = multisig.orders.find(o => o.address === orderAddress);
        if (!order) {
            throw new Error('Order not found');
        }

        if (order.sentForExecution) {
            const accountsApi = new AccountsApi(api.tonApiV2);
            const result = await accountsApi.getAccountEvents({
                accountId: order.address,
                limit: 20
            });

            const executeOrderEvent = result.events.find(e =>
                e.actions.some(
                    a =>
                        a.type === 'SmartContractExec' &&
                        'smartContractExec' in a &&
                        a.smartContractExec?.operation === 'MultisigExecute' &&
                        a.smartContractExec.contract.address === multisig.address
                )
            );

            let event: AccountEvent;
            if (executeOrderEvent) {
                event = await accountsApi.getAccountEvent({
                    accountId: multisig.address,
                    eventId: executeOrderEvent.eventId
                });

                return {
                    type: 'transfer',
                    event
                } as const;
            } else {
                return estimateExistingOrder({
                    api,
                    multisig,
                    order
                });
            }
        }

        return estimateExistingOrder({
            api,
            multisig,
            order
        });
    });
}
