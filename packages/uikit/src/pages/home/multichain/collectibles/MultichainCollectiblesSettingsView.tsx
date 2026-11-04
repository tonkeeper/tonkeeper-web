import { FC, ReactNode, useState } from 'react';

import { formatAddress, toShortValue } from '@tonkeeper/core/dist/utils/common';
import { Network } from '@tonkeeper/core/dist/entries/network';

import { AddRemoveButton, Button } from '../../../../primitives';
import { Modal } from '../../../../primitives/Modal';
import { cn } from '../../../../libs/css';
import { useAppSdk } from '../../../../hooks/appSdk';
import { useTranslation } from '../../../../hooks/translation';
import IcChevronRight16 from '../../../../icons/components/IcChevronRight16';
import IcExclamationmarkCircle28 from '../../../../icons/components/IcExclamationmarkCircle28';
import { BackButton } from '../../../../primitives/BackButton';
import { CollectiblesSettingsGroup } from './collectibles-settings-utils';

const GroupImage: FC<{ group: CollectiblesSettingsGroup; className?: string }> = ({
    group,
    className
}) => (
    <div className={cn('shrink-0 overflow-hidden rounded-lg bg-backgroundContentTint', className)}>
        {group.image && <img src={group.image} alt="" className="h-full w-full object-cover" />}
    </div>
);

const GroupRow: FC<{
    group: CollectiblesSettingsGroup;
    control?: 'remove' | 'add';
    onControl?: () => void;
    onClick: () => void;
    showChevron?: boolean;
    last: boolean;
}> = ({ group, control, onControl, onClick, showChevron = false, last }) => {
    const { t } = useTranslation();
    const subtitle = group.isSingle
        ? t('nft_single_nft')
        : t(group.count === 1 ? 'multichain_nft_count_one' : 'multichain_nft_count_other', {
              count: group.count
          });

    const content = (
        <>
            {control && (
                <span className="pointer-events-auto">
                    <AddRemoveButton type={control} onClick={onControl} className="shrink-0" />
                </span>
            )}
            <GroupImage group={group} className="size-11" />
            <div className="min-w-0 flex-1">
                <div className="truncate text-label1 text-textPrimary">
                    {group.name || toShortValue(group.address)}
                </div>
                <div className="text-body2 text-textSecondary">{subtitle}</div>
            </div>
            {showChevron && <IcChevronRight16 className="size-4 shrink-0 text-iconTertiary" />}
        </>
    );

    const rowClass = cn(
        'relative w-full bg-backgroundContent px-4 py-4 text-left',
        !last && 'border-b border-separatorCommon'
    );

    return (
        <div className={rowClass}>
            <button
                type="button"
                aria-label={group.name || formatAddress(group.address)}
                onClick={onClick}
                className="absolute inset-0 z-0 cursor-pointer bg-transparent transition-colors duration-100 hover:bg-backgroundContentTint"
            />
            <div className="pointer-events-none relative z-10 flex items-center gap-4">
                {content}
            </div>
        </div>
    );
};

const Section: FC<{
    title: string;
    groups: CollectiblesSettingsGroup[];
    control?: 'remove' | 'add';
    onControl?: (group: CollectiblesSettingsGroup) => void;
    onClick: (group: CollectiblesSettingsGroup) => void;
    showChevron?: boolean;
    after?: ReactNode;
}> = ({ title, groups, control, onControl, onClick, showChevron, after }) => {
    if (groups.length === 0 && !after) {
        return null;
    }
    return (
        <section className="flex flex-col">
            <div className="px-4 py-3.5 text-h3 text-textPrimary">{title}</div>
            <div className="mx-4 mb-4 overflow-hidden rounded-medium">
                {groups.map((group, i) => (
                    <GroupRow
                        key={group.address}
                        group={group}
                        control={control}
                        onControl={onControl ? () => onControl(group) : undefined}
                        onClick={() => onClick(group)}
                        showChevron={showChevron}
                        last={i === groups.length - 1 && !after}
                    />
                ))}
                {after}
            </div>
        </section>
    );
};

const AllSpamRow: FC<{ count: number; onClick: () => void }> = ({ count, onClick }) => {
    const { t } = useTranslation();

    return (
        <button
            type="button"
            onClick={onClick}
            className="flex min-h-[76px] w-full cursor-pointer items-center gap-4 bg-backgroundContent px-4 py-3 text-left transition-colors duration-100 hover:bg-backgroundContentTint"
        >
            <span className="flex size-11 shrink-0 items-center justify-center text-iconSecondary">
                <IcExclamationmarkCircle28 className="size-7" />
            </span>
            <span className="min-w-0 flex-1">
                <span className="block text-label1 text-textPrimary">
                    {t('multichain_collectibles_all_spam_title')}
                </span>
                <span className="block text-body2 text-textSecondary">
                    {t('multichain_collectibles_spam_count', { count })}
                </span>
            </span>
            <IcChevronRight16 className="size-4 shrink-0 text-iconTertiary" />
        </button>
    );
};

type DetailsAction = 'hide' | 'show' | 'not-spam';

const DETAILS_ACTION_LABEL: Record<DetailsAction, { token: string; collection: string }> = {
    hide: {
        token: 'approval_move_to_declined_token',
        collection: 'approval_move_to_declined_collection'
    },
    show: {
        token: 'approval_move_to_accepted_token',
        collection: 'approval_move_to_accepted_collection'
    },
    'not-spam': { token: 'multichain_nft_not_spam', collection: 'multichain_nft_not_spam' }
};

const TokenDetailsSheet: FC<{
    group?: CollectiblesSettingsGroup;
    network: Network;
    action: DetailsAction;
    onAction: () => void;
    onClose: () => void;
}> = ({ group, network, action, onAction, onClose }) => {
    const { t } = useTranslation();
    const sdk = useAppSdk();
    const address = group ? formatAddress(group.address, network, true) : '';

    return (
        <Modal
            isOpen={!!group}
            onClose={onClose}
            heading={t(
                group?.isSingle ? 'multichain_nft_token_details' : 'approval_details_collection'
            )}
        >
            {/* The Modal body already carries the sheet's 16px side/bottom padding. */}
            {group && (
                <div className="flex flex-col gap-4">
                    <div className="overflow-hidden rounded-medium bg-backgroundContent">
                        <div className="flex h-14 items-center justify-between gap-4 border-b border-separatorCommon px-4">
                            <div className="min-w-0">
                                <div className="text-body3 text-textSecondary">
                                    {t('multichain_nft_name')}
                                </div>
                                <div className="truncate text-label2 text-textPrimary">
                                    {group.name || toShortValue(group.address)}
                                </div>
                            </div>
                            <GroupImage group={group} className="size-10" />
                        </div>
                        <button
                            type="button"
                            onClick={() => sdk.copyToClipboard(address, t('copied'))}
                            className="flex h-14 w-full flex-col justify-center px-4 text-left"
                        >
                            <span className="text-body3 text-textSecondary">
                                {group.isSingle
                                    ? t('multichain_nft_id_token')
                                    : t('multichain_nft_id_collection')}
                            </span>
                            <span className="truncate text-label2 text-textPrimary">
                                {toShortValue(address)}
                            </span>
                        </button>
                    </div>
                    <Button variant="secondary" size="large" fullWidth onClick={onAction}>
                        {t(DETAILS_ACTION_LABEL[action][group.isSingle ? 'token' : 'collection'])}
                    </Button>
                </div>
            )}
        </Modal>
    );
};

export interface MultichainCollectiblesSettingsViewProps {
    compact?: boolean;
    network: Network;
    visible: CollectiblesSettingsGroup[];
    hidden: CollectiblesSettingsGroup[];
    spam: CollectiblesSettingsGroup[];
    blacklistedCount: number;
    onBack: () => void;
    onHide: (group: CollectiblesSettingsGroup) => void;
    onShow: (group: CollectiblesSettingsGroup) => void;
    onNotSpam: (group: CollectiblesSettingsGroup) => void;
    onOpenAllSpam: () => void;
}

/**
 * Collectibles visibility management: Visible rows carry a remove (hide)
 * button and Hidden rows an add (show) button. Every known group opens its
 * details sheet when the row is tapped. Server-blacklisted NFTs are not
 * exposed individually: the aggregate All spam row opens Tonviewer instead.
 */
export const MultichainCollectiblesSettingsView: FC<MultichainCollectiblesSettingsViewProps> = ({
    compact = false,
    network,
    visible,
    hidden,
    spam,
    blacklistedCount,
    onBack,
    onHide,
    onShow,
    onNotSpam,
    onOpenAllSpam
}) => {
    const { t } = useTranslation();
    const [details, setDetails] = useState<
        { group: CollectiblesSettingsGroup; action: DetailsAction } | undefined
    >();

    return (
        <div
            className={cn(
                'flex flex-col bg-backgroundPage',
                compact ? 'min-h-full' : 'min-h-screen'
            )}
        >
            <header className="relative flex h-16 shrink-0 items-center justify-center px-16">
                <BackButton onClick={onBack} className="absolute left-2 top-1/2 -translate-y-1/2" />
                <div className="text-h3 text-textPrimary">{t('settings_collectibles_list')}</div>
            </header>

            <Section
                title={t('multichain_collectibles_settings_visible')}
                groups={visible}
                control="remove"
                onControl={onHide}
                onClick={group => setDetails({ group, action: 'hide' })}
            />
            <Section
                title={t('multichain_collectibles_settings_hidden')}
                groups={hidden}
                control="add"
                onControl={onShow}
                onClick={group => setDetails({ group, action: 'show' })}
            />
            <Section
                title={t('multichain_collectibles_settings_spam')}
                groups={spam}
                onClick={group => setDetails({ group, action: 'not-spam' })}
                showChevron
                after={
                    blacklistedCount > 0 ? (
                        <AllSpamRow count={blacklistedCount} onClick={onOpenAllSpam} />
                    ) : undefined
                }
            />

            <TokenDetailsSheet
                group={details?.group}
                network={network}
                action={details?.action ?? 'hide'}
                onAction={() => {
                    if (details) {
                        if (details.action === 'hide') onHide(details.group);
                        if (details.action === 'show') onShow(details.group);
                        if (details.action === 'not-spam') onNotSpam(details.group);
                    }
                    setDetails(undefined);
                }}
                onClose={() => setDetails(undefined)}
            />
        </div>
    );
};
