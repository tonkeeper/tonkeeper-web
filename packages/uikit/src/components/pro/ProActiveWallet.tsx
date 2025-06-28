import styled from 'styled-components';

import { Label2 } from '../Text';
import { ListBlock } from '../List';
import { Button } from '../fields/Button';
import { SubscriptionScreens } from '../../enums/pro';
import { ProWalletListItem } from './ProWalletListItem';
import { useTranslation } from '../../hooks/translation';
import { useActiveAccount, useActiveStandardTonWallet } from '../../state/wallet';
import { useGoToSubscriptionScreen } from '../../hooks/pro/useGoToSubscriptionScreen';

export const ProActiveWallet = () => {
    const { t } = useTranslation();
    const activeWallet = useActiveStandardTonWallet();
    const activeAccount = useActiveAccount();
    const goTo = useGoToSubscriptionScreen();

    const handleDisconnectClick = () => {
        // TODO Add logout side effect
        goTo(SubscriptionScreens.ACCOUNTS);
    };

    return (
        <ListBlock margin={false} fullWidth>
            <ProWalletListItem
                wallet={activeWallet}
                account={activeAccount}
                rightElement={
                    <ButtonStyled onClick={handleDisconnectClick}>
                        <Label2>{t('disconnect')}</Label2>
                    </ButtonStyled>
                }
            />
        </ListBlock>
    );
};

const ButtonStyled = styled(Button)`
    height: 0;
    padding: 0;
    margin-left: auto;
    background: none;
    color: ${props => props.theme.textAccent};

    :hover {
        background: none;
        color: ${props => props.theme.textAccent};
    }
`;
