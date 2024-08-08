import { TonContract, TonWalletStandard } from "@tonkeeper/core/dist/entries/wallet";
import React, { FC } from 'react';
import { IconPage } from '../../components/Layout';
import { Button } from '../../components/fields/Button';
import { NotificationIcon } from '../../components/lottie/LottieIcons';
import { useTranslation } from '../../hooks/translation';
import { signTonConnectMnemonicOver } from '../../state/mnemonic';
import { useSubscribeMutation } from '../../state/subscribe';

export const Subscribe: FC<{
    wallet: TonContract;
    mnemonic: string[];
    onDone: () => void;
}> = ({ wallet, mnemonic, onDone }) => {
    const { t } = useTranslation();
    const { mutate, reset, isLoading } = useSubscribeMutation(
        wallet,
        signTonConnectMnemonicOver(mnemonic),
        onDone
    );
    return (
        <IconPage
            skip={onDone}
            icon={<NotificationIcon />}
            title={t('reminder_notifications_title')}
            description={t('reminder_notifications_caption')}
            button={
                <Button
                    size="large"
                    fullWidth
                    primary
                    marginTop
                    loading={isLoading}
                    onClick={() => {
                        reset();
                        mutate();
                    }}
                >
                    {t('reminder_notifications_enable_button')}
                </Button>
            }
        />
    );
};
