import { FC } from 'react';
import { useTranslation } from '../../../../hooks/translation';

import { CloseButton } from '../../../../primitives/CloseButton';
import { FiltersButton } from '../MultichainFiltersSheet';

export const ManageCryptoHeader: FC<{ onClose: () => void; onOpenFilters?: () => void }> = ({
    onClose,
    onOpenFilters
}) => {
    const { t } = useTranslation();
    return (
        <header className="relative flex h-[64px] shrink-0 items-center justify-center px-16">
            {onOpenFilters && (
                <FiltersButton
                    onClick={onOpenFilters}
                    className="absolute left-4 top-1/2 -translate-y-1/2"
                />
            )}
            <div className="text-h3 text-textPrimary">{t('wallet_manage_crypto_title')}</div>
            <CloseButton onClick={onClose} className="absolute right-4 top-1/2 -translate-y-1/2" />
        </header>
    );
};
