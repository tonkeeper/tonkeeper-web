/* eslint-disable unused-imports/no-unused-vars,@typescript-eslint/no-unused-vars,no-console */
import { sha256_sync } from 'ton-crypto';
import nacl from 'tweetnacl';
import { FiatCurrencies } from '../entries/fiat';
import { Language } from '../entries/language';
import { Network } from '../entries/network';
import { WalletProxy } from '../entries/proxy';
import { WalletState, WalletVersion, WalletVoucher } from '../entries/wallet';
import { Configuration } from '../tonApiV1';
import { createExpireTimestamp } from './voucherService';

const tenMin = 10 * 60;
/**
 * backup.send sign:int512 primaryPublicKey:int256 voucher:backup.Voucher request_expire:int64 payload:bytes = backup.Send
 * backup.get sign:int512 primaryPublicKey:int256 voucher:backup.Voucher request_expire:int64 = backup.Get
 * backup.delete sign:int512 primaryPublicKey:int256 voucher:backup.Voucher request_expire:int64 = backup.Delete
 */
const createBody = async (
    primaryPublicKey: string,
    voucher: WalletVoucher,
    payload = Buffer.alloc(0)
) => {
    if (payload.length > 0) {
        console.log('set payload', payload);
        const nonce = nacl.randomBytes(nacl.box.nonceLength);
        const encrypted = nacl.box.after(payload, nonce, Buffer.from(voucher.sharedKey, 'hex'));

        payload = Buffer.concat([nonce, encrypted]);
        console.log('set encrypted', payload);
    }

    const requestBody = Buffer.concat([
        Buffer.from(primaryPublicKey, 'hex'),
        Buffer.from(voucher.voucher, 'hex'),
        createExpireTimestamp(tenMin),
        payload
    ]);

    const signature = nacl.sign.detached(
        sha256_sync(requestBody),
        Buffer.from(voucher.secretKey, 'hex')
    );

    const body = Buffer.concat([signature, requestBody]);

    return new Blob([body]);
};

export const deleteWalletBackup = async (
    tonApi: Configuration,
    publicKey: string,
    voucher: WalletVoucher
) => {
    const body = await createBody(publicKey, voucher);
    // await new BackupApi(tonApi).deleteWalletConfig({ body });
};

export const getWalletBackup = async (
    tonApi: Configuration,
    publicKey: string,
    voucher: WalletVoucher
) => {
    return;
    // const body = await createBody(publicKey, voucher);
    // const result = await new BackupApi(tonApi).getWalletConfig({ body });
    // console.log('get payload', await result.arrayBuffer());

    // const messageWithNonceAsUint8Array = Buffer.from(await result.arrayBuffer());

    // console.log('get payload', messageWithNonceAsUint8Array);
    // const nonce = messageWithNonceAsUint8Array.subarray(0, nacl.box.nonceLength);
    // const message = messageWithNonceAsUint8Array.subarray(
    //   nacl.box.nonceLength,
    //   messageWithNonceAsUint8Array.length
    // );

    // const decrypted = nacl.box.open.after(
    //   message,
    //   nonce,
    //   Buffer.from(voucher.sharedKey, 'hex')
    // );

    // if (!decrypted) {
    //   throw new Error('Missing payload.');
    // }

    // console.log('get dencrypted', Buffer.from(decrypted));
    // return Buffer.from(decrypted);
};

export const putWalletBackup = async (
    tonApi: Configuration,
    publicKey: string,
    voucher: WalletVoucher,
    payload: Buffer
) => {
    const body = await createBody(publicKey, voucher, payload);
    // await new BackupApi(tonApi).putWalletConfig({ body });
};

const writeBase = (base: number[]) => {
    const buf = Buffer.allocUnsafe(4 * base.length);
    base.forEach((item, index) => {
        buf.writeInt32BE(item, index * 4);
    });
    return buf;
};

export const createWalletBackup = (wallet: WalletState): Buffer => {
    const backupVersion = 0;
    const revision = wallet.revision;
    const version = wallet.active.version;
    const network = wallet.network ?? Network.MAINNET;
    const lang = wallet.lang ?? Language.EN;
    const proxy = wallet.proxy ?? WalletProxy.OFF;

    const body = [backupVersion, revision, version, network, lang, proxy];

    const payload = Buffer.concat([
        writeBase(body),
        Buffer.from(wallet.fiat ?? FiatCurrencies.USD, 'utf8')
    ]);

    return payload;
};

export const readWalletBackup = (payload: Buffer) => {
    const backupVersion = payload.readInt32BE(0);
    if (backupVersion !== 0) {
        throw new Error('Unexpected version');
    }
    const revision = payload.readInt32BE(4);
    const version: WalletVersion = payload.readInt32BE(8);
    const network: Network = payload.readInt32BE(12);
    const lang: Language = payload.readInt32BE(16);
    const proxy: Language = payload.readInt32BE(20);

    const fiat = payload.subarray(24, 24 + 8 * 3).toString('utf8') as FiatCurrencies;

    return {
        revision,
        version,
        network,
        lang,
        proxy,
        fiat
    };
};
