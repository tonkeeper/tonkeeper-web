import { Address, Builder, Cell, MessageRelaxed } from '@ton/core';
import { StateInit as TonStateInit } from '@ton/core/dist/types/StateInit';

import { TonWalletStandard } from '../../../../entries/wallet';
import { OutActionWalletV4 } from '@ton/ton/dist/wallets/WalletContractV4';
import { OutActionWalletV5 } from '@ton/ton/dist/wallets/v5beta/WalletV5OutActions';
import { SubscriptionExtension, SubscriptionExtensionMetadata } from '../../../../pro';

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

export type DeployParams = {
    beneficiary: Address;
    subscriptionId?: number;
    firstChargingDate: number;
    paymentPerPeriod: bigint;
    period: number;
    gracePeriod: number;
    callerFee: bigint;
    deployValue: bigint;
    withdrawAddress: Address;
    withdrawMsgBody?: string;
    metadata?: SubscriptionExtensionMetadata;
    walletMetaKeyPair: nacl.SignKeyPair;
};

export type SubscriptionEncodingParams = {
    selectedWallet: TonWalletStandard;
} & SubscriptionExtension;
