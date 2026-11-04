/* eslint-disable import/no-extraneous-dependencies */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Address, beginCell, Cell, internal, MessageRelaxed, SendMode, toNano } from '@ton/core';
import { APIConfig } from '../../../../entries/apis';
import { CellSigner } from '../../../../entries/signer';
import { TonWalletStandard, WalletVersion } from '../../../../entries/wallet';
import { TonAsset } from '../../../../entries/crypto/asset/ton-asset';
import { AssetAmount } from '../../../../entries/crypto/asset/asset-amount';
import { scaledUIMultiplierOne } from '../../../../entries/crypto/asset/scaled-ui';
import { TonEstimation } from '../../../../entries/send';
import {
    AccountsApi,
    GaslessApi,
    GaslessTx,
    JettonBalance,
    SignRawParams
} from '../../../../tonApiV2';
import { WalletOutgoingMessage } from '../../encoder/types';
import { GaslessMessageSender } from '../gasless-message-sender';

const address = (n: number) => Address.parse('0:' + n.toString(16).padStart(64, '0'));

const walletAddress = address(1);
const relayerAddress = address(2);
const jettonMaster = address(3);
const ownJettonWallet = address(4);
const recipientJettonWallet = address(5);
const attackerAddress = address(6);

const wallet = {
    id: walletAddress.toRawString(),
    rawAddress: walletAddress.toRawString(),
    publicKey: '0'.repeat(64),
    version: WalletVersion.V5R1
} as TonWalletStandard;

const payWithAsset = {
    id: 'usdt',
    address: jettonMaster,
    decimals: 6,
    scaledUIMultiplier: scaledUIMultiplierOne
} as unknown as TonAsset;

const otherAsset = { ...payWithAsset, id: 'other' } as TonAsset;

const confirmedEstimation = (asset: TonAsset, weiAmount: string): TonEstimation => ({
    fee: { type: 'ton-asset', extra: new AssetAmount({ asset, weiAmount }) }
});

const external = beginCell().storeUint(0xdeadbeef, 32).endCell();

const outgoing: WalletOutgoingMessage = {
    messages: [
        internal({
            to: recipientJettonWallet,
            value: toNano(0.05),
            bounce: true,
            body: beginCell().storeUint(0xf8a7ea5, 32).storeUint(1, 64).endCell()
        })
    ],
    sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS
};

const relayerResponse = {
    relayAddress: relayerAddress.toRawString(),
    commission: '999999999',
    from: walletAddress.toRawString(),
    validUntil: 0,
    messages: [
        {
            address: attackerAddress.toRawString(),
            amount: toNano(1000).toString(),
            payload: beginCell().storeUint(0x1337, 32).endCell().toBoc().toString('hex')
        }
    ]
} as SignRawParams;

const setup = () => {
    const gaslessEstimate = vi
        .spyOn(GaslessApi.prototype, 'gaslessEstimate')
        .mockResolvedValue(relayerResponse);
    const gaslessSend = vi
        .spyOn(GaslessApi.prototype, 'gaslessSend')
        .mockResolvedValue({} as GaslessTx);
    vi.spyOn(AccountsApi.prototype, 'getAccountJettonBalance').mockResolvedValue({
        walletAddress: { address: ownJettonWallet.toRawString() },
        jetton: { address: jettonMaster.toRawString() }
    } as JettonBalance);
    const toExternal = vi
        .spyOn(
            GaslessMessageSender.prototype as unknown as {
                toExternal: (outgoing: WalletOutgoingMessage) => Promise<Cell>;
            },
            'toExternal'
        )
        .mockResolvedValue(external);

    const sender = new GaslessMessageSender(
        { payWithAsset, relayerAddress: relayerAddress.toRawString() },
        {} as APIConfig,
        wallet,
        {} as CellSigner
    );

    return { sender, toExternal, gaslessSend, gaslessEstimate };
};

const signedMessages = (toExternal: ReturnType<typeof setup>['toExternal']) =>
    (toExternal.mock.calls[0][0] as WalletOutgoingMessage).messages;

const destination = (message: MessageRelaxed) =>
    message.info.type === 'internal' ? message.info.dest : undefined;

describe('GaslessMessageSender', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('signs the outgoing messages unchanged and never asks the relayer what to sign', async () => {
        const { sender, toExternal, gaslessSend, gaslessEstimate } = setup();

        const result = await sender
            .withConfirmedCommission(confirmedEstimation(payWithAsset, '12345'))
            .send(outgoing);

        expect(result).toBe(external);
        expect(gaslessEstimate).not.toHaveBeenCalled();
        const messages = signedMessages(toExternal);
        expect(messages).toHaveLength(2);
        expect(messages[0]).toBe(outgoing.messages[0]);
        expect(messages.some(m => destination(m)?.equals(attackerAddress))).toBe(false);
        expect(gaslessSend).toHaveBeenCalledWith({
            gaslessSendRequest: {
                walletPublicKey: wallet.publicKey,
                boc: external.toBoc().toString('base64')
            }
        });
    });

    it('pays the confirmed commission to the configured relayer from the own jetton wallet', async () => {
        const { sender, toExternal } = setup();

        await sender
            .withConfirmedCommission(confirmedEstimation(payWithAsset, '12345'))
            .send(outgoing);

        const commission = signedMessages(toExternal)[1];
        expect(destination(commission)?.equals(ownJettonWallet)).toBe(true);

        const body = commission.body.beginParse();
        expect(body.loadUint(32)).toBe(0xf8a7ea5);
        body.loadUintBig(64);
        expect(body.loadCoins()).toBe(12345n);
        expect(body.loadAddress().equals(relayerAddress)).toBe(true);
        expect(body.loadAddress().equals(relayerAddress)).toBe(true);
        expect(body.loadMaybeRef()).toBeNull();
        body.loadCoins();
        expect(body.loadRef().beginParse().loadUint(32)).toBe(0x878da6e3);
    });

    it('refuses to sign without a confirmed commission', async () => {
        const { sender, toExternal, gaslessSend } = setup();

        await expect(sender.send(outgoing)).rejects.toThrow('Gasless commission is not confirmed');
        expect(toExternal).not.toHaveBeenCalled();
        expect(gaslessSend).not.toHaveBeenCalled();
    });

    it('rejects an estimation priced in another asset or in TON battery charges', () => {
        const { sender } = setup();

        expect(() =>
            sender.withConfirmedCommission(confirmedEstimation(otherAsset, '12345'))
        ).toThrow('Estimation does not carry a gasless commission');
        expect(() =>
            sender.withConfirmedCommission({
                fee: { type: 'battery', charges: 1 }
            } as TonEstimation)
        ).toThrow('Estimation does not carry a gasless commission');
        expect(() =>
            sender.withConfirmedCommission(confirmedEstimation(payWithAsset, '-1'))
        ).toThrow('Estimation does not carry a gasless commission');
    });
});
