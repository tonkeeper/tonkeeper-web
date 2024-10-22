import { walletContractFromState } from '../../wallet/contractService';
import { WalletContractV5R1 } from '@ton/ton';
import { CellSigner } from '../../../entries/signer';
import { WalletOutgoingMessage } from '../encoder/types';
import { TonWalletStandard, WalletVersion } from '../../../entries/wallet';
import { Battery } from '../../../batteryApi';
import { APIConfig } from '../../../entries/apis';
import { ISender } from './ISender';
import { externalMessage, getServerTime, getWalletSeqNo } from '../utils';

export class BatteryMessageSender implements ISender {
    constructor(
        private batteryConfig: {
            messageTtl: number;
            jettonResponseAddress: string;
            authToken: string;
        },
        private api: {
            tonApi: APIConfig;
            batteryApi: Battery;
        },
        private readonly wallet: TonWalletStandard,

        private readonly signer: CellSigner
    ) {}

    public get jettonResponseAddress() {
        return this.batteryConfig.jettonResponseAddress;
    }

    public async send(outgoing: WalletOutgoingMessage) {
        const external = await this.toExternal(outgoing);

        await this.api.batteryApi.default.sendMessage(this.batteryConfig.authToken, {
            boc: external.toBoc().toString('base64')
        });

        return external;
    }

    public async estimate(outgoing: WalletOutgoingMessage) {
        const external = await this.toExternal(outgoing);

        return this.api.batteryApi.emulation.emulateMessageToWallet(this.batteryConfig.authToken, {
            boc: external.toBoc().toString('base64')
        });
    }

    private async toWalletV4External({ messages, sendMode }: WalletOutgoingMessage) {
        const timestamp = await getServerTime(this.api.tonApi);
        const seqno = await getWalletSeqNo(this.api.tonApi, this.wallet.rawAddress);

        const contract = walletContractFromState(this.wallet) as WalletContractV5R1;
        const transfer = await contract.createTransfer({
            seqno,
            signer: this.signer,
            timeout: this.getTTL(timestamp),
            sendMode,
            messages
        });
        return externalMessage(contract, seqno, transfer);
    }

    private async toWalletV5External({ messages, sendMode }: WalletOutgoingMessage) {
        const timestamp = await getServerTime(this.api.tonApi);
        const seqno = await getWalletSeqNo(this.api.tonApi, this.wallet.rawAddress);

        if (
            this.wallet.version !== WalletVersion.V5R1 &&
            this.wallet.version !== WalletVersion.V5_BETA
        ) {
            throw new Error(`Unsupported wallet version: ${this.wallet.version}`);
        }

        const contract = walletContractFromState(this.wallet) as WalletContractV5R1;
        const transfer = await contract.createTransfer({
            authType: 'internal',
            seqno,
            signer: this.signer,
            timeout: this.getTTL(timestamp),
            sendMode,
            messages
        });
        return externalMessage(contract, seqno, transfer);
    }

    private async toExternal({ messages, sendMode }: WalletOutgoingMessage) {
        if (
            this.wallet.version === WalletVersion.V5R1 ||
            this.wallet.version === WalletVersion.V5_BETA
        ) {
            return this.toWalletV5External({ messages, sendMode });
        }

        return this.toWalletV4External({ messages, sendMode });
    }

    private getTTL(unixTimestamp: number) {
        return unixTimestamp + this.batteryConfig.messageTtl;
    }
}
