import { APIConfig } from '../../../entries/apis';
import { walletContractFromState } from '../../wallet/contractService';
import { externalMessage, getServerTime, getTTL, getWalletSeqNo } from '../utils';
import { CellSigner } from '../../../entries/signer';
import { BlockchainApi, EmulationApi } from '../../../tonApiV2';
import { TonWalletStandard } from '../../../entries/wallet';
import { AssetAmount } from '../../../entries/crypto/asset/asset-amount';
import { TON_ASSET } from '../../../entries/crypto/asset/constants';
import { OutActionWalletV5 } from '@ton/ton/dist/wallets/v5beta/WalletV5OutActions';
import {
    EncodedResultKinds,
    IDeployV4ExtensionOptions,
    IRemoveV4ExtensionOptions,
    SubscriptionEncoder
} from '../encoder/subscription-encoder';
import { WalletContractV5R1 } from '@ton/ton/dist/wallets/WalletContractV5R1';

export enum V4ActionTypes {
    DEPLOY = 'DEPLOY',
    DESTRUCT = 'DESTRUCT'
}

type V5Data = {
    kind: EncodedResultKinds.V5;
    outgoing: OutActionWalletV5[];
};

type OmittedData = 'seqno' | 'wallet' | 'validUntil';

type RemoveOngoingData = Omit<IRemoveV4ExtensionOptions, OmittedData> & {
    actionType: V4ActionTypes.DESTRUCT;
};

type DeployOngoingData = Omit<IDeployV4ExtensionOptions, OmittedData> & {
    actionType: V4ActionTypes.DEPLOY;
};

type V4Data = {
    kind: EncodedResultKinds.V4;
    outgoing: DeployOngoingData | RemoveOngoingData;
};

type OutgoingData = V4Data | V5Data;

export class ExtensionMessageSender {
    constructor(
        public readonly api: APIConfig,
        private readonly wallet: TonWalletStandard,
        private readonly signer: CellSigner
    ) {}

    public get excessAddress() {
        return this.wallet.rawAddress;
    }

    public async send(outgoingData: OutgoingData) {
        const external = await this.toExternal(outgoingData);

        await new BlockchainApi(this.api.tonApiV2).sendBlockchainMessage({
            sendBlockchainMessageRequest: { boc: external.toBoc().toString('base64') }
        });

        return external;
    }

    public async estimate(outgoingData: OutgoingData) {
        const external = await this.toExternal(outgoingData);

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

    public async toExternal({ kind, outgoing }: OutgoingData) {
        if (kind !== EncodedResultKinds.V4 && kind !== EncodedResultKinds.V5) {
            throw new Error('Wrong wallet flow!');
        }

        const timestamp = await getServerTime(this.api);
        const seqno = await getWalletSeqNo(this.api, this.wallet.rawAddress);

        const contract = walletContractFromState(this.wallet);

        let transfer;
        if (kind === EncodedResultKinds.V5) {
            transfer = await (contract as WalletContractV5R1).createRequest({
                seqno,
                signer: this.signer,
                timeout: getTTL(timestamp),
                actions: outgoing
            });
        }

        if (kind === EncodedResultKinds.V4 && outgoing.actionType === V4ActionTypes.DESTRUCT) {
            const unsigned = SubscriptionEncoder.buildV4RemoveExtensionUnsignedBody({
                seqno,
                wallet: this.wallet,
                validUntil: getTTL(timestamp),
                extensionAddress: outgoing.extensionAddress
            });

            const signature: Buffer = await this.signer(unsigned);

            transfer = SubscriptionEncoder.buildV4SignedBody(signature, unsigned);
        }

        if (kind === EncodedResultKinds.V4 && outgoing.actionType === V4ActionTypes.DEPLOY) {
            const unsigned = SubscriptionEncoder.buildV4DeployAndLinkUnsignedBody({
                seqno,
                wallet: this.wallet,
                validUntil: getTTL(timestamp),
                sendAmount: outgoing.sendAmount,
                extStateInit: outgoing.extStateInit,
                deployBody: outgoing.deployBody
            });

            const signature: Buffer = await this.signer(unsigned);

            transfer = SubscriptionEncoder.buildV4SignedBody(signature, unsigned);
        }

        if (!transfer) {
            throw new Error('Building external message failed!');
        }

        return externalMessage(contract, seqno, transfer);
    }
}
