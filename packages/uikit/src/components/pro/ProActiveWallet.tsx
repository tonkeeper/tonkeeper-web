import { type FC } from 'react';
import styled from 'styled-components';

import { Label2 } from '../Text';
import { ListBlock } from '../List';
import { SubscriptionScreens } from '../../enums/pro';
import { ProWalletListItem } from './ProWalletListItem';
import { useTranslation } from '../../hooks/translation';
import { useActiveAccount, useActiveStandardTonWallet } from '../../state/wallet';
import { useGoToSubscriptionScreen } from '../../hooks/pro/useGoToSubscriptionScreen';

interface IProps {
    onLogout: () => Promise<void>;
    isLoading: boolean;
}

export const ProActiveWallet: FC<IProps> = ({ onLogout, isLoading }) => {
    const { t } = useTranslation();
    const activeWallet = useActiveStandardTonWallet();
    const activeAccount = useActiveAccount();
    const goTo = useGoToSubscriptionScreen();

    const handleDisconnectClick = async () => {
        await onLogout();
        goTo(SubscriptionScreens.ACCOUNTS);
    };

    return (
        <ListBlock margin={false} fullWidth>
            <ProWalletListItem
                disableHover
                wallet={activeWallet}
                account={activeAccount}
                rightElement={
                    <ButtonStyled disabled={isLoading} onClick={handleDisconnectClick}>
                        <Label2>{t('disconnect')}</Label2>
                    </ButtonStyled>
                }
            />
        </ListBlock>
    );
};

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
