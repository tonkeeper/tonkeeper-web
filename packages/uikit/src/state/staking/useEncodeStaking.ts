import { useMutation } from '@tanstack/react-query';
import { TonConnectTransactionPayload } from '@tonkeeper/core/dist/entries/tonConnect';
import { StakingEncoder } from '@tonkeeper/core/dist/service/ton-blockchain/encoder/staking-encoder';
import { PoolInfo } from '@tonkeeper/core/dist/tonApiV2';
import { useActiveApi, useActiveWallet } from '../wallet';

interface EncodeStakingParams {
    pool: PoolInfo;
    amount: bigint;
}

export const useEncodeStakingDeposit = () => {
    const wallet = useActiveWallet();
    const api = useActiveApi();

    return useMutation<TonConnectTransactionPayload, Error, EncodeStakingParams>(
        async ({ pool, amount }) => {
            const encoder = new StakingEncoder(api, wallet.rawAddress);
            return encoder.encodeDeposit({
                poolAddress: pool.address,
                amount
            });
        }
    );
};

export const useEncodeStakingUnstake = () => {
    const wallet = useActiveWallet();
    const api = useActiveApi();

    return useMutation<TonConnectTransactionPayload, Error, EncodeStakingParams>(
        async ({ pool, amount }) => {
            if (!pool.liquidJettonMaster) {
                throw new Error('Pool does not have a liquid jetton master');
            }

            const encoder = new StakingEncoder(api, wallet.rawAddress);
            return encoder.encodeUnstake({
                tsTonMasterAddress: pool.liquidJettonMaster,
                amount
            });
        }
    );
};
