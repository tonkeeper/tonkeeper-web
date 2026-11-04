import { FC } from 'react';

import { useNavigate } from '../../../../hooks/router/useNavigate';
import { useTranslation } from '../../../../hooks/translation';
import { MultichainRoute, MultichainSettingsRoute } from '../../../../libs/routes';
import { Checkbox, Link } from '../../../../primitives';

/**
 * "I have a backup copy…" acknowledgement row used by the destructive
 * confirmation sheets (sign out, delete). The whole row toggles the
 * checkbox; the inline "Back up now" link leaves for the backup screen
 * instead (closing the host sheet first).
 */
export const BackupAcknowledgeRow: FC<{
    checked: boolean;
    onChange: (checked: boolean) => void;
    /** Closes the host sheet before navigating to the backup screen. */
    onLeaveForBackup: () => void;
}> = ({ checked, onChange, onLeaveForBackup }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const onBackup = () => {
        onLeaveForBackup();
        navigate(MultichainRoute.settings + MultichainSettingsRoute.backup);
    };

    return (
        <div
            role="checkbox"
            aria-checked={checked}
            tabIndex={0}
            onClick={() => onChange(!checked)}
            onKeyDown={e => {
                if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    onChange(!checked);
                }
            }}
            className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-small bg-backgroundContent py-2 pl-3 pr-4 transition-colors duration-100 hover:bg-backgroundContentTint"
        >
            <div className="flex flex-col items-start text-left">
                <span className="text-body3 text-textPrimary">
                    {t('I_have_a_backup_copy_of_recovery_phrase')}
                </span>
                <Link
                    className="text-body3"
                    onClick={e => {
                        e.stopPropagation();
                        onBackup();
                    }}
                >
                    {t('Back_up_now')}
                </Link>
            </div>
            <Checkbox checked={checked} />
        </div>
    );
};
