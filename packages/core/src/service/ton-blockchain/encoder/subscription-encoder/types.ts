import { Address, Builder, Cell, MessageRelaxed } from '@ton/core';
import { StateInit as TonStateInit } from '@ton/core/dist/types/StateInit';
import { OutActionWalletV4 } from '@ton/ton/dist/wallets/WalletContractV4';
import { OutActionWalletV5 } from '@ton/ton/dist/wallets/v5beta/WalletV5OutActions';

export type EncodedSubscriptionResult = OutActionWalletV5[] | OutActionWalletV4;

export interface IPayloadEncoder {
    storeTag: (builder: Builder) => void;
    encodeCreateSubscription(
        body: Cell,
        stateInit: TonStateInit,
        deployValue: bigint
    ): EncodedSubscriptionResult;
    getInternalFromAction(outgoingMsg: EncodedSubscriptionResult, to?: Address): MessageRelaxed;
    encodeDestructAction(extension: Address, destroyValue: bigint): EncodedSubscriptionResult;
}
