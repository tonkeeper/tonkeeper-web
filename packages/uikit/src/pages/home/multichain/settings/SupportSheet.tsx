import { FC } from 'react';

import { useAppSdk } from '../../../../hooks/appSdk';
import { useTranslation } from '../../../../hooks/translation';
import { useActiveConfig } from '../../../../state/wallet';
import { useOpenSupport } from '../../../../state/pro';
import { Button } from '../../../../primitives';
import { Modal } from '../../../../primitives/Modal';
import IcMessageBubble28 from '../../../../icons/components/IcMessageBubble28';
import IcTelegram16 from '../../../../icons/components/IcTelegram16';
import IcEnvelope16 from '../../../../icons/components/IcEnvelope16';

/**
 * "Need help?" sheet behind the Support row: Telegram support chat (the
 * pro priority chat when the subscription grants one) and the e-mail
 * support channel.
 */
export const SupportSheet: FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const { t } = useTranslation();
    const sdk = useAppSdk();
    const config = useActiveConfig();
    const openSupport = useOpenSupport();

    const openTelegram = () => {
        openSupport();
        onClose();
    };
    // Copy first: without a registered mail handler the mailto opens nothing, and the
    // clipboard write has to happen inside the click gesture.
    const openEmail = () => {
        if (config.supportLink) {
            const address = config.supportLink.replace(/^mailto:/i, '').split('?')[0];
            if (address) {
                sdk.copyToClipboard(address, t('settings_support_email_copied'));
            }
            sdk.openPage(config.supportLink);
        }
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="flex flex-col items-center pb-4 text-center">
                <IcMessageBubble28 className="size-[84px] text-accentBlue" />
                <div className="px-8 pt-3 text-h2 text-textPrimary">
                    {t('settings_support_modal_title')}
                </div>
                <div className="px-8 pt-1 text-body1 text-textSecondary">
                    {t('settings_support_modal_caption')}
                </div>
            </div>
            <div className="flex flex-col gap-4">
                <Button
                    variant="primaryBlue"
                    size="large"
                    fullWidth
                    leftIcon={<IcTelegram16 />}
                    onClick={openTelegram}
                >
                    {t('settings_support_modal_telegram')}
                </Button>
                <Button
                    variant="secondary"
                    size="large"
                    fullWidth
                    leftIcon={<IcEnvelope16 />}
                    onClick={openEmail}
                >
                    {t('settings_support_modal_email')}
                </Button>
            </div>
        </Modal>
    );
};
