import { StakingPoolProvider } from '../../state/staking/poolBranding';
import tonkeeperPng from './assets/tonkeeper.png';
import tonnominatorsPng from './assets/tonnominators.png';
import tonstakersPng from './assets/tonstakers.png';
import tonwhalesPng from './assets/tonwhales.png';

export const STAKING_PROVIDER_ICON_URLS: Record<StakingPoolProvider, string> = {
    tonstakers: tonstakersPng,
    tonnominators: tonnominatorsPng,
    tonwhales: tonwhalesPng,
    tonkeeper: tonkeeperPng
};
