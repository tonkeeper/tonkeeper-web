import {
    PoolImplementation,
    PoolImplementationType,
    PoolInfo
} from '@tonkeeper/core/dist/tonApiV2';

import { expect, screenshot, test } from '../../../../../playwright/test';
import { stakingPoolLinks } from './staking-shared';
import { StakingSharedStory } from './StakingSharedStory';

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

screenshot('Staking accent tag', () => <StakingSharedStory variant="accent" />);

screenshot('Staking info card promoted', () => <StakingSharedStory variant="promoted" />);

screenshot('Staking info card plain', () => <StakingSharedStory variant="plain" />);

screenshot('Staking links section', () => <StakingSharedStory variant="links" />);

test('stakingPoolLinks maps provider site, socials, and tonviewer', async () => {
    const links = stakingPoolLinks(TONSTAKERS, IMPLEMENTATION);
    expect(links.map(l => l.label)).toEqual([
        'tonstakers.com',
        'Twitter',
        'Community',
        'tonviewer.com'
    ]);
    expect(links[3].url).toBe(`https://tonviewer.com/${TONSTAKERS.address}`);
});

test('stakingPoolLinks dedupes repeated urls and survives a missing implementation', async () => {
    const withDuplicate: PoolImplementation = {
        ...IMPLEMENTATION,
        socials: ['https://tonstakers.com', 'https://t.me/tonstakers']
    };
    expect(stakingPoolLinks(TONSTAKERS, withDuplicate).map(l => l.label)).toEqual([
        'tonstakers.com',
        'Community',
        'tonviewer.com'
    ]);
    expect(stakingPoolLinks(TONSTAKERS, undefined).map(l => l.label)).toEqual(['tonviewer.com']);
});
