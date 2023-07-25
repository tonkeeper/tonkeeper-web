import { KeyPair, sha256_sync } from 'ton-crypto';
import nacl from 'tweetnacl';
import { WalletVoucher } from '../entries/wallet';

const hundredYears = 100 * 355 * 24 * 60 * 60;

export const createExpireTimestamp = (expired: number) => {
    const timestamp = Math.round(Date.now() / 1000) + expired;
    const timestampBuffer = Buffer.allocUnsafe(8);
    timestampBuffer.writeBigInt64LE(BigInt(timestamp));

    return timestampBuffer;
};

/**
 * backup.voucher sign:int512 expire_at:int64 publicKey:int256 = backup.Voucher
 */
export const createWalletVoucher = async (walletKeyPair: KeyPair): Promise<WalletVoucher> => {
    const sharedKey = nacl.box.before(
        walletKeyPair.publicKey,
        walletKeyPair.secretKey.subarray(0, 32)
    );

    const voucherSeed = nacl.randomBytes(32);
    const voucherKeypair = nacl.sign.keyPair.fromSeed(voucherSeed);

    const voucherBody = Buffer.concat([
        createExpireTimestamp(hundredYears),
        voucherKeypair.publicKey
    ]);

    const signature = nacl.sign.detached(sha256_sync(voucherBody), walletKeyPair.secretKey);
    console.log('signature', signature.length);
    const voucher = Buffer.concat([signature, voucherBody]);

    return {
        secretKey: Buffer.from(voucherKeypair.secretKey).toString('hex'),
        publicKey: Buffer.from(voucherKeypair.publicKey).toString('hex'),
        sharedKey: Buffer.from(sharedKey).toString('hex'),
        voucher: voucher.toString('hex')
    };
};
