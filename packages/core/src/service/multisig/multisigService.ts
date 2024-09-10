import { MultisigOrder } from '../../tonApiV2';

export {
    deployMultisigAssetAmount,
    deployMultisig,
    estimateDeployMultisig,
    checkIfMultisigExists,
    type MultisigConfig
} from './deploy';

export { signOrder, sendCreateOrder } from './order/order-send';

export type MultisigOrderStatus = 'progress' | 'completed' | 'expired';

export function orderStatus(order: MultisigOrder): MultisigOrderStatus {
    if (order.sentForExecution) {
        return 'completed';
    }

    if (order.expirationDate * 1000 < Date.now()) {
        return 'progress';
    }

    return 'expired';
}
