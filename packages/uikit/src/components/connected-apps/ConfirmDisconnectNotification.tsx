import { FC } from 'react';
import { styled } from 'styled-components';
import { useTranslation } from '../../hooks/translation';
import { usePrevious } from '../../hooks/usePrevious';
import { Notification, NotificationFooter, NotificationFooterPortal } from '../Notification';
import { Button } from '../fields/Button';
import { formatDappUrl } from './utils';

const ButtonsBlock = styled.div`
    display: flex;
    gap: 8px;

    > * {
        flex: 1;
    }
`;

export const ConfirmDisconnectNotification: FC<{
    isOpen: boolean;
    onClose: (confirmed?: boolean) => void;
    isLoading?: boolean;
    app?: { origin: string } | 'all';
}> = ({ isOpen, onClose, app, isLoading }) => {
    const { t } = useTranslation();
    const prev = usePrevious(app);

    const appWithFallback = app || prev;

    return (
        <Notification
            isOpen={isOpen}
            handleClose={() => onClose(false)}
            title={
                appWithFallback === 'all' ? (
                    t('disconnect_all_apps_confirm')
                ) : (
                    <>
                        {t('disconnect')}&nbsp;{formatDappUrl(appWithFallback?.origin)}?
                    </>
                )
            }
        >
            {() => (
                <NotificationFooterPortal>
                    <NotificationFooter>
                        <ButtonsBlock>
                            <Button secondary loading={isLoading} onClick={() => onClose(false)}>
                                {t('cancel')}
                            </Button>
                            <Button primary loading={isLoading} onClick={() => onClose(true)}>
                                {t('disconnect')}
                            </Button>
                        </ButtonsBlock>
                    </NotificationFooter>
                </NotificationFooterPortal>
            )}
        </Notification>
    );
};
