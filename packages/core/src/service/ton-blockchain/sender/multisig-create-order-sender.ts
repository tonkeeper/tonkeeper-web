import { APIConfig } from '../../../entries/apis';
import { assertBalanceEnough, getServerTime } from '../utils';
import { Signer } from '../../../entries/signer';
import { WalletOutgoingMessage } from '../encoder/types';
import { type Multisig } from '../../../tonApiV2';
import { TonWalletStandard } from '../../../entries/wallet';
import { ISender } from './ISender';
import { MultisigEncoder } from '../encoder/multisig-encoder/multisig-encoder';
import { WalletMessageSender } from './wallet-message-sender';
import BigNumber from 'bignumber.js';
import { LedgerMessageSender } from './ledger-message-sender';
import { internal, SendMode } from '@ton/core';

export class MultisigCreateOrderSender implements ISender {
    constructor(
        private readonly api: APIConfig,
        private readonly multisig: Multisig,
        private readonly ttlSeconds: number,
        private readonly hostWallet: TonWalletStandard,
        private readonly signer: Signer
    ) {}

    public get jettonResponseAddress() {
        return this.multisig.address;
    }

    public async send(outgoing: WalletOutgoingMessage) {
        const wrappedMessage = await this.wrapMessage(outgoing);

        if (this.signer.type === 'ledger') {
            const sender = new LedgerMessageSender(this.api, this.hostWallet, this.signer);
            return (
                await sender.tonRawTransfer({
                    ...wrappedMessage,
                    sendMode: SendMode.IGNORE_ERRORS
                })
            ).send();
        }

        const sender = new WalletMessageSender(this.api, this.hostWallet, this.signer);
        return sender.send({
            sendMode: SendMode.IGNORE_ERRORS,
            messages: [internal(wrappedMessage)]
        });
    }

    public async estimate(outgoing: WalletOutgoingMessage) {
        const wrappedMessage = await this.wrapMessage(outgoing);

        if (this.signer.type === 'ledger') {
            const sender = new LedgerMessageSender(this.api, this.hostWallet, this.signer);
            return (
                await sender.tonRawTransfer({
                    ...wrappedMessage,
                    sendMode: SendMode.IGNORE_ERRORS
                })
            ).estimate();
        }

        const sender = new WalletMessageSender(this.api, this.hostWallet, this.signer);
        return sender.estimate({
            sendMode: SendMode.IGNORE_ERRORS,
            messages: [internal(wrappedMessage)]
        });
    }

    private async wrapMessage(outgoing: WalletOutgoingMessage) {
        const timestamp = await getServerTime(this.api);

        await assertBalanceEnough(
            this.api,
            new BigNumber(MultisigEncoder.createOrderAmount.toString()),
            this.hostWallet.rawAddress
        );

        const multisigEncoder = new MultisigEncoder(this.api, this.hostWallet.rawAddress);

        return multisigEncoder.encodeNewOrder({
            multisig: this.multisig,
            order: {
                validUntilSeconds: timestamp + this.ttlSeconds,
                actions: outgoing.messages.map(message => ({
                    type: 'transfer',
                    message,
                    sendMode: outgoing.sendMode
                }))
            }
        });
    }
}
