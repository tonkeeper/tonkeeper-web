import { FC, ReactNode } from 'react';

import {
    PoolImplementation,
    PoolImplementationType,
    PoolInfo
} from '@tonkeeper/core/dist/tonApiV2';

import { useTranslation } from '../../../../hooks/translation';
import {
    AccentTag,
    StakingDisclaimer,
    StakingInfoCard,
    StakingLinksSection,
    stakingPoolLinks
} from './staking-shared';

const TONSTAKERS: PoolInfo = {
    address: '0:a45b17f28409229b78360e3290420f13e4fe20f90d7e2bf8c4ac6703259e22fa',
    name: 'Tonstakers',
    totalAmount: 100_000_000_000_000,
    implementation: PoolImplementationType.LiquidTf,
    apy: 5.32,
    minStake: 1_000_000_000,
    cycleStart: 0,
    cycleEnd: 0,
    verified: true,
    currentNominators: 1000,
    maxNominators: 10000,
    liquidJettonMaster: '0:bdf3fa8098d129b54b4f73b5bac5d1e1fd91eb054169c3916dfc8ccd536d1000',
    nominatorsStake: 0,
    validatorStake: 0
};

const IMPLEMENTATION: PoolImplementation = {
    name: 'Tonstakers',
    description: '',
    url: 'https://tonstakers.com',
    socials: ['https://twitter.com/tonstakers', 'https://t.me/tonstakers']
};

const Frame: FC<{ children: ReactNode }> = ({ children }) => (
    <div className="w-[390px] bg-backgroundPage p-4">{children}</div>
);

export const StakingSharedStory: FC<{
    variant: 'accent' | 'promoted' | 'plain' | 'links';
}> = ({ variant }) => {
    const { t } = useTranslation();

    if (variant === 'accent') {
        return (
            <div className="w-fit bg-backgroundPage p-4">
                <AccentTag>{t('staking_max_apy_tag')}</AccentTag>
            </div>
        );
    }

    if (variant === 'promoted') {
        return (
            <Frame>
                <StakingInfoCard pool={TONSTAKERS} showMaxApyTag />
                <StakingDisclaimer />
            </Frame>
        );
    }

    if (variant === 'plain') {
        return (
            <Frame>
                <StakingInfoCard pool={{ ...TONSTAKERS, name: 'CAT #1', apy: 3.71 }} />
            </Frame>
        );
    }

    return (
        <Frame>
            <StakingLinksSection links={stakingPoolLinks(TONSTAKERS, IMPLEMENTATION)} />
        </Frame>
    );
};
