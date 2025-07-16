import { useEffect, useId, useState } from 'react';
import styled from 'styled-components';

import { Label2 } from '../Text';
import { DoneIcon } from '../Icon';
import { ListBlock } from '../List';
import { Button } from '../fields/Button';
import { handleSubmit } from '../../libs/form';
import { PurchaseSubscriptionScreens } from '../../enums/pro';
import { ProWalletListItem } from './ProWalletListItem';
import { useTranslation } from '../../hooks/translation';
import { ProSubscriptionHeader } from './ProSubscriptionHeader';
import { useProState, useSelectWalletForProMutation } from '../../state/pro';
import { useNotifyError, useToast } from '../../hooks/useNotification';
import { useAccountWallets, useActiveWallet } from '../../state/wallet';
import { usePurchaseControlScreen } from '../../hooks/pro/usePurchaseControlScreen';
import { NotificationBlock, NotificationFooter, NotificationFooterPortal } from '../Notification';
import { isTelegramSubscription, isValidSubscription } from '@tonkeeper/core/dist/entries/pro';
import { useNavigate } from '../../hooks/router/useNavigate';
import { AppRoute, SettingsRoute } from '../../libs/routes';

export const ProAccountChooseScreen = () => {
    const formId = useId();
    const { t } = useTranslation();
    const { data: proState } = useProState();
    const { goTo, onClose } = usePurchaseControlScreen();
    const navigate = useNavigate();
    const activeWallet = useActiveWallet();
    const accountsWallets = useAccountWallets();
    const [selectedAccountId, setSelectedAccountId] = useState(activeWallet?.rawAddress ?? '');

    const toast = useToast();

    const { mutateAsync, error, isSuccess, isLoading } = useSelectWalletForProMutation();
    useNotifyError(error);

    useEffect(() => {
        if (!isSuccess) return;

        // TODO Verify PRO before
        if (
            proState &&
            !isTelegramSubscription(proState.current) &&
            isValidSubscription(proState.current)
        ) {
            onClose();
            navigate(AppRoute.settings + SettingsRoute.pro);

            return;
        }

        goTo(PurchaseSubscriptionScreens.PURCHASE);
    }, [isSuccess, proState?.current]);

    const handleNextScreen = async () => {
        if (!selectedAccountId) {
            toast(t('choose_wallet_for_pro'));

            return;
        }

        await mutateAsync(selectedAccountId);
    };

    const handleChooseWallet = (id: string) => {
        if (isLoading) return;

        setSelectedAccountId(id);
    };

    return (
        <ContentWrapper onSubmit={handleSubmit(handleNextScreen)} id={formId}>
            <ProSubscriptionHeader
                titleKey="choose_wallet_for_pro"
                subtitleKey="subscription_will_be_linked_to_wallet"
            />
            <ListBlock fullWidth margin={false}>
                {accountsWallets.flatMap(accountWalletProps => {
                    const walletId = accountWalletProps.wallet.id;

                    return (
                        <ProWalletListItem
                            key={walletId}
                            onClick={() => handleChooseWallet(walletId)}
                            rightElement={
                                <Icon>{selectedAccountId === walletId && <DoneIcon />}</Icon>
                            }
                            {...accountWalletProps}
                        />
                    );
                })}
            </ListBlock>

            <NotificationFooterPortal>
                <NotificationFooter>
                    <Button
                        primary
                        fullWidth
                        size="large"
                        type="submit"
                        form={formId}
                        loading={isLoading}
                    >
                        <Label2>{t('continue')}</Label2>
                    </Button>
                </NotificationFooter>
            </NotificationFooterPortal>
        </ContentWrapper>
    );
};

const ContentWrapper = styled(NotificationBlock)`
    padding-top: 1rem;
`;

const Icon = styled.span`
    padding-left: 0.5rem;
    color: ${props => props.theme.accentBlue};
    display: flex;
    margin-left: auto;
    height: 16px;
    width: 24px;
`;
