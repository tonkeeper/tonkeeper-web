import { type FC } from 'react';
import styled from 'styled-components';

import { Label2 } from '../Text';
import { useProState } from '../../state/pro';
import { Skeleton } from '../shared/Skeleton';
import { ProWalletListItem } from './ProWalletListItem';
import { useTranslation } from '../../hooks/translation';
import { ListBlock, ListItem, ListItemPayload } from '../List';
import { useControllableAccountAndWalletByWalletId } from '../../state/wallet';
import { isTelegramSubscription, WalletAuth } from '@tonkeeper/core/dist/entries/pro';
import { useSafePurchaseControlScreen } from '../../hooks/pro/usePurchaseControlScreen';
import { PurchaseSubscriptionScreens } from '../../enums/pro';
import { useProPurchaseNotification } from '../modals/ProPurchaseNotificationControlled';

interface IProps {
    onLogout: () => Promise<void>;
    isLoading: boolean;
}

export const ProActiveWallet: FC<IProps> = ({ onLogout, isLoading }) => {
    const { t } = useTranslation();
    const { data } = useProState();
    const { onOpen } = useProPurchaseNotification();
    const purchaseContext = useSafePurchaseControlScreen();
    // TODO Fix TS casting
    const { account, wallet } = useControllableAccountAndWalletByWalletId(
        (data?.current?.auth as WalletAuth)?.wallet?.rawAddress || undefined
    );

    if (data?.current && isTelegramSubscription(data.current)) {
        return null;
    }

    const handleDisconnectClick = async () => {
        await onLogout();
        if (purchaseContext) {
            purchaseContext.goTo(PurchaseSubscriptionScreens.ACCOUNTS);
        } else {
            onOpen({ initialScreen: PurchaseSubscriptionScreens.ACCOUNTS });
        }
    };

    return (
        <ListBlock margin={false} fullWidth>
            {!isLoading && account && wallet ? (
                <ProWalletListItem
                    disableHover
                    wallet={wallet}
                    account={account}
                    rightElement={
                        <ButtonStyled
                            type="button"
                            disabled={isLoading}
                            onClick={handleDisconnectClick}
                        >
                            <Label2>{t('disconnect')}</Label2>
                        </ButtonStyled>
                    }
                />
            ) : (
                <ListItem>
                    <ListItemPayloadStyled>
                        <Skeleton width="100%" height="20px" />
                    </ListItemPayloadStyled>
                </ListItem>
            )}
        </ListBlock>
    );
};

const ListItemPayloadStyled = styled(ListItemPayload)`
    padding: 10px 10px 10px 0;
`;

const ButtonStyled = styled.button`
    height: auto;
    padding: 0 0 0 1rem;
    margin-left: auto;
    color: ${props => props.theme.textAccent};
    opacity: 1;
    transition: opacity 0.3s;

    &:hover {
        opacity: 0.7;
    }
`;
