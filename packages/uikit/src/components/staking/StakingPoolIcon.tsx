import { FC } from 'react';
import styled from 'styled-components';
import { PoolInfo } from '@tonkeeper/core/dist/tonApiV2';
import { TON_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { Image } from '../shared/Image';
import { getStakingPoolProvider } from '../../state/staking/poolBranding';
import { STAKING_PROVIDER_ICONS } from './StakingProviderIcons';

const TON_BLUE = '#0098EA';
const BADGE_TO_BASE_RATIO = 24 / 64;

const Root = styled.div<{ $size: number }>`
    width: ${p => p.$size}px;
    height: ${p => p.$size}px;
    position: relative;
    flex-shrink: 0;
`;

const BaseIcon = styled(Image)`
    width: 100%;
    height: 100%;
    border-radius: ${p => p.theme.cornerFull};
`;

const BaseIconFallback = styled.div`
    width: 100%;
    height: 100%;
    border-radius: ${p => p.theme.cornerFull};
    background: ${TON_BLUE};
`;

const Badge = styled.div<{ $size: number }>`
    position: absolute;
    width: ${p => p.$size}px;
    height: ${p => p.$size}px;
    right: 0;
    bottom: 0;
    transform: translate(12%, 12%);
    border-radius: ${p => p.theme.cornerFull};
    box-shadow: 0 0 0 2px ${p => p.theme.backgroundPage};
    overflow: hidden;
    box-sizing: border-box;
`;

const BadgeFallback = styled.div`
    width: 100%;
    height: 100%;
    border-radius: ${p => p.theme.cornerFull};
    background: ${TON_BLUE};
`;

const ProviderIconFrame = styled.div`
    width: 100%;
    height: 100%;
    border-radius: ${p => p.theme.cornerFull};
    overflow: hidden;
    box-sizing: border-box;

    > svg {
        width: 100%;
        height: 100%;
        display: block;
    }
`;

const ProviderIconFallback = styled.div`
    width: 100%;
    height: 100%;
    border-radius: ${p => p.theme.cornerFull};
    background: ${TON_BLUE};
`;

export const StakingPoolIcon: FC<{
    pool: PoolInfo | undefined;
    size: number;
    className?: string;
    variant?: 'composite' | 'provider';
}> = ({ pool, size, className, variant = 'composite' }) => {
    const badgeSize = Math.max(8, Math.round(size * BADGE_TO_BASE_RATIO));
    const provider = getStakingPoolProvider(pool);
    const ProviderIconComponent = provider ? STAKING_PROVIDER_ICONS[provider] : undefined;

    if (variant === 'provider') {
        return (
            <Root $size={size} className={className}>
                {ProviderIconComponent ? (
                    <ProviderIconFrame>
                        <ProviderIconComponent aria-hidden focusable="false" />
                    </ProviderIconFrame>
                ) : (
                    <ProviderIconFallback />
                )}
            </Root>
        );
    }

    return (
        <Root $size={size} className={className}>
            <BaseIcon src={TON_ASSET.image}>
                <BaseIconFallback />
            </BaseIcon>
            <Badge $size={badgeSize}>
                {ProviderIconComponent ? (
                    <ProviderIconFrame>
                        <ProviderIconComponent aria-hidden focusable="false" />
                    </ProviderIconFrame>
                ) : (
                    <BadgeFallback />
                )}
            </Badge>
        </Root>
    );
};
