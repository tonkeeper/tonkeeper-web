import { TransferEstimationEvent } from '@tonkeeper/core/dist/entries/send';
import { sendNftRenew } from '@tonkeeper/core/dist/service/transfer/nftService';
import BigNumber from 'bignumber.js';
import { useExecuteTonContract } from '../useExecuteTonContract';

export const useRenewNft = (args: {
    nftAddress: string;
    amount: BigNumber;
    fee: TransferEstimationEvent;
}) => useExecuteTonContract({ executor: sendNftRenew, eventName2: 'renew-dns' }, args);
