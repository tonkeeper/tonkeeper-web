import { sendNftLink } from '@tonkeeper/core/dist/service/transfer/nftService';
import { AccountEvent } from '@tonkeeper/core/dist/tonApiV2';
import BigNumber from 'bignumber.js';
import { useExecuteTonContract } from '../useExecuteTonContract';

export const useLinkNft = (args: {
    nftAddress: string;
    linkToAddress: string;
    amount: BigNumber;
    fee: { event: AccountEvent };
}) => useExecuteTonContract({ executor: sendNftLink, eventName2: 'link-dns' }, args);
