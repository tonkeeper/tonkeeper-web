import { FC } from 'react';

import { useTranslation } from '../../../../hooks/translation';
import IcEyeClosedOutline28 from '../../../../icons/components/IcEyeClosedOutline28';

export const HomeMultichainAllCollectiblesHidden: FC<{ onClick: () => void }> = ({ onClick }) => {
    const { t } = useTranslation();

    return (
        <button
            type="button"
            onClick={onClick}
            className="flex min-h-[76px] w-full cursor-pointer items-center gap-4 rounded-medium bg-backgroundContent px-4 py-3 text-left transition-colors duration-100 hover:bg-backgroundContentTint"
        >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-backgroundContentTint text-iconSecondary">
                <IcEyeClosedOutline28 className="size-7" />
            </span>
            <span className="min-w-0 flex-1">
                <span className="block text-label1 text-textPrimary">
                    {t('multichain_collectibles_all_hidden_title')}
                </span>
                <span className="block text-body2 text-textSecondary">
                    {t('multichain_collectibles_all_hidden_subtitle')}
                </span>
            </span>
        </button>
    );
};
