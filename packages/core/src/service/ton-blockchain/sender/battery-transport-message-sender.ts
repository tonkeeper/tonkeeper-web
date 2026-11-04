import { APIConfig } from '../../../entries/apis';
import { CellSigner } from '../../../entries/signer';
import { TonWalletStandard } from '../../../entries/wallet';
import { Configuration, DefaultApi } from '../../../batteryApi';
import { WalletMessageSender } from './wallet-message-sender';

/**
 * An ordinary wallet transfer that pays its own fee but is posted to the battery `/message`
 * endpoint instead of TonAPI. The battery attributes a recharge to whoever broadcast it, so a
 * multichain wallet's TON top-up must arrive through the battery API carrying the wallet id
 * headers, or it is credited to the address-keyed account instead.
 */
export class BatteryTransportMessageSender extends WalletMessageSender {
    constructor(
        api: APIConfig,
        wallet: TonWalletStandard,
        signer: CellSigner,
        private readonly battery: { api: Configuration; authToken: string }
    ) {
        super(api, wallet, signer);
    }

    public async send(outgoing: Parameters<WalletMessageSender['send']>[0]) {
        const external = await this.toExternal(outgoing);

        await new DefaultApi(this.battery.api).sendMessage({
            xTonConnectAuth: this.battery.authToken,
            sendMessageRequest: {
                boc: external.toBoc().toString('base64')
            }
        });

        return external;
    }
}
