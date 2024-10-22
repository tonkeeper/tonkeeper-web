import { useMutation } from '@tanstack/react-query';
import { useActiveMultisigAccountHost, useActiveMultisigWalletInfo } from '../../../state/multisig';
import { useAsyncQueryData } from '../../useAsyncQueryData';
import { MultisigOrder } from '@tonkeeper/core/dist/tonApiV2';
import { useInvalidateActiveWalletQueries } from '../../../state/wallet';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { useTonRawTransactionService } from '../useBlockchainService';
import { useGetSender } from '../useSender';
import { TON_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';

import { useAppContext } from '../../appContext';
import { useNotifyErrorHandle } from '../../useNotification';
import { MultisigEncoder } from '@tonkeeper/core/dist/service/ton-blockchain/encoder/multisig-encoder/multisig-encoder';

export function useSendExisitingMultisigOrder(orderAddress: MultisigOrder['address']) {
    const { data: multisigInfoData } = useActiveMultisigWalletInfo();
    const multisigInfoPromise = useAsyncQueryData(multisigInfoData);
    const { mutateAsync: invalidateAccountQueries } = useInvalidateActiveWalletQueries();
    const { signerWallet } = useActiveMultisigAccountHost();
    const { api } = useAppContext();

    const rawTransactionService = useTonRawTransactionService();
    const getSender = useGetSender();
    const notifyError = useNotifyErrorHandle();

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

            await rawTransactionService.send(
                await getSender({ type: 'external' }),
                {
                    fee: new AssetAmount({ asset: TON_ASSET, weiAmount: 0 })
                },
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
