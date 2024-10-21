import { WalletOutgoingMessage } from '../encoder/types';
import { MessageConsequences } from '../../../tonApiV2';

export interface ISender {
    jettonResponseAddress: string;

    send(outgoing: WalletOutgoingMessage): Promise<void>;

    estimate(outgoing: WalletOutgoingMessage): Promise<MessageConsequences>;
}
