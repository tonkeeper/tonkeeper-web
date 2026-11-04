import { FC, Fragment, ReactNode } from 'react';

import { useNavigate } from '../../../hooks/router/useNavigate';
import { useTranslation } from '../../../hooks/translation';
import { cn } from '../../../libs/css';
import { MultichainRoute, MultichainSettingsRoute } from '../../../libs/routes';
import {
    FinishSetupItem,
    useFinishSetupItems,
    useSkipFinishSetup
} from '../../../state/multichain/useFinishSetup';
import { useMarkMigrationOpened } from '../../../state/multichain/useMigration';
import IcChevronRight16 from '../../../icons/components/IcChevronRight16';
import IcEyeDisable16 from '../../../icons/components/IcEyeDisable16';
import IcTrayArrowDown28 from '../../../icons/components/IcTrayArrowDown28';
import { ListTitle } from './ListTitle';
import { MIGRATION_FROM_PARAM } from './settings/MigrationPage';

const SetupCell: FC<{
    icon: ReactNode;
    title: string;
    subtitle: string;
    onClick: () => void;
}> = ({ icon, title, subtitle, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className="flex w-full cursor-pointer items-center text-left transition-colors duration-100 hover:bg-backgroundContentTint"
    >
        <div className="shrink-0 py-4 pl-4">
            <span className="flex size-11 items-center justify-center rounded-full bg-accentBlue/12 text-accentBlue [&>svg]:size-7">
                {icon}
            </span>
        </div>
        <div className="min-w-0 flex-1 px-3 py-4">
            <div className="line-clamp-2 text-label1 text-textPrimary">{title}</div>
            <div className="truncate text-body2 text-textSecondary">{subtitle}</div>
        </div>
        <div className="flex shrink-0 items-center py-4 pr-4">
            <IcChevronRight16 className="size-4 text-iconTertiary" />
        </div>
    </button>
);

/**
 * The natives' "Finish setting up" checklist for a multichain account: a
 * titled card of pending steps with a Skip that hides it for this account
 * for good. On web the only step is migrating assets out of the legacy TON
 * wallets still on the device, so the section disappears by itself once
 * none are left.
 */
export const FinishSetupSection: FC<{ className?: string }> = ({ className }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const items = useFinishSetupItems();
    const { mutate: skip } = useSkipFinishSetup();
    const { mutate: markMigrationOpened } = useMarkMigrationOpened();

    if (!items || items.length === 0) {
        return null;
    }

    const openMigration = () => {
        markMigrationOpened();
        navigate(
            `${MultichainRoute.settings}${MultichainSettingsRoute.migration}?${MIGRATION_FROM_PARAM}=setup`
        );
    };

    const renderItem = (item: FinishSetupItem) => (
        <SetupCell
            icon={<IcTrayArrowDown28 />}
            title={t('migration_subtitle')}
            subtitle={t('finish_setup_migration_wallets_left', { count: item.walletsLeft })}
            onClick={openMigration}
        />
    );

    return (
        <section className={cn('flex flex-col', className)}>
            <ListTitle
                title={t('finish_setup_title')}
                right={
                    // The List Title "Right Label" spec: Body 2 secondary text,
                    // then the eye icon in its 6/8 slot nudged below center.
                    <button
                        type="button"
                        onClick={() => skip()}
                        className="flex cursor-pointer items-center text-body2 text-textSecondary transition-colors duration-100 hover:text-textPrimary"
                    >
                        <span>{t('finish_setup_skip')}</span>
                        <span className="flex items-center pl-1.5 pr-2 pt-1">
                            <IcEyeDisable16 className="size-4" />
                        </span>
                    </button>
                }
            />
            <div className="-mt-1 overflow-hidden rounded-medium bg-backgroundContent">
                {items.map((item, i) => (
                    <Fragment key={item.type}>
                        {i > 0 && <div className="ml-4 h-[0.5px] bg-separatorCommon" />}
                        {renderItem(item)}
                    </Fragment>
                ))}
            </div>
        </section>
    );
};
