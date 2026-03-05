import { Address, beginCell, toNano } from '@ton/core';
import { APIConfig } from '../../../entries/apis';
import { TonConnectTransactionPayload } from '../../../entries/tonConnect';
import { AccountsApi } from '../../../tonApiV2';
import { getTonkeeperQueryId } from '../utils';

const DEPOSIT_OP = 0x47d54391;
const BURN_OP = 0x595f07bc;

const STAKE_FEE_RES = toNano('1');
const UNSTAKE_FEE_RES = toNano('1.05');

export class StakingEncoder {
    constructor(private readonly api: APIConfig, private readonly walletAddress: string) {}

    encodeDeposit = (params: {
        poolAddress: string;
        amount: bigint;
    }): TonConnectTransactionPayload => {
        const body = beginCell()
            .storeUint(DEPOSIT_OP, 32)
            .storeUint(getTonkeeperQueryId(), 64)
            .storeUint(0, 64) // partnerCode = 0
            .endCell();

        return {
            valid_until: Math.floor((Date.now() + 10 * 60 * 1000) / 1000),
            messages: [
                {
                    address: Address.parse(params.poolAddress).toString({ bounceable: true }),
                    amount: (params.amount + STAKE_FEE_RES).toString(),
                    payload: body.toBoc().toString('base64')
                }
            ]
        };
    };

    encodeUnstake = async (params: {
        tsTonMasterAddress: string;
        amount: bigint;
    }): Promise<TonConnectTransactionPayload> => {
        const jettonBalance = await new AccountsApi(this.api.tonApiV2).getAccountJettonBalance({
            accountId: this.walletAddress,
            jettonId: params.tsTonMasterAddress
        });

        const jettonWalletAddress = jettonBalance.walletAddress.address;

        const customPayload = beginCell()
            .storeUint(1, 1) // waitTillRoundEnd = true
            .storeUint(0, 1) // fillOrKill = false
            .endCell();

        const body = beginCell()
            .storeUint(BURN_OP, 32)
            .storeUint(getTonkeeperQueryId(), 64)
            .storeCoins(params.amount)
            .storeAddress(Address.parse(this.walletAddress))
            .storeMaybeRef(customPayload)
            .endCell();

        return {
            valid_until: Math.floor((Date.now() + 10 * 60 * 1000) / 1000),
            messages: [
                {
                    address: Address.parse(jettonWalletAddress).toString({ bounceable: true }),
                    amount: UNSTAKE_FEE_RES.toString(),
                    payload: body.toBoc().toString('base64')
                }
            ]
        };
    };
}
