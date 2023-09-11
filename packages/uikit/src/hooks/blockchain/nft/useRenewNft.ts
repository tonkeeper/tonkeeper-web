import { sendNftRenew } from '@tonkeeper/core/dist/service/transfer/nftService';
import { MessageConsequences } from '@tonkeeper/core/dist/tonApiV2';
import BigNumber from 'bignumber.js';
import { useExecuteTonContract } from '../useExecuteTonContract';

export const useRenewNft = (args: {
    nftAddress: string;
    amount: BigNumber;
    fee: MessageConsequences;
}) => useExecuteTonContract({ executor: sendNftRenew, eventName2: 'renew-dns' }, args);
