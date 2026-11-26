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
import { AccountsApi, JettonBalance } from '../../../../tonApiV2';
import {
    Configuration,
    DefaultApi,
    EmulationApi,
    GaslessEstimation,
    MessageConsequences
} from '../../../../batteryApi';
import { WalletOutgoingMessage } from '../../encoder/types';
import { GaslessMessageSender } from '../gasless-message-sender';

const address = (n: number) => Address.parse('0:' + n.toString(16).padStart(64, '0'));

const walletAddress = address(1);
const batteryExcess = address(2);
const jettonMaster = address(3);
const ownJettonWallet = address(4);
const recipientJettonWallet = address(5);
const recipient = address(6);

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

const jettonTransferAction = (to: Address) => ({
    type: 'JettonTransfer',
    status: 'ok',
    jettonTransfer: { recipient: { address: to.toRawString() } }
});

const setup = () => {
    const estimateGaslessCost = vi
        .spyOn(DefaultApi.prototype, 'estimateGaslessCost')
        .mockResolvedValue({ commission: '12000' } as GaslessEstimation);
    const sendMessage = vi.spyOn(DefaultApi.prototype, 'sendMessage').mockResolvedValue();
    vi.spyOn(EmulationApi.prototype, 'emulateMessageToWallet').mockResolvedValue({
        event: {
            actions: [jettonTransferAction(recipient), jettonTransferAction(batteryExcess)]
        }
    } as unknown as MessageConsequences);
    vi.spyOn(AccountsApi.prototype, 'getAccountJettonBalance').mockResolvedValue({
        walletAddress: { address: ownJettonWallet.toRawString() },
        jetton: { address: jettonMaster.toRawString() }
    } as JettonBalance);
    const toExternal = vi
        .spyOn(
            GaslessMessageSender.prototype as unknown as {
                toExternal: (outgoing: WalletOutgoingMessage, commission: bigint) => Promise<Cell>;
            },
            'toExternal'
        )
        .mockResolvedValue(external);

    const sender = new GaslessMessageSender(
        {
            payWithAsset,
            excessAddress: batteryExcess.toRawString(),
            messageTtl: 300,
            authToken: 'token'
        },
        { tonApi: {} as APIConfig, batteryApi: {} as Configuration },
        wallet,
        {} as CellSigner
    );

    return { sender, toExternal, sendMessage, estimateGaslessCost };
};

const encodeCommission = (sender: GaslessMessageSender, amount: bigint) =>
    (
        sender as unknown as {
            encodeCommissionTransfer: (amount: bigint) => Promise<MessageRelaxed>;
        }
    ).encodeCommissionTransfer(amount);

describe('GaslessMessageSender', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('prices the locally built message set with the Battery and hides the fee transfer', async () => {
        const { sender, toExternal, estimateGaslessCost } = setup();

        const estimation = await sender.estimate(outgoing);

        expect(toExternal.mock.calls[0]).toEqual([outgoing, 1n]);
        expect(estimateGaslessCost).toHaveBeenCalledWith({
            jettonMaster: jettonMaster.toRawString(),
            estimateGaslessCostRequest: {
                payload: external.toBoc().toString('base64'),
                battery: false
            },
            xTonConnectAuth: 'token'
        });
        expect(estimation.fee.type === 'ton-asset' && estimation.fee.extra.stringWeiAmount).toBe(
            '12000'
        );
        expect(estimation.event?.actions).toEqual([jettonTransferAction(recipient)]);
    });

    it('signs the confirmed commission and sends through the Battery', async () => {
        const { sender, toExternal, sendMessage } = setup();

        const result = await sender
            .withConfirmedCommission(confirmedEstimation(payWithAsset, '12345'))
            .send(outgoing);

        expect(result).toBe(external);
        expect(toExternal.mock.calls[0]).toEqual([outgoing, 12345n]);
        expect(sendMessage).toHaveBeenCalledWith({
            xTonConnectAuth: 'token',
            sendMessageRequest: { boc: external.toBoc().toString('base64') }
        });
    });

    it('pays the commission from the own jetton wallet to the Battery excess account', async () => {
        const { sender } = setup();

        const commission = await encodeCommission(sender, 12345n);

        expect(
            commission.info.type === 'internal' && commission.info.dest.equals(ownJettonWallet)
        ).toBe(true);
        const body = commission.body.beginParse();
        expect(body.loadUint(32)).toBe(0xf8a7ea5);
        body.loadUintBig(64);
        expect(body.loadCoins()).toBe(12345n);
        expect(body.loadAddress().equals(batteryExcess)).toBe(true);
        expect(body.loadAddress().equals(batteryExcess)).toBe(true);
        expect(body.loadMaybeRef()).toBeNull();
        body.loadCoins();
        expect(body.loadRef().beginParse().loadUint(32)).toBe(0x878da6e3);
    });

    it('refuses to sign without a confirmed commission', async () => {
        const { sender, toExternal, sendMessage } = setup();

        await expect(sender.send(outgoing)).rejects.toThrow('Gasless commission is not confirmed');
        expect(toExternal).not.toHaveBeenCalled();
        expect(sendMessage).not.toHaveBeenCalled();
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
