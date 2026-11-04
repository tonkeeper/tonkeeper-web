import { FC } from 'react';

import { useTranslation } from '../../../../hooks/translation';
import { Button } from '../../../../primitives';
import { Modal } from '../../../../primitives/Modal';

/**
 * "How migration works" sheet: what the backend moves to the multichain
 * wallet and what stays behind. The asset scope itself is server-decided;
 * this copy mirrors the natives' info popup.
 */
export const MigrationHowItWorksSheet: FC<{ isOpen: boolean; onClose: () => void }> = ({
    isOpen,
    onClose
}) => {
    const { t } = useTranslation();

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="flex flex-col pb-4 text-center">
                <div className="px-4 pt-3 text-h2 text-textPrimary">
                    {t('migration_how_it_works_title')}
                </div>
                <div className="px-4 pt-1 text-body1 text-textSecondary">
                    {t('migration_how_it_works_intro')}
                </div>
            </div>
            <ul className="mb-4 flex list-disc flex-col gap-3 rounded-medium bg-backgroundContent py-4 pl-8 pr-4 text-body2 text-textSecondary">
                <li>{t('migration_how_it_works_will_migrate')}</li>
                <li>{t('migration_how_it_works_will_stay')}</li>
                <li>{t('migration_how_it_works_note')}</li>
            </ul>
            <Button variant="primaryBlue" size="large" fullWidth onClick={onClose}>
                {t('ok')}
            </Button>
        </Modal>
    );
};
