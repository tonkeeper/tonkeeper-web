import { type FC, ReactNode } from 'react';
import styled from 'styled-components';

import { Label2 } from '../Text';
import { useProState } from '../../state/pro';
import { Skeleton } from '../shared/Skeleton';
import { ProWalletListItem } from './ProWalletListItem';
import { useTranslation } from '../../hooks/translation';
import { ListBlock, ListItem, ListItemPayload } from '../List';
import { useControllableAccountAndWalletByWalletId } from '../../state/wallet';
import { AuthTypes, isTelegramSubscription } from '@tonkeeper/core/dist/entries/pro';

interface IProps {
    title?: ReactNode;
    onDisconnect: () => Promise<void>;
    isLoading: boolean;
}

export const ProActiveWallet: FC<IProps> = props => {
    const { onDisconnect, isLoading, title } = props;
    const { t } = useTranslation();
    const { data } = useProState();
    const { account, wallet } = useControllableAccountAndWalletByWalletId(
        (() => {
            const targetAuth = data?.target?.auth;
            const currentAuth = data?.current?.auth;

            if (targetAuth?.type === AuthTypes.WALLET) {
                return targetAuth.wallet.rawAddress;
            }

            if (!data?.current) return undefined;

            if (currentAuth?.type === AuthTypes.WALLET && !isTelegramSubscription(data?.current)) {
                return currentAuth.wallet.rawAddress;
            }

            return undefined;
        })()
    );

    if (data?.current && isTelegramSubscription(data.current)) {
        return null;
    }

    return (
        <Block>
            {title}
            <ListBlock margin={false} fullWidth>
                {!isLoading && account && wallet ? (
                    <ProWalletListItem
                        disableHover
                        wallet={wallet}
                        account={account}
                        rightElement={
                            <ButtonStyled type="button" disabled={isLoading} onClick={onDisconnect}>
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
        </Block>
    );
};

const Block = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
`;

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
