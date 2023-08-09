import { sendNftLink } from '@tonkeeper/core/dist/service/transfer/nftService';
import { useExecuteTonContract } from '../useExecuteTonContract';
import BigNumber from 'bignumber.js';
import { Fee } from '@tonkeeper/core/dist/tonApiV1';

export const useLinkNft = (args: {
    nftAddress: string;
    linkToAddress: string;
    amount: BigNumber;
    fee: Fee;
}) => useExecuteTonContract({ executor: sendNftLink, eventName2: 'link-dns' }, args);
