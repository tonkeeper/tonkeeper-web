import { postBridgeMessage } from './native-bridge';
import { NATIVE_BRIDGE_METHODS } from './native-bridge-methods';

export class TgAuthBridge {
    sendResult(base64Result: string): Promise<void> {
        return postBridgeMessage<void>({
            method: NATIVE_BRIDGE_METHODS.TG_AUTH.SEND_RESULT,
            params: {
                base64Result
            }
        });
    }
}
