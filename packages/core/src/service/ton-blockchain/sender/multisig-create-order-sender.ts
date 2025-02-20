import { APIConfig } from '../../../entries/apis';
import { assertBalanceEnough, getServerTime } from '../utils';
import { WalletOutgoingMessage } from '../encoder/types';
import { type Multisig } from '../../../tonApiV2';
import { TonWalletStandard } from '../../../entries/wallet';
import { ISender } from './ISender';
import { MultisigEncoder } from '../encoder/multisig-encoder/multisig-encoder';
import BigNumber from 'bignumber.js';
import { fromNano, internal, SendMode } from '@ton/core';
import { TON_ASSET } from '../../../entries/crypto/asset/constants';
import { estimateOrderByOutgoingMessage } from '../encoder/multisig-encoder/multisig-utils';
import { AssetAmount } from '../../../entries/crypto/asset/asset-amount';

export class MultisigCreateOrderSender implements ISender {
    constructor(
        private readonly api: APIConfig,
        private readonly multisig: Multisig,
        private readonly ttlSeconds: number,
        private readonly hostWallet: TonWalletStandard,
        private readonly hostWalletSender: ISender
    ) {}

    public get excessAddress() {
        return this.multisig.address;
    }

    public async send(outgoing: WalletOutgoingMessage) {
        await this.checkTransactionPossibility();
        const wrappedMessage = await this.wrapMessage(outgoing);

        return this.hostWalletSender.send({
            sendMode: SendMode.IGNORE_ERRORS,
            messages: [internal(wrappedMessage)]
        });
    }

    public async estimate(outgoing: WalletOutgoingMessage) {
        await this.checkTransactionPossibility();

        const timestamp = await getServerTime(this.api);

        const result = await estimateOrderByOutgoingMessage({
            api: this.api,
            multisig: this.multisig,
            orderValidUntilSeconds: timestamp + this.ttlSeconds,
            outgoing
        });

        return {
            fee: {
                type: 'ton-asset' as const,
                extra: new AssetAmount({ asset: TON_ASSET, weiAmount: result.event.extra * -1 })
            },
            event: result.event
        };
    }

    private async wrapMessage(outgoing: WalletOutgoingMessage) {
        const timestamp = await getServerTime(this.api);

        await assertBalanceEnough(
            this.api,
            new BigNumber(MultisigEncoder.createOrderAmount.toString()),
            TON_ASSET,
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

    private async checkTransactionPossibility() {
        const requiredBalance = new BigNumber(fromNano(MultisigEncoder.createOrderAmount) + 0.02);

        await assertBalanceEnough(this.api, requiredBalance, TON_ASSET, this.hostWallet.rawAddress);
    }
}
