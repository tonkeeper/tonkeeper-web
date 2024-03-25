import { TransferEstimationEvent } from '@tonkeeper/core/dist/entries/send';
import { sendNftLink } from '@tonkeeper/core/dist/service/transfer/nftService';
import BigNumber from 'bignumber.js';
import { useExecuteTonContract } from '../useExecuteTonContract';

export const useLinkNft = (args: {
    nftAddress: string;
    linkToAddress: string;
    amount: BigNumber;
    fee: TransferEstimationEvent;
}) => useExecuteTonContract({ executor: sendNftLink, eventName2: 'link-dns' }, args);
