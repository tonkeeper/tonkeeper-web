import { FC, ReactNode } from 'react';

import { Button } from '../../primitives';
import { useTranslation } from '../../hooks/translation';
import IcRefresh16 from '../../icons/components/IcRefresh16';

/**
 * The design library's "Modal Center" placeholder: a 56px accent icon over an
 * H3 title and a Body-1 description, with optional action buttons. Used for
 * the empty and error outcomes of sheet content that failed to produce a list.
 */
export const ModalCenterState: FC<{
    icon: ReactNode;
    title: string;
    subtitle?: string;
    children?: ReactNode;
}> = ({ icon, title, subtitle, children }) => (
    <div className="flex flex-col items-center py-8">
        <div className="pb-4 text-accentBlue [&>svg]:size-14">{icon}</div>
        <div className="flex flex-col items-center gap-1 px-8 pb-4">
            <h3 className="text-center text-h3 text-textPrimary">{title}</h3>
            {subtitle && <p className="text-center text-body1 text-textSecondary">{subtitle}</p>}
        </div>
        {children}
    </div>
);

/** "Something went wrong" variant with a Retry button, per the mockup. */
export const ModalCenterError: FC<{ icon: ReactNode; onRetry: () => void }> = ({
    icon,
    onRetry
}) => {
    const { t } = useTranslation();
    return (
        <ModalCenterState
            icon={icon}
            title={t('error_state_title')}
            subtitle={t('error_state_subtitle')}
        >
            <Button
                variant="secondary"
                size="small"
                leftIcon={<IcRefresh16 className="size-4" />}
                onClick={onRetry}
            >
                {t('retry')}
            </Button>
        </ModalCenterState>
    );
};
