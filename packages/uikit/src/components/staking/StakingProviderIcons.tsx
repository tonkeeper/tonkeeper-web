import { FC, SVGProps } from 'react';
import { StakingPoolProvider } from '../../state/staking/poolBranding';

type ProviderIconComponent = FC<SVGProps<SVGSVGElement>>;

const TonstakersIcon: ProviderIconComponent = props => (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <circle cx="16" cy="16" r="16" fill="#0079FF" />
        <path d="M16 6L22 16L16 26L10 16L16 6Z" fill="white" />
    </svg>
);

const TonnominatorsIcon: ProviderIconComponent = props => (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <circle cx="16" cy="16" r="16" fill="#00A98F" />
        <rect x="9" y="9" width="14" height="4" rx="2" fill="white" />
        <rect x="9" y="14" width="14" height="4" rx="2" fill="white" opacity="0.88" />
        <rect x="9" y="19" width="14" height="4" rx="2" fill="white" opacity="0.76" />
    </svg>
);

const TonwhalesIcon: ProviderIconComponent = props => (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <circle cx="16" cy="16" r="16" fill="#3D5AFE" />
        <path
            d="M9 18C12.5 13.5 17.5 13.5 23 18V21C21.2 20.6 19.8 19.4 19 17.8C18.2 19.4 16.8 20.6 15 21V18.6C13.7 19.2 12.3 19.2 11 18.6V21C10.2 20.6 9.5 19.5 9 18Z"
            fill="white"
        />
    </svg>
);

const TonkeeperIcon: ProviderIconComponent = props => (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <circle cx="16" cy="16" r="16" fill="#24B47E" />
        <path
            d="M16 8L23 11V15.5C23 20 20.1 24 16 25.5C11.9 24 9 20 9 15.5V11L16 8Z"
            fill="white"
        />
    </svg>
);

export const STAKING_PROVIDER_ICONS: Record<StakingPoolProvider, ProviderIconComponent> = {
    tonstakers: TonstakersIcon,
    tonnominators: TonnominatorsIcon,
    tonwhales: TonwhalesIcon,
    tonkeeper: TonkeeperIcon
};
