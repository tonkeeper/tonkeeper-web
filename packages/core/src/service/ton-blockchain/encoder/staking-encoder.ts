import { Address, beginCell, Cell, toNano } from '@ton/core';
import { APIConfig } from '../../../entries/apis';
import { TonConnectTransactionPayload } from '../../../entries/tonConnect';
import { AccountsApi, PoolImplementationType } from '../../../tonApiV2';
import { getTonkeeperQueryId } from '../utils';

const DEPOSIT_OP = 0x47d54391;
const WHALES_DEPOSIT_OP = 0x7bcd1fef;
const BURN_OP = 0x595f07bc;
const WHALES_WITHDRAW_OP = 0xda803efd;
const TONSTAKERS_REFERRAL_CODE = 0x000000000005b7c2;

/**
 * Tonstakers returns exactly this much of a deposit and stakes the rest, so
 * anything attached above it ends up staked rather than refunded.
 */
const STAKE_LIQUID_RESERVE_TON = 1;

const UNSTAKE_LIQUID_RESERVE_TON = 1;
export const STAKE_GAS_RESERVE_TON = 1.05;
export const UNSTAKE_LIQUID_GAS_TON = 1.05;
export const UNSTAKE_WHALES_GAS_TON = 0.2;
export const UNSTAKE_TF_GAS_TON = 1;

const STAKE_FEE_RES = toNano(STAKE_LIQUID_RESERVE_TON.toString());
const UNSTAKE_FEE_RES = toNano(UNSTAKE_LIQUID_RESERVE_TON.toString());

/**
 * TON a Tonstakers stake or unstake attaches on top of the amount; the pool
 * returns it once the operation settles. Other pool types hold nothing back.
 */
export const stakeTemporaryReserveTon = (implementation: PoolImplementationType): number =>
    implementation === PoolImplementationType.LiquidTf ? STAKE_LIQUID_RESERVE_TON : 0;

export const unstakeTemporaryReserveTon = (implementation: PoolImplementationType): number =>
    implementation === PoolImplementationType.LiquidTf ? UNSTAKE_LIQUID_RESERVE_TON : 0;

/** TON that must stay in the wallet after a stake: the temporary reserve plus the network fee. */
export const stakeBalanceReserveTon = (implementation: PoolImplementationType): number =>
    implementation === PoolImplementationType.LiquidTf ? 1.1 : 0.1;

/** Minimum TON balance to start a withdrawal: the value the message attaches plus the network fee. */
export const unstakeRequiredBalanceTon = (implementation: PoolImplementationType): number => {
    switch (implementation) {
        case PoolImplementationType.Whales:
            return 0.3;
        case PoolImplementationType.Tf:
        case PoolImplementationType.LiquidTf:
        default:
            return 1.1;
    }
};

export class StakingEncoder {
    constructor(private readonly api: APIConfig, private readonly walletAddress: string) {}

    encodeDeposit = (params: {
        poolAddress: string;
        amount: bigint;
        implementation: PoolImplementationType;
    }): TonConnectTransactionPayload => {
        const { body, value } = this.depositMessage(params);

        return {
            valid_until: Math.floor((Date.now() + 10 * 60 * 1000) / 1000),
            messages: [
                {
                    address: Address.parse(params.poolAddress).toString({ bounceable: true }),
                    amount: value.toString(),
                    payload: body.toBoc().toString('base64')
                }
            ]
        };
    };

    private depositMessage = (params: {
        amount: bigint;
        implementation: PoolImplementationType;
    }): { body: Cell; value: bigint } => {
        switch (params.implementation) {
            case PoolImplementationType.Whales:
                return {
                    body: beginCell()
                        .storeUint(WHALES_DEPOSIT_OP, 32)
                        .storeUint(getTonkeeperQueryId(), 64)
                        .storeCoins(toNano('0.1'))
                        .endCell(),
                    value: params.amount
                };
            case PoolImplementationType.Tf:
                return {
                    body: beginCell().storeUint(0, 32).storeStringTail('d').endCell(),
                    value: params.amount
                };
            case PoolImplementationType.LiquidTf:
            default:
                return {
                    body: beginCell()
                        .storeUint(DEPOSIT_OP, 32)
                        .storeUint(getTonkeeperQueryId(), 64)
                        .storeUint(TONSTAKERS_REFERRAL_CODE, 64)
                        .endCell(),
                    value: params.amount + STAKE_FEE_RES
                };
        }
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
