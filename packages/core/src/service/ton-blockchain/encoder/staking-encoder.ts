import { Address, beginCell, toNano } from '@ton/core';
import { APIConfig } from '../../../entries/apis';
import { TonConnectTransactionPayload } from '../../../entries/tonConnect';
import { AccountsApi } from '../../../tonApiV2';
import { getTonkeeperQueryId } from '../utils';

const DEPOSIT_OP = 0x47d54391;
const BURN_OP = 0x595f07bc;
const WHALES_WITHDRAW_OP = 0xda803efd;

export const STAKE_GAS_RESERVE_TON = 1;
export const UNSTAKE_LIQUID_GAS_TON = 1.05;
export const UNSTAKE_WHALES_GAS_TON = 0.2;
export const UNSTAKE_TF_GAS_TON = 1;

const STAKE_FEE_RES = toNano(STAKE_GAS_RESERVE_TON.toString());
const UNSTAKE_FEE_RES = toNano(UNSTAKE_LIQUID_GAS_TON.toString());

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
        isSendAll?: boolean;
    }): Promise<TonConnectTransactionPayload> => {
        const jettonBalance = await new AccountsApi(this.api.tonApiV2).getAccountJettonBalance({
            accountId: this.walletAddress,
            jettonId: params.tsTonMasterAddress
        });

        const jettonWalletAddress = jettonBalance.walletAddress.address;
        const burnAmount = params.isSendAll ? BigInt(jettonBalance.balance) : params.amount;

        const customPayload = beginCell()
            .storeUint(1, 1) // waitTillRoundEnd = true
            .storeUint(0, 1) // fillOrKill = false
            .endCell();

        const body = beginCell()
            .storeUint(BURN_OP, 32)
            .storeUint(getTonkeeperQueryId(), 64)
            .storeCoins(burnAmount)
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

    encodeWhalesWithdraw = (params: {
        poolAddress: string;
        amount: bigint;
    }): TonConnectTransactionPayload => {
        const body = beginCell()
            .storeUint(WHALES_WITHDRAW_OP, 32)
            .storeUint(getTonkeeperQueryId(), 64)
            .storeCoins(toNano('0.1'))
            .storeCoins(params.amount)
            .endCell();

        return {
            valid_until: Math.floor((Date.now() + 10 * 60 * 1000) / 1000),
            messages: [
                {
                    address: Address.parse(params.poolAddress).toString({ bounceable: true }),
                    amount: toNano(UNSTAKE_WHALES_GAS_TON.toString()).toString(),
                    payload: body.toBoc().toString('base64')
                }
            ]
        };
    };

    encodeTfWithdraw = (params: { poolAddress: string }): TonConnectTransactionPayload => {
        const body = beginCell().storeUint(0, 32).storeBuffer(Buffer.from('w')).endCell();

        return {
            valid_until: Math.floor((Date.now() + 10 * 60 * 1000) / 1000),
            messages: [
                {
                    address: Address.parse(params.poolAddress).toString({ bounceable: true }),
                    amount: toNano(UNSTAKE_TF_GAS_TON.toString()).toString(),
                    payload: body.toBoc().toString('base64')
                }
            ]
        };
    };
}
