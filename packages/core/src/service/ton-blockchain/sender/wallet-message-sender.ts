import { APIConfig } from '../../../entries/apis';
import { walletContractFromState } from '../../wallet/contractService';
import { externalMessage, getServerTime, getTTL, getWalletSeqNo } from '../utils';
import { CellSigner } from '../../../entries/signer';
import { WalletOutgoingMessage } from '../encoder/types';
import { BlockchainApi, EmulationApi } from '../../../tonApiV2';
import { isW5Version, TonWalletStandard } from '../../../entries/wallet';
import { WalletContractV5R1 } from '@ton/ton/dist/wallets/WalletContractV5R1';
import { ISender } from './ISender';
import { AssetAmount } from '../../../entries/crypto/asset/asset-amount';
import { TON_ASSET } from '../../../entries/crypto/asset/constants';
import { OutActionWalletV5 } from '@ton/ton/dist/wallets/v5beta/WalletV5OutActions';
import { WalletV4ExtendedAction } from '@ton/ton/dist/wallets/v4/WalletContractV4Actions';
import { WalletContractV4 } from '@ton/ton/dist/wallets/WalletContractV4';

type Outgoing = WalletOutgoingMessage | OutActionWalletV5[] | WalletV4ExtendedAction;

function isWalletOutgoing(msg: Outgoing): msg is WalletOutgoingMessage {
    return typeof msg === 'object' && msg !== null && 'messages' in msg && !('type' in msg);
}

function isV4Action(msg: Outgoing): msg is WalletV4ExtendedAction {
    return (
        typeof msg === 'object' &&
        'type' in msg &&
        (msg.type === 'sendMsg' ||
            msg.type === 'addAndDeployPlugin' ||
            msg.type === 'addPlugin' ||
            msg.type === 'removePlugin')
    );
}

export class WalletMessageSender implements ISender {
    constructor(
        public readonly api: APIConfig,
        private readonly wallet: TonWalletStandard,
        private readonly signer: CellSigner
    ) {}

    public get excessAddress() {
        return this.wallet.rawAddress;
    }

    public async send(outgoing: Outgoing) {
        if (!isW5Version(this.wallet.version) && Array.isArray(outgoing)) {
            throw new Error('This type of message can be sent only with wallet V5');
        }

        const external = await this.toExternal(outgoing);

        await new BlockchainApi(this.api.tonApiV2).sendBlockchainMessage({
            sendBlockchainMessageRequest: { boc: external.toBoc().toString('base64') }
        });

        return external;
    }

    public async estimate(outgoing: Outgoing) {
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

    public async toExternal(msg: Outgoing) {
        const timestamp = await getServerTime(this.api);
        const seqno = await getWalletSeqNo(this.api, this.wallet.rawAddress);
        const contract = walletContractFromState(this.wallet);

        if (isV4Action(msg) && contract instanceof WalletContractV4) {
            const transfer = await contract.createRequest({
                seqno,
                signer: this.signer,
                timeout: getTTL(timestamp),
                action: msg
            });

            return externalMessage(contract, seqno, transfer);
        }

        if (!(contract instanceof WalletContractV5R1)) {
            throw new Error('Unsupported wallet or message type');
        }

        if (Array.isArray(msg)) {
            const transfer = await contract.createRequest({
                seqno,
                signer: this.signer,
                timeout: getTTL(timestamp),
                actions: msg
            });

            return externalMessage(contract, seqno, transfer);
        }

        if (isWalletOutgoing(msg)) {
            const transfer = await contract.createTransfer({
                seqno,
                signer: this.signer,
                timeout: getTTL(timestamp),
                ...msg
            });

            return externalMessage(contract, seqno, transfer);
        }

        throw new Error('Unsupported wallet or message type');
    }
}
