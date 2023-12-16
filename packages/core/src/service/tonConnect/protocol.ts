import nacl, { BoxKeyPair } from 'tweetnacl';
import { concatUint8Arrays, toHexString } from './utils';

export interface KeyPair {
    publicKey: string;
    secretKey: string;
}

export class SessionCrypto {
    private readonly nonceLength = 24;

    private readonly keyPair: BoxKeyPair;

    public readonly sessionId: string;

    constructor(keyPair?: KeyPair) {
        this.keyPair = keyPair ? this.createKeypairFromString(keyPair) : this.createKeypair();
        this.sessionId = toHexString(this.keyPair.publicKey);
    }

    private createKeypair(): BoxKeyPair {
        return nacl.box.keyPair();
    }

    private createKeypairFromString(keyPair: KeyPair): BoxKeyPair {
        return {
            publicKey: Buffer.from(keyPair.publicKey, 'hex'),
            secretKey: Buffer.from(keyPair.secretKey, 'hex')
        };
    }

    private createNonce(): Uint8Array {
        return nacl.randomBytes(this.nonceLength);
    }

    public encrypt(message: string, receiverPublicKey: Buffer): Uint8Array {
        const encodedMessage = new TextEncoder().encode(message);
        const nonce = this.createNonce();
        const encrypted = nacl.box(
            encodedMessage,
            nonce,
            receiverPublicKey,
            this.keyPair.secretKey
        );
        return concatUint8Arrays(nonce, encrypted);
    }

    public decrypt(message: Buffer, senderPublicKey: Buffer): string {
        const nonce = message.subarray(0, this.nonceLength);
        const internalMessage = message.subarray(this.nonceLength);
        console.log('senderPublicKey', senderPublicKey.length);

        const decrypted = nacl.box.open(
            internalMessage,
            nonce,
            senderPublicKey,
            this.keyPair.secretKey
        );

        if (!decrypted) {
            throw new Error(
                `Decryption error: \n message: ${message.toString()} \n sender pubkey: ${senderPublicKey.toString()} \n keypair pubkey: ${this.keyPair.publicKey.toString()} \n keypair secretkey: ${this.keyPair.secretKey.toString()}`
            );
        }

        return new TextDecoder().decode(decrypted);
    }

    public stringifyKeypair(): KeyPair {
        return {
            publicKey: Buffer.from(this.keyPair.publicKey).toString('hex'),
            secretKey: Buffer.from(this.keyPair.secretKey).toString('hex')
        };
    }
}
