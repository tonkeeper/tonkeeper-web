import { MiniApp, retrieveLaunchParams } from '@tma.js/sdk';
import { NotificationService } from '@tonkeeper/core/dist/AppSdk';
import { isStandardTonWallet, TonContract, TonWalletStandard } from "@tonkeeper/core/dist/entries/wallet";
import { APIConfig } from '@tonkeeper/core/dist/entries/apis';
import {
    toTonProofItem,
    tonConnectProofPayload
} from '@tonkeeper/core/dist/service/tonConnect/connectService';
import { getServerTime } from '@tonkeeper/core/dist/service/transfer/common';
import { walletStateInitFromState } from '@tonkeeper/core/dist/service/wallet/contractService';
import { Configuration, DefaultApi } from '../twaApi';

const seeIfProduction = () => {
    return window.location.hostname.includes('twa.tonkeeper.com');
};

const apiConfig = new Configuration({ basePath: 'https://twa-api.tonkeeper.com' });
const twaApi = new DefaultApi(apiConfig);

export class TwaNotification implements NotificationService {
    constructor(private miniApp: MiniApp) {}

    get twaInitData() {
        const { initDataRaw } = retrieveLaunchParams();

        if (!initDataRaw) {
            throw new Error('missing twa init data');
        }
        return Buffer.from(initDataRaw, 'utf8').toString('base64');
    }

    private getTonConnectProof = async (
        api: APIConfig,
        wallet: TonWalletStandard,
        signTonConnect: (bufferToSign: Buffer) => Promise<Buffer | Uint8Array>
    ) => {
        const domain = 'https://twa.tonkeeper.com/';
        const { payload } = await twaApi.getTonConnectPayload();
        const timestamp = await getServerTime(api);
        const proofPayload = tonConnectProofPayload(
            timestamp,
            domain,
            wallet.rawAddress,
            payload
        );
        const stateInit = walletStateInitFromState(wallet);
        return await toTonProofItem(signTonConnect, proofPayload, true, stateInit);
    };

    subscribe = async (
        api: APIConfig,
        wallet: TonContract,
        signTonConnect: (bufferToSign: Buffer) => Promise<Buffer | Uint8Array>
    ) => {
        try {
            await this.miniApp.requestWriteAccess();
        } catch (e) {
            console.error(e);
        }

        // TODO add subscribe to an account without tonproof in backend
        if (!isStandardTonWallet(wallet)) {
            throw new Error("Can't subscribe to non standard wallet");
        }

        const proof = await this.getTonConnectProof(api, wallet, signTonConnect);
        await twaApi.subscribeToAccountEvents({
            subscribeToAccountEventsRequest: {
                twaInitData: this.twaInitData,
                address: wallet.rawAddress,
                proof
            }
        });
    };

    unsubscribe = async (address?: string) => {
        await twaApi.unsubscribeFromAccountEvents({
            unsubscribeFromAccountEventsRequest: {
                twaInitData: this.twaInitData
            }
        });
    };

    subscribeTonConnect = async (clientId: string, origin: string) => {
        await twaApi.subscribeToBridgeEvents({
            subscribeToBridgeEventsRequest: {
                twaInitData: this.twaInitData,
                clientId,
                origin
            }
        });
    };

    unsubscribeTonConnect = async (clientId?: string) => {
        await twaApi.unsubscribeFromBridgeEvents({
            unsubscribeFromBridgeEventsRequest: {
                twaInitData: this.twaInitData,
                clientId
            }
        });
    };

    subscribed = async (address: string) => {
        if (!seeIfProduction()) return false;

        const { subscribed } = await twaApi.accountEventsSubscriptionStatus({
            accountEventsSubscriptionStatusRequest: {
                twaInitData: this.twaInitData,
                address
            }
        });
        return subscribed;
    };
}
