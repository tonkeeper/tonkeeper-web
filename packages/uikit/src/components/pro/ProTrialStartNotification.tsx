import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { backwardCompatibilityFilter } from '@tonkeeper/core/dist/service/proService';

import { DoneIcon, TelegramIcon } from '../Icon';
import { Body2, Label2 } from '../Text';
import { Button } from '../fields/Button';
import { ListBlock } from '../List';
import { useTranslation } from '../../hooks/translation';
import { useActivateTrialMutation, useSelectWalletForProMutation } from '../../state/pro';
import { useProCompatibleAccountsWallets, useActiveWallet } from '../../state/wallet';
import { useNotifyError, useToast } from '../../hooks/useNotification';
import { Notification, NotificationFooterPortal, useSetNotificationOnBack } from '../Notification';
import { ProSubscriptionLightHeader } from './ProSubscriptionLightHeader';
import { ProWalletListItem } from './ProWalletListItem';
import { ErrorBoundary } from '../shared/ErrorBoundary';
import { fallbackRenderOver } from '../Error';

export const ProTrialStartNotification: FC<{
    isOpen: boolean;
    onClose: (confirmed?: boolean) => void;
}> = ({ isOpen, onClose }) => {
    return (
        <Notification isOpen={isOpen} handleClose={() => onClose()}>
            {() => (
                <ErrorBoundary fallbackRender={fallbackRenderOver('Failed to display Trial modal')}>
                    <ProTrialStartContent key={isOpen ? 'open' : 'closed'} onClose={onClose} />
                </ErrorBoundary>
            )}
        </Notification>
    );
};

const ProTrialStartContent: FC<{
    onClose: (confirmed?: boolean) => void;
}> = ({ onClose }) => {
    const { t } = useTranslation();
    const toast = useToast();
    const activeWallet = useActiveWallet();
    const accountsWallets = useProCompatibleAccountsWallets(backwardCompatibilityFilter);

    const [step, setStep] = useState<'wallet' | 'telegram'>('wallet');
    const [selectedWalletId, setSelectedWalletId] = useState(activeWallet.id);

    const selectedAccountWallet = useMemo(
        () => accountsWallets.find(aw => aw.wallet.id === selectedWalletId),
        [accountsWallets, selectedWalletId]
    );

    const {
        mutateAsync: selectWallet,
        error: selectError,
        isSuccess: isSelectSuccess,
        isLoading: isSelectLoading
    } = useSelectWalletForProMutation();
    useNotifyError(selectError);

    const {
        mutateAsync: activateTrial,
        error: trialError,
        isSuccess: isTrialSuccess,
        isLoading: isTrialLoading
    } = useActivateTrialMutation();
    useNotifyError(trialError);

    useEffect(() => {
        if (isSelectSuccess) {
            setStep('telegram');
        }
    }, [isSelectSuccess]);

    useEffect(() => {
        if (isTrialSuccess) {
            onClose(true);
        }
    }, [isTrialSuccess, onClose]);

    const handleChooseWallet = (id: string) => {
        if (isSelectLoading) return;
        setSelectedWalletId(id);
    };

    const handleConnectWallet = async () => {
        if (!selectedWalletId) {
            toast(t('choose_wallet_for_pro'));
            return;
        }
        await selectWallet(selectedWalletId);
    };

    const handleConnectTelegram = async () => {
        await activateTrial();
    };

    const handleBack = useCallback(() => setStep('wallet'), []);
    useSetNotificationOnBack(step === 'telegram' ? handleBack : undefined);

    if (step === 'wallet') {
        return (
            <WalletStepWrapper>
                <ProSubscriptionLightHeader
                    titleKey="choose_wallet_for_pro"
                    subtitleKey="subscription_will_be_linked_to_wallet"
                />
                <ListBlock fullWidth margin={false}>
                    {accountsWallets.map(accountWalletProps => {
                        const walletId = accountWalletProps.wallet.id;
                        return (
                            <ProWalletListItem
                                key={walletId}
                                onClick={() => handleChooseWallet(walletId)}
                                rightElement={
                                    <CheckIcon>
                                        {selectedWalletId === walletId && <DoneIcon />}
                                    </CheckIcon>
                                }
                                {...accountWalletProps}
                            />
                        );
                    })}
                </ListBlock>
                <NotificationFooterPortal>
                    <FooterStyled>
                        <Button
                            primary
                            fullWidth
                            loading={isSelectLoading}
                            onClick={handleConnectWallet}
                        >
                            <Label2>{t('connect_wallet')}</Label2>
                        </Button>
                    </FooterStyled>
                </NotificationFooterPortal>
            </WalletStepWrapper>
        );
    }

    if (!selectedAccountWallet) {
        setStep('wallet');
        return null;
    }

    return (
        <TelegramStepWrapper>
            <ImageStyled src="https://tonkeeper.com/assets/icon.ico" />
            <Label2>{t('start_trial_notification_heading')}</Label2>
            <Body2>{t('start_trial_notification_description')}</Body2>
            <SelectedWalletInfo>
                <ProWalletListItem disableHover {...selectedAccountWallet} />
            </SelectedWalletInfo>
            <NotificationFooterPortal>
                <FooterStyled>
                    <TelegramButton
                        primary
                        fullWidth
                        loading={isTrialLoading}
                        onClick={handleConnectTelegram}
                    >
                        <TelegramIcon />
                        {t('connect_telegram')}
                    </TelegramButton>
                </FooterStyled>
            </NotificationFooterPortal>
        </TelegramStepWrapper>
    );
};

const WalletStepWrapper = styled.div`
    padding: 1rem 0;
`;

const TelegramStepWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    max-width: 360px;
    margin: 0 auto;
    padding-bottom: 8px;

    & > ${Body2} {
        color: ${props => props.theme.textSecondary};
    }
`;

const SelectedWalletInfo = styled.div`
    margin-top: 1rem;

    > * {
        background: transparent;
        padding: 0;
    }
`;

const FooterStyled = styled.div`
    padding: 1rem 0;
`;

const CheckIcon = styled.span`
    padding-left: 0.5rem;
    color: ${props => props.theme.accentBlue};
    display: flex;
    margin-left: auto;
    height: 16px;
    width: 24px;
`;

const TelegramButton = styled(Button)`
    display: flex;
    gap: 0.5rem;
    justify-content: center;
`;

const ImageStyled = styled.img`
    width: 56px;
    height: 56px;
    margin-bottom: 1rem;
`;
