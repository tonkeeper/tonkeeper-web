import { NotificationService } from '@tonkeeper/core/dist/AppSdk';
import { StandardTonWalletState } from "@tonkeeper/core/dist/entries/wallet";
import {
    toTonProofItem,
    tonConnectProofPayload
} from '@tonkeeper/core/dist/service/tonConnect/connectService';
import { walletStateInitFromState } from '@tonkeeper/core/dist/service/wallet/contractService';
import { InitResult } from '@twa.js/sdk';
import { Configuration, DefaultApi } from '../twaApi';
import { getServerTime } from "@tonkeeper/core/dist/service/transfer/common";

const apiConfig = new Configuration({ basePath: 'https://twa-api.tonkeeper.com' });
const twaApi = new DefaultApi(apiConfig);

export class TwaNotification implements NotificationService {
    constructor(private components: InitResult) {}

    get twaInitData() {
        const { initDataRaw } = this.components;
        if (!initDataRaw) {
            throw new Error('missing twa init data');
        }
        return Buffer.from(initDataRaw, 'utf8').toString('base64');
    }

    private getTonConnectProof = async (wallet: StandardTonWalletState, mnemonic: string[]) => {
        const domain = 'https://twa.tonkeeper.com/';
        const { payload } = await twaApi.getTonConnectPayload();
        const timestamp = await getServerTime(api);
        const proofPayload = tonConnectProofPayload(Date.now(), domain, wallet.rawAddress, payload);
        const stateInit = walletStateInitFromState(wallet);
        return await toTonProofItem(mnemonic, proofPayload, stateInit);
    };

    subscribe = async (wallet: StandardTonWalletState, mnemonic: string[]) => {
        try {
            await this.components.webApp.requestWriteAccess();
        } catch (e) {
            console.error(e);
        }

        const proof = await this.getTonConnectProof(wallet, mnemonic);
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
        const { subscribed } = await twaApi.accountEventsSubscriptionStatus({
            accountEventsSubscriptionStatusRequest: {
                twaInitData: this.twaInitData,
                address
            }
        });
        return subscribed;
    };
}
