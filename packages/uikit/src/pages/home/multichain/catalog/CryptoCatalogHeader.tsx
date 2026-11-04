import { FC } from 'react';
import { useTranslation } from '../../../../hooks/translation';

import { BackButton } from '../../../../primitives/BackButton';
import { CloseButton } from '../../../../primitives/CloseButton';

/**
 * Catalog sheet header, shared by the home "Crypto" modal (close affordance
 * on the right) and the routed Crypto page (back chevron on the left).
 */
export const CryptoCatalogHeader: FC<{ onClose?: () => void; onBack?: () => void }> = ({
    onClose,
    onBack
}) => {
    const { t } = useTranslation();
    return (
        <header className="relative flex h-[64px] shrink-0 items-center justify-center px-16">
            <div className="text-h3 text-textPrimary">{t('wallet_crypto_section')}</div>
            {onBack && (
                <BackButton onClick={onBack} className="absolute left-4 top-1/2 -translate-y-1/2" />
            )}
            {onClose && (
                <CloseButton
                    onClick={onClose}
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                />
            )}
        </header>
    );
};
