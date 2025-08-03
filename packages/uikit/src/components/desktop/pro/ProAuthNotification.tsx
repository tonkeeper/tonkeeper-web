import { FC, useEffect, useId, useState } from 'react';
import { styled } from 'styled-components';
import {
    hasWalletAuth,
    isTelegramSubscription,
    isValidSubscription
} from '@tonkeeper/core/dist/entries/pro';
import { backwardCompatibilityFilter } from '@tonkeeper/core/dist/service/proService';

import {
    Notification,
    NotificationBlock,
    NotificationFooter,
    NotificationFooterPortal
} from '../../Notification';
import { useProState, useSelectWalletForProMutation } from '../../../state/pro';
import { useTranslation } from '../../../hooks/translation';
import { useNavigate } from '../../../hooks/router/useNavigate';
import { useAccountWallets, useActiveWallet } from '../../../state/wallet';
import { useNotifyError, useToast } from '../../../hooks/useNotification';
import { AppRoute, SettingsRoute } from '../../../libs/routes';
import { handleSubmit } from '../../../libs/form';
import { ProSubscriptionLightHeader } from '../../pro/ProSubscriptionLightHeader';
import { ListBlock } from '../../List';
import { ProWalletListItem } from '../../pro/ProWalletListItem';
import { DoneIcon } from '../../Icon';
import { Button } from '../../fields/Button';
import { Label2 } from '../../Text';
import { useProPurchaseNotification } from '../../modals/ProPurchaseNotificationControlled';

interface IProAuthNotificationProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ProAuthNotification: FC<IProAuthNotificationProps> = props => {
    const { isOpen, onClose } = props;

    return (
        <NotificationStyled mobileFullScreen isOpen={isOpen} handleClose={onClose}>
            {() => <ProAuthNotificationContent onClose={onClose} />}
        </NotificationStyled>
    );
};

type ProAuthNotificationContentProps = Pick<IProAuthNotificationProps, 'onClose'>;

export const ProAuthNotificationContent: FC<ProAuthNotificationContentProps> = ({ onClose }) => {
    const formId = useId();
    const { t } = useTranslation();
    const { data: subscription } = useProState();
    const navigate = useNavigate();
    const { onOpen: onPurchaseOpen } = useProPurchaseNotification();
    const activeWallet = useActiveWallet();
    const accountsWallets = useAccountWallets(backwardCompatibilityFilter);
    const [selectedAccountId, setSelectedAccountId] = useState(activeWallet?.rawAddress ?? '');

    const toast = useToast();

    const { mutateAsync, error, isSuccess, isLoading } = useSelectWalletForProMutation();
    useNotifyError(error);

    useEffect(() => {
        if (!isSuccess) return;

        const isSameAuth =
            hasWalletAuth(subscription) &&
            selectedAccountId === subscription?.auth?.wallet?.rawAddress;

        onClose();

        if (
            subscription &&
            isSameAuth &&
            !isTelegramSubscription(subscription) &&
            isValidSubscription(subscription)
        ) {
            navigate(AppRoute.settings + SettingsRoute.pro);
        } else {
            onPurchaseOpen();
        }
    }, [isSuccess, subscription, selectedAccountId, activeWallet]);

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
            <ProSubscriptionLightHeader
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

const NotificationStyled = styled(Notification)`
    max-width: 650px;
`;

const ContentWrapper = styled(NotificationBlock)`
    padding: 1rem 0 2rem;
`;

const Icon = styled.span`
    padding-left: 0.5rem;
    color: ${props => props.theme.accentBlue};
    display: flex;
    margin-left: auto;
    height: 16px;
    width: 24px;
`;
