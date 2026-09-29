import { ChainBadgeOverlay } from './ChainBadgeOverlay';
import IcChainTron20 from '../icons/components/IcChainTron20';
import IcChainEth20 from '../icons/components/IcChainEth20';
import { screenshot } from '../../playwright/test';

const SampleTokenIcon = <div className="h-11 w-11 rounded-full bg-backgroundContentTint" />;

screenshot('ChainBadgeOverlay TRON badge', () => (
    <ChainBadgeOverlay icon={<IcChainTron20 />}>{SampleTokenIcon}</ChainBadgeOverlay>
));

screenshot('ChainBadgeOverlay ETH badge', () => (
    <ChainBadgeOverlay icon={<IcChainEth20 />}>{SampleTokenIcon}</ChainBadgeOverlay>
));

screenshot('ChainBadgeOverlay gap shows the surface behind', () => (
    <div className="bg-accentBlue p-2">
        <ChainBadgeOverlay icon={<IcChainEth20 />}>{SampleTokenIcon}</ChainBadgeOverlay>
    </div>
));

screenshot('ChainBadgeOverlay native (no badge)', () => (
    <ChainBadgeOverlay>{SampleTokenIcon}</ChainBadgeOverlay>
));
