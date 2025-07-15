import { useEffect, useState } from 'react';
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
import { useSelectWalletForProMutation } from '../../state/pro';
import { ProScreenContentWrapper } from './ProScreenContentWrapper';
import { useNotifyError, useToast } from '../../hooks/useNotification';
import { useAccountWallets, useActiveWallet } from '../../state/wallet';
import { ProSettingsMainButtonWrapper } from './ProSettingsMainButtonWrapper';
import { usePurchaseControlScreen } from '../../hooks/pro/usePurchaseControlScreen';

export const ProAccountChooseScreen = () => {
    const { t } = useTranslation();
    const activeWallet = useActiveWallet();
    const accountsWallets = useAccountWallets();
    const [selectedAccountId, setSelectedAccountId] = useState(activeWallet?.rawAddress ?? '');

    const toast = useToast();
    const { goTo } = usePurchaseControlScreen();

    const { mutateAsync, error, isSuccess, isLoading } = useSelectWalletForProMutation();
    useNotifyError(error);

    useEffect(() => {
        if (isSuccess) {
            goTo(PurchaseSubscriptionScreens.PURCHASE);
        }
    }, [isSuccess]);

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
        <ProScreenContentWrapper onSubmit={handleSubmit(handleNextScreen)}>
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
            <ProSettingsMainButtonWrapper>
                <Button primary fullWidth size="large" type="submit" loading={isLoading}>
                    <Label2>{t('continue')}</Label2>
                </Button>
            </ProSettingsMainButtonWrapper>
        </ProScreenContentWrapper>
    );
};

const Icon = styled.span`
    padding-left: 0.5rem;
    color: ${props => props.theme.accentBlue};
    display: flex;
    margin-left: auto;
    height: 16px;
    width: 24px;
`;
