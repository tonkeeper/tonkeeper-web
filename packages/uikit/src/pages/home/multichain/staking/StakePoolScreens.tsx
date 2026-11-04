import { FC, useMemo } from 'react';

import { PoolImplementationType, PoolInfo } from '@tonkeeper/core/dist/tonApiV2';
import { formatDecimal } from '@tonkeeper/core/dist/utils/numberFormat';

import { Button } from '../../../../primitives';
import { Modal, ModalFooter, ModalFooterPortal } from '../../../../primitives/Modal';
import { cn } from '../../../../libs/css';
import { useTranslation } from '../../../../hooks/translation';
import { useStakingPoolImplementations } from '../../../../state/staking/useStakingPools';
import IcChevronRight16 from '../../../../icons/components/IcChevronRight16';
import {
    AccentTag,
    StakingDisclaimer,
    StakingInfoCard,
    StakingLinksSection,
    StakingPoolLogo,
    formatMinStake,
    formatMinStakeCompact,
    stakingPoolLinks
} from './staking-shared';

export type StakingPoolGroup = 'whales' | 'nominators';

export const isLiquidPool = (pool: PoolInfo) => !!pool.liquidJettonMaster;

export const poolsOfGroup = (pools: PoolInfo[], group: StakingPoolGroup): PoolInfo[] =>
    pools.filter(
        pool =>
            !isLiquidPool(pool) &&
            pool.implementation ===
                (group === 'whales' ? PoolImplementationType.Whales : PoolImplementationType.Tf)
    );

export const maxApyPoolOf = (pools: PoolInfo[]): PoolInfo | undefined =>
    pools.reduce<PoolInfo | undefined>(
        (best, pool) => (best === undefined || pool.apy > best.apy ? pool : best),
        undefined
    );

const RadioIndicator: FC<{ selected: boolean }> = ({ selected }) => (
    <span className="relative block size-7 shrink-0">
        <span
            className={cn(
                'absolute inset-0.5 rounded-full border-2',
                selected ? 'border-accentBlue' : 'border-buttonTertiaryBackground'
            )}
        />
        {selected && (
            <span className="absolute left-1/2 top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accentBlue" />
        )}
    </span>
);

const PoolRadioCell: FC<{
    pool: PoolInfo;
    subtitle: string;
    showMaxApyTag: boolean;
    selected: boolean;
    withDivider: boolean;
    onClick: () => void;
}> = ({ pool, subtitle, showMaxApyTag, selected, withDivider, onClick }) => {
    const { t } = useTranslation();
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'flex w-full cursor-pointer items-center bg-backgroundContent text-left transition-colors duration-100 hover:bg-backgroundContentTint',
                withDivider && 'border-b border-separatorCommon'
            )}
        >
            <span className="py-4 pl-4">
                <StakingPoolLogo pool={pool} className="size-11" />
            </span>
            <span className="min-w-0 flex-1 p-4">
                <span className="flex items-center gap-1.5">
                    <span className="truncate text-label1 text-textPrimary">{pool.name}</span>
                    {showMaxApyTag && <AccentTag>{t('staking_max_apy_tag')}</AccentTag>}
                </span>
                <span className="block whitespace-pre-line text-body2 text-textSecondary">
                    {subtitle}
                </span>
            </span>
            <span className="py-3.5 pr-4">
                <RadioIndicator selected={selected} />
            </span>
        </button>
    );
};

const GroupCell: FC<{
    title: string;
    pools: PoolInfo[];
    withDivider: boolean;
    onClick: () => void;
}> = ({ title, pools, withDivider, onClick }) => {
    const { t } = useTranslation();
    const minDeposit = Math.min(...pools.map(pool => pool.minStake));
    const maxApy = Math.max(...pools.map(pool => pool.apy));
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'flex w-full cursor-pointer items-center bg-backgroundContent text-left transition-colors duration-100 hover:bg-backgroundContentTint',
                withDivider && 'border-b border-separatorCommon'
            )}
        >
            <span className="py-4 pl-4">
                <StakingPoolLogo pool={pools[0]} className="size-11" />
            </span>
            <span className="min-w-0 flex-1 p-4">
                <span className="block truncate text-label1 text-textPrimary">{title}</span>
                <span className="block text-body2 text-textSecondary">
                    {t('staking_group_description', {
                        minDeposit: formatMinStakeCompact(minDeposit),
                        apy: formatDecimal(maxApy)
                    })}
                </span>
            </span>
            <span className="py-4 pr-4 text-iconTertiary">
                <IcChevronRight16 className="size-4" />
            </span>
        </button>
    );
};

export interface StakeOptionsScreenProps {
    isOpen: boolean;
    onClose: () => void;
    onBack: () => void;
    pools: PoolInfo[];
    selectedPool: PoolInfo | undefined;
    onOpenPool: (pool: PoolInfo) => void;
    onOpenGroup: (group: StakingPoolGroup) => void;
}

/**
 * "Options" pool picker: liquid-staking pools as radio cells (tap opens the
 * pool's detail screen; the radio marks the current selection) and the
 * non-liquid providers as chevron rows leading to their pool lists.
 */
export const StakeOptionsScreen: FC<StakeOptionsScreenProps> = ({
    isOpen,
    onClose,
    onBack,
    pools,
    selectedPool,
    onOpenPool,
    onOpenGroup
}) => {
    const { t } = useTranslation();
    const liquidPools = useMemo(() => pools.filter(isLiquidPool), [pools]);
    const whalesPools = useMemo(() => poolsOfGroup(pools, 'whales'), [pools]);
    const nominatorPools = useMemo(() => poolsOfGroup(pools, 'nominators'), [pools]);
    const maxApyPool = useMemo(() => maxApyPoolOf(pools), [pools]);

    const groups = (
        [
            { key: 'whales', title: t('staking_group_ton_whales'), pools: whalesPools },
            { key: 'nominators', title: t('staking_group_ton_nominators'), pools: nominatorPools }
        ] as const
    ).filter(group => group.pools.length > 0);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            onBack={onBack}
            topBarTitle={t('staking_options_title')}
            variant="content"
            mobileHeight="full"
        >
            <div className="flex flex-col pb-4">
                {liquidPools.length > 0 && (
                    <>
                        <h3 className="py-3.5 text-h3 text-textPrimary">
                            {t('staking_liquid_group_title')}
                        </h3>
                        <div className="overflow-hidden rounded-medium">
                            {liquidPools.map((pool, index) => (
                                <PoolRadioCell
                                    key={pool.address}
                                    pool={pool}
                                    subtitle={`${t('staking_minimum_deposit_line', {
                                        minDeposit: formatMinStake(pool.minStake)
                                    })}\n${t('staking_pools_apy', {
                                        apy: formatDecimal(pool.apy)
                                    })}`}
                                    showMaxApyTag={maxApyPool?.address === pool.address}
                                    selected={selectedPool?.address === pool.address}
                                    withDivider={index !== liquidPools.length - 1}
                                    onClick={() => onOpenPool(pool)}
                                />
                            ))}
                        </div>
                    </>
                )}
                {groups.length > 0 && (
                    <>
                        <h3 className="pb-3.5 pt-7 text-h3 text-textPrimary">
                            {t('staking_other_group_title')}
                        </h3>
                        <div className="overflow-hidden rounded-medium">
                            {groups.map((group, index) => (
                                <GroupCell
                                    key={group.key}
                                    title={group.title}
                                    pools={group.pools}
                                    withDivider={index !== groups.length - 1}
                                    onClick={() => onOpenGroup(group.key)}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
};

export interface StakePoolListScreenProps {
    isOpen: boolean;
    onClose: () => void;
    onBack: () => void;
    group: StakingPoolGroup;
    pools: PoolInfo[];
    selectedPool: PoolInfo | undefined;
    onOpenPool: (pool: PoolInfo) => void;
}

/** Pool list of a non-liquid provider group (TON Whales queues / TON Nominators pools). */
export const StakePoolListScreen: FC<StakePoolListScreenProps> = ({
    isOpen,
    onClose,
    onBack,
    group,
    pools,
    selectedPool,
    onOpenPool
}) => {
    const { t } = useTranslation();
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            onBack={onBack}
            topBarTitle={
                group === 'whales'
                    ? t('staking_group_ton_whales')
                    : t('staking_group_ton_nominators')
            }
            variant="content"
            mobileHeight="full"
        >
            <div className="overflow-hidden rounded-medium pb-4">
                {pools.map((pool, index) => (
                    <PoolRadioCell
                        key={pool.address}
                        pool={pool}
                        subtitle={t('staking_pools_apy', { apy: formatDecimal(pool.apy) })}
                        showMaxApyTag={false}
                        selected={selectedPool?.address === pool.address}
                        withDivider={index !== pools.length - 1}
                        onClick={() => onOpenPool(pool)}
                    />
                ))}
            </div>
        </Modal>
    );
};

export interface StakePoolDetailScreenProps {
    isOpen: boolean;
    onClose: () => void;
    onBack: () => void;
    pool: PoolInfo;
    showMaxApyTag: boolean;
    /** Renders the Choose footer; omit for the read-only info variant. */
    onChoose?: () => void;
}

/** Pool detail: APY / minimal deposit card, disclaimer, links, Choose. */
export const StakePoolDetailScreen: FC<StakePoolDetailScreenProps> = ({
    isOpen,
    onClose,
    onBack,
    pool,
    showMaxApyTag,
    onChoose
}) => {
    const { t } = useTranslation();
    const { data: implementations } = useStakingPoolImplementations();
    const links = useMemo(
        () => stakingPoolLinks(pool, implementations?.[pool.implementation]),
        [pool, implementations]
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            onBack={onBack}
            topBarTitle={pool.name}
            variant="content"
            mobileHeight="full"
        >
            <div className="flex flex-col pb-4">
                <StakingInfoCard pool={pool} showMaxApyTag={showMaxApyTag} />
                <StakingDisclaimer className="px-0" />
                <StakingLinksSection links={links} />
            </div>
            {onChoose && (
                <ModalFooterPortal>
                    <ModalFooter>
                        <Button variant="primaryBlue" size="large" fullWidth onClick={onChoose}>
                            {t('staking_choose_pool_button')}
                        </Button>
                    </ModalFooter>
                </ModalFooterPortal>
            )}
        </Modal>
    );
};
