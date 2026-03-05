import { useMutation } from '@tanstack/react-query';
import { TonConnectTransactionPayload } from '@tonkeeper/core/dist/entries/tonConnect';
import { StakingEncoder } from '@tonkeeper/core/dist/service/ton-blockchain/encoder/staking-encoder';
import { PoolImplementationType, PoolInfo } from '@tonkeeper/core/dist/tonApiV2';
import { useActiveApi, useActiveWallet } from '../wallet';

interface EncodeStakingParams {
    pool: PoolInfo;
    amount: bigint;
    isSendAll?: boolean;
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
        async ({ pool, amount, isSendAll }) => {
            const encoder = new StakingEncoder(api, wallet.rawAddress);

            switch (pool.implementation) {
                case PoolImplementationType.Whales:
                    return encoder.encodeWhalesWithdraw({
                        poolAddress: pool.address,
                        amount: isSendAll ? 0n : amount
                    });
                case PoolImplementationType.Tf:
                    return encoder.encodeTfWithdraw({
                        poolAddress: pool.address
                    });
                case PoolImplementationType.LiquidTf:
                default:
                    if (!pool.liquidJettonMaster) {
                        throw new Error('Pool does not have a liquid jetton master');
                    }
                    return encoder.encodeUnstake({
                        tsTonMasterAddress: pool.liquidJettonMaster,
                        amount
                    });
            }
        }
    );
};
