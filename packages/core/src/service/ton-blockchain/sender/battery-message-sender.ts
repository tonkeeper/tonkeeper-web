import { walletContractFromState } from '../../wallet/contractService';
import { WalletContractV5R1 } from '@ton/ton';
import { CellSigner } from '../../../entries/signer';
import { WalletOutgoingMessage } from '../encoder/types';
import { TonWalletStandard, WalletVersion } from '../../../entries/wallet';
import { APIConfig } from '../../../entries/apis';
import { ISender } from './ISender';
import { externalMessage, getServerTime, getWalletSeqNo } from '../utils';
import { AssetAmount } from '../../../entries/crypto/asset/asset-amount';
import { TON_ASSET } from '../../../entries/crypto/asset/constants';
import { Configuration, DefaultApi, EmulationApi } from '../../../batteryApi';
import { Network } from '../../../entries/network';

export class BatteryMessageSender implements ISender {
    constructor(
        private batteryConfig: {
            messageTtl: number;
            excessAddress: string;
            authToken: string;
        },
        private api: {
            tonApi: APIConfig;
            batteryApi: Configuration;
        },
        private readonly wallet: TonWalletStandard,

        private readonly signer: CellSigner,
        private readonly network: Network
    ) {}

    public get excessAddress() {
        return this.batteryConfig.excessAddress;
    }

    public async send(outgoing: WalletOutgoingMessage) {
        const external = await this.toExternal(outgoing);

        await new DefaultApi(this.api.batteryApi).sendMessage({
            xTonConnectAuth: this.batteryConfig.authToken,
            emulateMessageToWalletRequest: {
                boc: external.toBoc().toString('base64')
            }
        });

        return external;
    }

    public async estimate(outgoing: WalletOutgoingMessage) {
        const external = await this.toExternal(outgoing);

        const result = await new EmulationApi(this.api.batteryApi).emulateMessageToWallet({
            xTonConnectAuth: this.batteryConfig.authToken,
            emulateMessageToWalletRequest: {
                boc: external.toBoc().toString('base64')
            }
        });

        return {
            extra: new AssetAmount({ asset: TON_ASSET, weiAmount: result.event.extra * -1 }),
            event: result.event
        };
    }

    private async toWalletV4External({ messages, sendMode }: WalletOutgoingMessage) {
        const timestamp = await getServerTime(this.api.tonApi);
        const seqno = await getWalletSeqNo(this.api.tonApi, this.wallet.rawAddress);

        const contract = walletContractFromState(this.wallet, this.network) as WalletContractV5R1;
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

        const contract = walletContractFromState(this.wallet, this.network) as WalletContractV5R1;
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
