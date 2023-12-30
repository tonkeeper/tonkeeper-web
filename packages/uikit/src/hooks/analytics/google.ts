import { AppKey } from '@tonkeeper/core/dist/Keys';
import { IStorage } from '@tonkeeper/core/dist/Storage';
import { AccountState } from '@tonkeeper/core/dist/entries/account';
import { Network } from '@tonkeeper/core/dist/entries/network';
import { WalletState } from '@tonkeeper/core/dist/entries/wallet';
import { v4 as uuidv4 } from 'uuid';
import { Analytics } from '.';

export class GoogleAnalytics4 implements Analytics {
    private user_properties: Record<string, any> = {};
    private clientId: string | undefined;

    constructor(
        private measurementId: string,
        private apiSecret: string,
        private storage: IStorage,
        userId?: string
    ) {
        if (userId) {
            this.clientId = userId;
        } else {
            this.storage.get<string>(AppKey.USER_ID).then(user => {
                if (user) {
                    this.clientId = user;
                } else {
                    this.clientId = uuidv4();
                    this.storage.set(AppKey.USER_ID, this.clientId);
                }
            });
        }
    }

    init(
        application: string,
        walletType: string,
        account?: AccountState,
        wallet?: WalletState | null,
        version?: string
    ) {
        this.user_properties['application'] = { value: application };
        this.user_properties['walletType'] = { value: walletType };
        this.user_properties['network'] = {
            value: wallet?.network === Network.TESTNET ? 'testnet' : 'mainnet'
        };
        this.user_properties['accounts'] = { value: account!.publicKeys.length };
        this.user_properties['version'] = { value: version };
    }

    pageView(location: string) {
        this.track('Page_View', { pathname: location });
    }

    async track(name: string, params: Record<string, any>) {
        if (!this.clientId) return;
        try {
            await fetch(
                `https://www.google-analytics.com/mp/collect?measurement_id=${this.measurementId}&api_secret=${this.apiSecret}`,
                {
                    method: 'POST',
                    body: JSON.stringify({
                        client_id: this.clientId,
                        user_properties: this.user_properties,
                        events: [
                            {
                                name: name,
                                params: params
                            }
                        ]
                    })
                }
            );
        } catch (e) {
            console.error(e);
        }
    }
}
