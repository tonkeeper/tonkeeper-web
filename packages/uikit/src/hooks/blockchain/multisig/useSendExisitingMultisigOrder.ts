import { useMutation } from '@tanstack/react-query';
import { useActiveMultisigAccountHost, useActiveMultisigWalletInfo } from '../../../state/multisig';
import { useAsyncQueryData } from '../../useAsyncQueryData';
import { MultisigOrder } from '@tonkeeper/core/dist/tonApiV2';
import { useActiveApi, useInvalidateActiveWalletQueries } from '../../../state/wallet';
import { EXTERNAL_SENDER_CHOICE, useGetSender } from '../useSender';

import { useNotifyErrorHandle } from '../../useNotification';
import { MultisigEncoder } from '@tonkeeper/core/dist/service/ton-blockchain/encoder/multisig-encoder/multisig-encoder';
import { zeroFeeEstimation } from '@tonkeeper/core/dist/service/ton-blockchain/utils';
import { TonRawTransactionService } from '@tonkeeper/core/dist/service/ton-blockchain/ton-raw-transaction.service';

export function useSendExisitingMultisigOrder(orderAddress: MultisigOrder['address']) {
    const { data: multisigInfoData } = useActiveMultisigWalletInfo();
    const multisigInfoPromise = useAsyncQueryData(multisigInfoData);
    const { mutateAsync: invalidateAccountQueries } = useInvalidateActiveWalletQueries();
    const { signerWallet } = useActiveMultisigAccountHost();

    const getSender = useGetSender();
    const notifyError = useNotifyErrorHandle();
    const api = useActiveApi();

    return useMutation<boolean, Error>(async () => {
        try {
            const multisig = await multisigInfoPromise;
            if (!multisig) {
                throw new Error('Multisig not found');
            }

            const message = new MultisigEncoder(api, signerWallet.rawAddress).encodeSignOrder(
                multisig,
                orderAddress
            );

            await new TonRawTransactionService(api, signerWallet).send(
                await getSender(EXTERNAL_SENDER_CHOICE),
                zeroFeeEstimation,
                message
            );

            await invalidateAccountQueries();
            return true;
        } catch (e) {
            await notifyError(e);
            throw e;
        }
    });
}
