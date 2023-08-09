import { sendNftRenew } from '@tonkeeper/core/dist/service/transfer/nftService';
import { useExecuteTonContract } from '../useExecuteTonContract';
import BigNumber from 'bignumber.js';
import { Fee } from '@tonkeeper/core/dist/tonApiV1';

export const useRenewNft = (args: { nftAddress: string; amount: BigNumber; fee: Fee }) =>
    useExecuteTonContract({ executor: sendNftRenew, eventName2: 'renew-dns' }, args);
