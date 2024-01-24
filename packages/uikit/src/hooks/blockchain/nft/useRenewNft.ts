import { sendNftRenew } from '@tonkeeper/core/dist/service/transfer/nftService';
import { AccountEvent } from '@tonkeeper/core/dist/tonApiV2';
import BigNumber from 'bignumber.js';
import { useExecuteTonContract } from '../useExecuteTonContract';

export const useRenewNft = (args: {
    nftAddress: string;
    amount: BigNumber;
    fee: { event: AccountEvent };
}) => useExecuteTonContract({ executor: sendNftRenew, eventName2: 'renew-dns' }, args);
