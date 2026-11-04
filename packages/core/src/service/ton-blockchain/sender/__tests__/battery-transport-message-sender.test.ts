/* eslint-disable import/no-extraneous-dependencies */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { beginCell } from '@ton/core';
import { Configuration } from '../../../../batteryApi';
import { APIConfig } from '../../../../entries/apis';
import { CellSigner } from '../../../../entries/signer';
import { TonWalletStandard, WalletVersion } from '../../../../entries/wallet';
import { BatteryTransportMessageSender } from '../battery-transport-message-sender';
import { WalletMessageSender } from '../wallet-message-sender';

const external = beginCell().storeUint(0xdeadbeef, 32).endCell();

const wallet = {
    id: '0:' + '0'.repeat(64),
    rawAddress: '0:' + '0'.repeat(64),
    publicKey: '0'.repeat(64),
    version: WalletVersion.V5R1
} as TonWalletStandard;

describe('BatteryTransportMessageSender', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('posts the wallet-signed external to battery /message with the TonProof token', async () => {
        vi.spyOn(WalletMessageSender.prototype, 'toExternal').mockResolvedValue(external);
        const fetchApi = vi.fn(async () => new Response(null, { status: 200 }));

        const sender = new BatteryTransportMessageSender(
            {} as APIConfig,
            wallet,
            {} as CellSigner,
            {
                api: new Configuration({ basePath: 'https://battery.test', fetchApi }),
                authToken: 'proof-token'
            }
        );

        const result = await sender.send({ messages: [], sendMode: 3 });

        expect(result).toBe(external);
        expect(fetchApi).toHaveBeenCalledTimes(1);
        const [url, init] = fetchApi.mock.calls[0] as unknown as [string, RequestInit];
        expect(url).toBe('https://battery.test/message');
        expect(init.method).toBe('POST');
        expect((init.headers as Record<string, string>)['X-TonConnect-Auth']).toBe('proof-token');
        expect(JSON.parse(init.body as string)).toEqual({
            boc: external.toBoc().toString('base64')
        });
    });

    it('pays its own fee, so it is still a wallet sender for fee checks', () => {
        const sender = new BatteryTransportMessageSender(
            {} as APIConfig,
            wallet,
            {} as CellSigner,
            { api: new Configuration(), authToken: 'proof-token' }
        );
        expect(sender).toBeInstanceOf(WalletMessageSender);
        expect(sender.excessAddress).toBe(wallet.rawAddress);
    });
});
