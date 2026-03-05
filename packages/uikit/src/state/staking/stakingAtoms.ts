import { PoolInfo } from '@tonkeeper/core/dist/tonApiV2';
import { atom } from '@tonkeeper/core/dist/entries/atom';

export const stakingSelectedPool$ = atom<PoolInfo | undefined>(undefined);
