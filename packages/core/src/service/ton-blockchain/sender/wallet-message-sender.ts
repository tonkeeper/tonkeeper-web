import { APIConfig } from '../../../entries/apis';
import { walletContractFromState } from '../../wallet/contractService';
import { externalMessage, getServerTime, getTTL, getWalletSeqNo } from '../../transfer/common';
import { WalletContractV5R1 } from '@ton/ton';
import { CellSigner } from '../../../entries/signer';
import { WalletOutgoingMessage } from '../encoder/types';
import { BlockchainApi, EmulationApi } from '../../../tonApiV2';
import { TonWalletStandard } from '../../../entries/wallet';

export class WalletMessageSender {
    constructor(
        private readonly api: APIConfig,
        private readonly wallet: TonWalletStandard,
        private readonly signer: CellSigner
    ) {}

    public async toExternal({ messages, sendMode }: WalletOutgoingMessage) {
        const timestamp = await getServerTime(this.api);
        const seqno = await getWalletSeqNo(this.api, this.wallet.rawAddress);

        const contract = walletContractFromState(this.wallet) as WalletContractV5R1;
        const transfer = await contract.createTransfer({
            seqno,
            signer: this.signer,
            timeout: getTTL(timestamp),
            sendMode,
            messages
        });
        return externalMessage(contract, seqno, transfer);
    }

    public async send(outgoing: WalletOutgoingMessage) {
        const external = await this.toExternal(outgoing);

        return new BlockchainApi(this.api.tonApiV2).sendBlockchainMessage({
            sendBlockchainMessageRequest: { boc: external.toBoc().toString('base64') }
        });
    }

    public async estimate(outgoing: WalletOutgoingMessage) {
        const external = await this.toExternal(outgoing);

        return new EmulationApi(this.api.tonApiV2).emulateMessageToWallet({
            emulateMessageToWalletRequest: { boc: external.toBoc().toString('base64') }
        });
    }
}
