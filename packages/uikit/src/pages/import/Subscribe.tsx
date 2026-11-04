import { MnemonicType } from '@tonkeeper/core/dist/entries/password';
import { TonContract } from '@tonkeeper/core/dist/entries/wallet';
import React, { FC, Suspense } from 'react';

import { LaterButton } from '../../components/BackButton';
import { NotificationIcon } from '../../components/lottie/LottieIcons';
import { ModalFooter, ModalFooterPortal } from '../../primitives/Modal';
import { useIsFullWidthMode } from '../../hooks/useIsFullWidthMode';
import { useIsOnIosReview } from '../../hooks/ios';
import { useTranslation } from '../../hooks/translation';
import { signTonConnectMnemonicOver } from '../../state/mnemonic';
import { useSubscribeMutation } from '../../state/subscribe';
import { Button } from '../../primitives/Button';

const ProNotificationsIcon = React.lazy(() => import('./ProNotificationsIcon'));

/**
 * Create-flow "Enable push notifications" step. Centered hero (lottie
 * icon on mobile, branded SVG on full-width) with a call to action; the
 * user can skip via `LaterButton` on mobile or via the modal close
 * action on desktop.
 *
 * The CTA renders through `ModalFooterPortal` so it docks to
 * the modal sheet's bottom safe-area instead of floating with the
 * centered content.
 */
export const Subscribe: FC<{
    wallet: TonContract;
    mnemonic: string[];
    onDone: () => void;
    mnemonicType: MnemonicType;
}> = ({ wallet, mnemonic, onDone, mnemonicType }) => {
    const { t } = useTranslation();
    const { mutate, reset, isLoading } = useSubscribeMutation(
        wallet,
        signTonConnectMnemonicOver(mnemonic, mnemonicType),
        onDone
    );

    const isFullWidthMode = useIsFullWidthMode();
    const isOnReview = useIsOnIosReview();

    return (
        <>
            {!isFullWidthMode && <LaterButton skip={onDone} />}
            <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
                {isFullWidthMode ? (
                    <Suspense>
                        <ProNotificationsIcon />
                    </Suspense>
                ) : (
                    <NotificationIcon />
                )}
                <div className="flex flex-col gap-1 px-8 pb-2">
                    <h2 className="text-h2 text-textPrimary">
                        {t('reminder_notifications_title')}
                    </h2>
                    {!isOnReview && (
                        <p className="text-balance text-body1 text-textSecondary">
                            {t('reminder_notifications_caption')}
                        </p>
                    )}
                </div>
            </div>
            <ModalFooterPortal>
                <ModalFooter>
                    <Button
                        size="large"
                        variant="primaryBlue"
                        fullWidth
                        loading={isLoading}
                        onClick={() => {
                            reset();
                            mutate();
                        }}
                    >
                        {t('reminder_notifications_enable_button')}
                    </Button>
                </ModalFooter>
            </ModalFooterPortal>
        </>
    );
};
