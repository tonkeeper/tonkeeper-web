import { WalletOutgoingMessage } from '../encoder/types';
import { Cell } from '@ton/core';
import { Estimation } from '../../../entries/send';

export interface ISender {
    jettonResponseAddress: string;

    send(outgoing: WalletOutgoingMessage): Promise<Cell>;

    estimate(outgoing: WalletOutgoingMessage): Promise<Estimation>;
}
