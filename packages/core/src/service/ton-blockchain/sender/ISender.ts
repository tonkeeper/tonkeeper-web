import { WalletOutgoingMessage } from '../encoder/types';
import { MessageConsequences } from '../../../tonApiV2';
import { Cell } from '@ton/core';

export interface ISender {
    jettonResponseAddress: string;

    send(outgoing: WalletOutgoingMessage): Promise<Cell>;

    estimate(outgoing: WalletOutgoingMessage): Promise<Pick<MessageConsequences, 'event'>>;
}
