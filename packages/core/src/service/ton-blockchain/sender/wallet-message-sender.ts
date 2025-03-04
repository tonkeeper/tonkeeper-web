import { APIConfig } from '../../../entries/apis';
import { walletContractFromState } from '../../wallet/contractService';
import { externalMessage, getServerTime, getTTL, getWalletSeqNo } from '../utils';
import { CellSigner } from '../../../entries/signer';
import { WalletOutgoingMessage } from '../encoder/types';
import { BlockchainApi, EmulationApi } from '../../../tonApiV2';
import { isW5Version, TonWalletStandard } from '../../../entries/wallet';
import { WalletContractV5R1 } from '@ton/ton';
import { ISender } from './ISender';
import { AssetAmount } from '../../../entries/crypto/asset/asset-amount';
import { TON_ASSET } from '../../../entries/crypto/asset/constants';
import { OutActionWalletV5 } from '@ton/ton/dist/wallets/v5beta/WalletV5OutActions';

export class WalletMessageSender implements ISender {
    constructor(
        private readonly api: APIConfig,
        private readonly wallet: TonWalletStandard,
        private readonly signer: CellSigner
    ) {}

    public get excessAddress() {
        return this.wallet.rawAddress;
    }

    public async send(outgoing: WalletOutgoingMessage | OutActionWalletV5[]) {
        if (!isW5Version(this.wallet.version) && Array.isArray(outgoing)) {
            throw new Error('This type of message can be sent only with wallet V5');
        }

        const external = await this.toExternal(outgoing);

        await new BlockchainApi(this.api.tonApiV2).sendBlockchainMessage({
            sendBlockchainMessageRequest: { boc: external.toBoc().toString('base64') }
        });

        return external;
    }

    public async estimate(outgoing: WalletOutgoingMessage | OutActionWalletV5[]) {
        const external = await this.toExternal(outgoing);

        const result = await new EmulationApi(this.api.tonApiV2).emulateMessageToWallet({
            emulateMessageToWalletRequest: { boc: external.toBoc().toString('base64') }
        });

        return {
            fee: {
                type: 'ton-asset' as const,
                extra: new AssetAmount({ asset: TON_ASSET, weiAmount: result.event.extra * -1 })
            },
            event: result.event
        };
    }

    private async toExternal(msg: WalletOutgoingMessage | OutActionWalletV5[]) {
        const timestamp = await getServerTime(this.api);
        const seqno = await getWalletSeqNo(this.api, this.wallet.rawAddress);

        const contract = walletContractFromState(this.wallet) as WalletContractV5R1;

        let transfer;
        if (Array.isArray(msg)) {
            transfer = await contract.createRequest({
                seqno,
                signer: this.signer,
                timeout: getTTL(timestamp),
                actions: msg
            });
        } else {
            transfer = await contract.createTransfer({
                seqno,
                signer: this.signer,
                timeout: getTTL(timestamp),
                ...msg
            });
        }
        return externalMessage(contract, seqno, transfer);
    }
}
