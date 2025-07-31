import { type FC, ReactNode } from 'react';
import styled from 'styled-components';

import { Label2 } from '../Text';
import { selectedTargetAuth, useProState } from '../../state/pro';
import { ProWalletListItem } from './ProWalletListItem';
import { useTranslation } from '../../hooks/translation';
import { ListBlock } from '../List';
import { useControllableAccountAndWalletByWalletId } from '../../state/wallet';
import { AuthTypes, isTelegramSubscription } from '@tonkeeper/core/dist/entries/pro';
import { useAtom } from '../../libs/useAtom';

interface IProps {
    title?: ReactNode;
    isCurrentSubscription?: ReactNode;
    onDisconnect: () => Promise<void>;
    isLoading: boolean;
}

export const ProActiveWallet: FC<IProps> = props => {
    const { onDisconnect, isLoading, title, isCurrentSubscription } = props;
    const { t } = useTranslation();
    const { data: subscription } = useProState();
    const [targetAuth] = useAtom(selectedTargetAuth);
    const { account, wallet } = useControllableAccountAndWalletByWalletId(
        (() => {
            const currentAuth = subscription?.auth;

            if (targetAuth?.type === AuthTypes.WALLET && !isCurrentSubscription) {
                return targetAuth.wallet.rawAddress;
            }

            if (!subscription) return undefined;

            if (currentAuth?.type === AuthTypes.WALLET) {
                return currentAuth.wallet.rawAddress;
            }

            return undefined;
        })()
    );

    if (subscription && isTelegramSubscription(subscription)) {
        return null;
    }

    return (
        <Block>
            {title}
            <ListBlock margin={false} fullWidth>
                <ProWalletListItem
                    disableHover
                    wallet={wallet}
                    account={account}
                    isLoading={isLoading}
                    rightElement={
                        <ButtonStyled type="button" disabled={isLoading} onClick={onDisconnect}>
                            <Label2>
                                {t(isCurrentSubscription ? 'disconnect' : 'edit_wallet')}
                            </Label2>
                        </ButtonStyled>
                    }
                />
            </ListBlock>
        </Block>
    );
};

const Block = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
`;

const ButtonStyled = styled.button`
    height: 20px;
    padding: 0 0 0 1rem;
    margin-left: auto;
    color: ${props => props.theme.textAccent};
    opacity: 1;
    transition: opacity 0.3s;

    &:hover {
        opacity: 0.7;
    }
`;
