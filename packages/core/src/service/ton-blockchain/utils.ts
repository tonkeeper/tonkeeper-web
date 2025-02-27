import { Address, beginCell, Cell, external, loadStateInit, storeMessage } from '@ton/core';
import { sign } from '@ton/crypto';
import { WalletVersion } from '../../entries/wallet';
import { AssetAmount } from '../../entries/crypto/asset/asset-amount';
import { TON_ASSET } from '../../entries/crypto/asset/constants';
import { Maybe } from '@ton/core/dist/utils/maybe';
import { WalletContract } from '../wallet/contractService';
import { APIConfig } from '../../entries/apis';
import BigNumber from 'bignumber.js';
import { NotEnoughBalanceError } from '../../errors/NotEnoughBalanceError';
import { Account, AccountsApi, LiteServerApi, WalletApi } from '../../tonApiV2';
import nacl from 'tweetnacl';
import { AssetIdentification } from '../../entries/crypto/asset/asset-identification';
import { BLOCKCHAIN_NAME } from '../../entries/crypto';
import {
    isTon,
    jettonToTonAssetAmount,
    tonAssetAddressToString
} from '../../entries/crypto/asset/ton-asset';
import { formatAddress } from '../../utils/common';
import { TonEstimation } from '../../entries/send';

export const estimationSigner = async (message: Cell): Promise<Buffer> => {
    return sign(message.hash(), Buffer.alloc(64));
};
estimationSigner.type = 'cell' as const;

export const MAX_ALLOWED_WALLET_MSGS = {
    [WalletVersion.V5R1]: 255,
    [WalletVersion.V5_BETA]: 255,
    [WalletVersion.V4R2]: 4,
    [WalletVersion.V4R1]: 4,
    [WalletVersion.V3R2]: 4,
    [WalletVersion.V3R1]: 4
};
export const assertMessagesNumberSupported = (
    messagesNumber: number,
    walletVersion: WalletVersion
) => {
    if (messagesNumber > MAX_ALLOWED_WALLET_MSGS[walletVersion]) {
        throw new Error(
            `Max number of transfers in one multi transfer exceeded. Max allowed is ${MAX_ALLOWED_WALLET_MSGS[walletVersion]}, but got ${messagesNumber}.`
        );
    }
};

export const zeroFeeEstimation: TonEstimation = {
    fee: { type: 'ton-asset' as const, extra: new AssetAmount({ asset: TON_ASSET, weiAmount: 0 }) }
};

export type StateInit = ReturnType<typeof toStateInit>;

export const toStateInit = (
    stateInit?: string
): { code: Maybe<Cell>; data: Maybe<Cell> } | undefined => {
    if (!stateInit) {
        return undefined;
    }
    const { code, data } = loadStateInit(Cell.fromBase64(stateInit).asSlice());
    return {
        code,
        data
    };
};

export const externalMessage = (contract: WalletContract, seqno: number, body: Cell) => {
    return beginCell()
        .storeWritable(
            storeMessage(
                external({
                    to: contract.address,
                    init: seqno === 0 ? contract.init : undefined,
                    body: body
                })
            )
        )
        .endCell();
};

export const assertBalanceEnough = async (
    api: APIConfig,
    totalWei: BigNumber | bigint,
    asset: AssetIdentification,
    walletAddress: string
) => {
    const balance = await getWalletBalance(api, walletAddress, asset);

    if (!(totalWei instanceof BigNumber)) {
        totalWei = new BigNumber(totalWei.toString());
    }

    const total = new AssetAmount({ asset: balance.asset, weiAmount: totalWei });

    if (totalWei.isGreaterThan(balance.weiAmount)) {
        throw new NotEnoughBalanceError(
            `Not enough account "${formatAddress(walletAddress)}" amount: "${
                balance.stringAssetRelativeAmount
            }", transaction total: ${total.stringAssetRelativeAmount}`,
            balance,
            total
        );
    }
};

export const getWalletSeqNo = async (api: APIConfig, accountId: string) => {
    const { seqno } = await new WalletApi(api.tonApiV2)
        .getAccountSeqno({ accountId })
        .catch(() => ({ seqno: 0 }));
    return seqno;
};

export const getWalletBalance = async (
    api: APIConfig,
    walletAddress: string,
    asset: AssetIdentification
) => {
    if (asset.blockchain !== BLOCKCHAIN_NAME.TON) {
        throw new Error('Tron assets are not supported');
    }

    if (isTon(asset.address)) {
        const wallet = await new AccountsApi(api.tonApiV2).getAccount({
            accountId: walletAddress
        });
        return new AssetAmount({ asset: TON_ASSET, weiAmount: BigNumber(wallet.balance) });
    }

    const jettonBalance = await new AccountsApi(api.tonApiV2).getAccountJettonBalance({
        accountId: walletAddress,
        jettonId: tonAssetAddressToString(asset.address)
    });

    return jettonToTonAssetAmount(jettonBalance);
};

export const getServerTime = async (api: APIConfig) => {
    const { time } = await new LiteServerApi(api.tonApiV2).getRawTime();
    return time;
};

export const getTTL = (unixTimestamp: number) => {
    // int Seconds
    return unixTimestamp + 300; // 5min
};

export const getTonkeeperQueryId = () => {
    return beginCell()
        .storeUint(0x546de4ef, 32) //crc32("tonkeeper")
        .storeBuffer(Buffer.from(nacl.randomBytes(4))) //random 32 bits
        .asSlice()
        .loadIntBig(64);
};

const isFriendlyNotBounceableAddress = (address: string) => {
    return Address.isFriendly(address) ? !Address.parseFriendly(address).isBounceable : false;
};

/**
 * UQ -> not bounceable
 * EQ, raw -> bounceable <=> account is active
 */
export async function userInputAddressIsBounceable(
    api: APIConfig,
    address: string,
    retryAmount = 10
) {
    const fetchAccount = async (retries = retryAmount): Promise<Account> => {
        try {
            return await new AccountsApi(api.tonApiV2).getAccount({
                accountId: Address.parse(address).toRawString()
            });
        } catch (error) {
            if (retries > 0) {
                await new Promise(resolve => setTimeout(resolve, 5000));
                return fetchAccount(retries - 1);
            } else {
                throw error;
            }
        }
    };

    const account = await fetchAccount();

    if (isFriendlyNotBounceableAddress(address)) {
        return false;
    }

    return account.status === 'active';
}

/**
 * UQ -> not bounceable
 * EQ -> bounceable
 * raw -> bounceable <=> account is active
 */
export async function tonConnectAddressIsBounceable(api: APIConfig, address: string) {
    if (Address.isFriendly(address)) {
        return Address.parseFriendly(address).isBounceable;
    }

    const account = await new AccountsApi(api.tonApiV2).getAccount({
        accountId: Address.parse(address).toRawString()
    });

    return account.status === 'active';
}
