/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Account, ChainMediator, Fee, Transaction } from '@tonkeeper/chainkit';
import { Wallet, getBytes, isHexString } from 'ethers';

import { IAppSdk } from '../../AppSdk';
import { chainkit, loadChainkit, loadChainkitWallet } from '../../chains/chainkitLoader';
import { unwrap } from '../../chains/result';
import { AccountMultichain } from '../../entries/account';
import { ChainKitNetwork, chainKitChainOf, getChainKitMediator } from '../chainkit/chainKitClient';
import { MultichainFeeEstimation } from '../chainkit/multichainTransferService';
import { getAccountSecret } from '../sign/secrets';
import { inspectTronTransaction } from '../tron-blockchain/tron-transaction';
import { WalletConnectNetwork } from './wcChains';
import {
    Eip712TypedData,
    WalletConnectEvmTransaction,
    WalletConnectRequestPayload
} from './wcRequestTypes';

/**
 * Never contacted: WalletConnect TRON operations sign locally, but the
 * tronweb client requires a host to construct.
 */
const TRON_OFFLINE_HOST = 'https://api.trongrid.io';

const evmChainIdOf = (caipChain: string): number => Number(caipChain.split(':')[1]);

const parseQuantity = (value: string | undefined): bigint | undefined => {
    if (value === undefined) {
        return undefined;
    }
    return BigInt(value);
};

/**
 * `personal_sign` carries either hex-encoded message bytes (the common
 * case) or a plain UTF-8 string; ethers prefixes and hashes per EIP-191
 * either way.
 */
const personalMessageBytes = (message: string): Uint8Array | string =>
    isHexString(message) ? getBytes(message) : message;

/**
 * ethers derives the domain type itself and rejects an explicit
 * `EIP712Domain` entry in `types`, which dApp payloads always include.
 */
const typesWithoutDomain = (
    typedData: Eip712TypedData
): Record<string, { name: string; type: string }[]> => {
    const { EIP712Domain: _, ...types } = typedData.types;
    return types;
};

const getWalletConnectMnemonic = async (
    sdk: IAppSdk,
    account: AccountMultichain
): Promise<string[]> => {
    const secret = await getAccountSecret(sdk, account.id);
    if (secret.type !== 'mnemonic') {
        throw new Error('Unexpected secret type');
    }
    return secret.mnemonic;
};

const getChainPrivateKeyHex = async (
    mnemonic: string[],
    network: ChainKitNetwork
): Promise<string> => {
    const wallet = await loadChainkitWallet();
    const hex = wallet.derivePrivateKeyHex(mnemonic.join(' '), network);
    return hex.startsWith('0x') ? hex : `0x${hex}`;
};

const sameAddress = (network: WalletConnectNetwork, a: string, b: string): boolean => {
    const [left, right] = [a.trim(), b.trim()];
    return network === 'tron' ? left === right : left.toLowerCase() === right.toLowerCase();
};

/**
 * Every request names the account it is addressed to — the message signer
 * parameter, a transaction's `from`, the TRON `address` and the owner of
 * the contract a TRON transaction carries — and it must be the address of
 * the key that signs. A missing address is a mismatch.
 */
const assertRequestAddressedTo = async (
    mnemonic: string[],
    request: WalletConnectRequestPayload
): Promise<void> => {
    const wallet = await loadChainkitWallet();
    const ownAddress = wallet.deriveAddress(mnemonic.join(' '), request.network).address;
    const addressed = [request.address];
    if (request.kind === 'eth_signTransaction' || request.kind === 'eth_sendTransaction') {
        addressed.push(request.transaction.from ?? '');
    }
    if (request.kind === 'tron_signTransaction') {
        addressed.push(inspectTronTransaction(request.transaction).owner);
    }
    if (!addressed.every(a => a.trim() !== '' && sameAddress(request.network, a, ownAddress))) {
        throw new Error('Request address does not match the account');
    }
};

interface EvmCallContext {
    mediator: ChainMediator;
    account: Account;
    call: Transaction;
    fee: Fee;
}

/**
 * A WalletConnect `eth_sendTransaction` as a chain-kit contract call, with
 * the fee resolved by the wallet's own estimation (`calculateFee`, falling
 * back to `getDefaultFee`) — the dApp's gas fields are advisory, matching
 * the native apps and the send flow's fee treatment.
 */
const buildEvmCall = async (
    network: ChainKitNetwork,
    transaction: WalletConnectEvmTransaction,
    ownerPublicKeyHex?: string
): Promise<EvmCallContext> => {
    if (transaction.to === undefined) {
        throw new Error('Transaction without a recipient is not supported');
    }
    if (transaction.from === undefined) {
        throw new Error('Transaction without a sender is not supported');
    }
    const mediator = await getChainKitMediator(network);
    const chain = chainKitChainOf(network);
    const kit = chainkit();
    const asset = kit.Asset.Coin.Companion.of(chain);
    const address = kit.Address.Companion.force(transaction.from, chain);
    const account =
        ownerPublicKeyHex === undefined
            ? kit.Account.Companion.watch(address, asset)
            : kit.Account.Companion.owned(address, asset, ownerPublicKeyHex, '');
    const call = new kit.Transaction.Call(
        account,
        parseQuantity(transaction.value) ?? 0n,
        kit.Address.Companion.force(transaction.to, chain),
        transaction.data ?? ''
    );

    const calc = await mediator.fee.calculateFee(call);
    const fee = calc.isOk ? calc.unwrap() : unwrap(await mediator.fee.getDefaultFee(call));

    return { mediator, account, call, fee };
};

const sendEvmTransaction = async (
    network: ChainKitNetwork,
    transaction: WalletConnectEvmTransaction,
    mnemonic: string[]
): Promise<string> => {
    await loadChainkit();
    const chain = chainKitChainOf(network);
    const wallet = chainkit().CryptoWallet.Companion.fromMnemonic(mnemonic.join(' '));
    const { mediator, account, call, fee } = await buildEvmCall(
        network,
        transaction,
        wallet.getPublicKeyHex(chain)
    );

    const nonce =
        parseQuantity(transaction.nonce) ?? unwrap(await mediator.account.estimateNonce(account));
    const sigSet = unwrap(
        await mediator.sign.transaction.signAndEncodeWithPrivateKey(
            call,
            fee,
            nonce,
            wallet.getPrivateKey(chain)
        )
    );

    return unwrap(await mediator.transaction.sendEncodedTransaction(account, sigSet.firstOutput()));
};

/**
 * `eth_signTransaction` must return standard RLP-signed hex the dApp can
 * rebroadcast itself, so it is signed with ethers using exactly the gas
 * fields the dApp provided. Requests without complete gas parameters are
 * rejected rather than silently re-priced.
 */
const signEvmTransaction = async (
    caipChain: string,
    network: ChainKitNetwork,
    transaction: WalletConnectEvmTransaction,
    privateKeyHex: string
): Promise<string> => {
    const gasLimit = parseQuantity(transaction.gas ?? transaction.gasLimit);
    const gasPrice = parseQuantity(transaction.gasPrice);
    const maxFeePerGas = parseQuantity(transaction.maxFeePerGas);
    if (gasLimit === undefined || (gasPrice === undefined && maxFeePerGas === undefined)) {
        throw new Error('eth_signTransaction requires explicit gas parameters');
    }

    let nonce = parseQuantity(transaction.nonce);
    if (nonce === undefined) {
        const { mediator, account } = await buildEvmCall(network, transaction);
        nonce = unwrap(await mediator.account.estimateNonce(account));
    }

    return new Wallet(privateKeyHex).signTransaction({
        chainId: evmChainIdOf(caipChain),
        to: transaction.to,
        data: transaction.data ?? '0x',
        value: parseQuantity(transaction.value) ?? 0n,
        nonce: Number(nonce),
        gasLimit,
        ...(maxFeePerGas !== undefined
            ? {
                  maxFeePerGas,
                  maxPriorityFeePerGas: parseQuantity(transaction.maxPriorityFeePerGas)
              }
            : { gasPrice, type: 0 })
    });
};

/**
 * Signs (and for `eth_sendTransaction`, broadcasts) a decoded WalletConnect
 * request with the multichain account's keys. The returned value is the
 * JSON-RPC `result` to relay back: a hex signature / signed-transaction /
 * tx hash for EVM methods, a signature string for `tron_signMessage`, and
 * the signed transaction object for `tron_signTransaction`.
 *
 * Resolving the mnemonic triggers the app's unlock flow (password prompt
 * or keychain), so this must run from a user-confirmed context.
 */
export const executeWalletConnectRequest = async (
    sdk: IAppSdk,
    account: AccountMultichain,
    request: WalletConnectRequestPayload
): Promise<unknown> => {
    const mnemonic = await getWalletConnectMnemonic(sdk, account);
    return executeWalletConnectRequestWithMnemonic(mnemonic, request);
};

export const executeWalletConnectRequestWithMnemonic = async (
    mnemonic: string[],
    request: WalletConnectRequestPayload
): Promise<unknown> => {
    await assertRequestAddressedTo(mnemonic, request);
    switch (request.kind) {
        case 'personal_sign': {
            const privateKey = await getChainPrivateKeyHex(mnemonic, request.network);
            return new Wallet(privateKey).signMessage(personalMessageBytes(request.message));
        }
        case 'eth_signTypedData_v4': {
            const privateKey = await getChainPrivateKeyHex(mnemonic, request.network);
            return new Wallet(privateKey).signTypedData(
                request.typedData.domain,
                typesWithoutDomain(request.typedData),
                request.typedData.message
            );
        }
        case 'eth_signTransaction': {
            const privateKey = await getChainPrivateKeyHex(mnemonic, request.network);
            return signEvmTransaction(
                request.caipChain,
                request.network,
                request.transaction,
                privateKey
            );
        }
        case 'eth_sendTransaction': {
            return sendEvmTransaction(request.network, request.transaction, mnemonic);
        }
        case 'tron_signMessage': {
            const privateKey = await getChainPrivateKeyHex(mnemonic, 'tron');
            const { TronWeb } = await import('tronweb');
            const tronWeb = new TronWeb({
                fullHost: TRON_OFFLINE_HOST,
                privateKey: privateKey.slice(2)
            });
            return tronWeb.trx.signMessageV2(request.message);
        }
        case 'tron_signTransaction': {
            const privateKey = await getChainPrivateKeyHex(mnemonic, 'tron');
            const { TronWeb } = await import('tronweb');
            const tronWeb = new TronWeb({
                fullHost: TRON_OFFLINE_HOST,
                privateKey: privateKey.slice(2)
            });
            return tronWeb.trx.sign(request.transaction as any);
        }
        default: {
            const exhaustive: never = request;
            throw new Error(`Unsupported request ${(exhaustive as { kind: string }).kind}`);
        }
    }
};

/**
 * Network fee for the `eth_sendTransaction` confirm sheet, estimated the
 * same way the send flow does (no key material required).
 */
export const estimateWalletConnectSendFee = async (
    network: ChainKitNetwork,
    transaction: WalletConnectEvmTransaction
): Promise<MultichainFeeEstimation> => {
    const { fee } = await buildEvmCall(network, transaction);
    return {
        feeAmount: fee.amount,
        feeDecimals: fee.asset.decimals,
        feeSymbol: fee.asset.symbol
    };
};
