import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getWalletMnemonic } from '@tonkeeper/core/dist/service/mnemonicService';
import React from 'react';
import styled from 'styled-components';
import { InnerBody } from '../../components/Body';
import { ListBlock, ListItem, ListItemPayload } from '../../components/List';
import { SubHeader } from '../../components/SubHeader';
import { Body2, Label1 } from '../../components/Text';
import { Switch } from '../../components/fields/Switch';
import { useWalletContext } from '../../hooks/appContext';
import { useAppSdk } from '../../hooks/appSdk';
import { useTranslation } from '../../hooks/translation';
import { QueryKey } from '../../libs/queryKey';
import { getWalletPassword } from '../../state/password';

const useSubscribed = () => {
    const sdk = useAppSdk();
    const wallet = useWalletContext();
    return useQuery<boolean, Error>([wallet.active.rawAddress, QueryKey.subscribed], () =>
        sdk.notifications!.subscribed(wallet.active.rawAddress)
    );
};

const useToggleSubscribe = () => {
    const sdk = useAppSdk();
    const wallet = useWalletContext();
    const client = useQueryClient();

    return useMutation<void, Error, boolean>(async checked => {
        const password = await getWalletPassword(sdk);
        const mnemonic = await getWalletMnemonic(sdk.storage, wallet.publicKey, password);
        if (checked) {
            await sdk.notifications?.subscribe(wallet.active.rawAddress, mnemonic);
        } else {
            await sdk.notifications?.unsubscribe(wallet.active.rawAddress, mnemonic);
        }
        await client.invalidateQueries([wallet.active.rawAddress, QueryKey.subscribed]);
    });
};

const Block = styled.div`
    display: flex;
    flex-direction: column;
`;

const Secondary = styled(Body2)`
    color: ${props => props.theme.textSecondary};
`;
const SwitchNotification = () => {
    const { t } = useTranslation();

    const { data, isFetching } = useSubscribed();
    const { mutate: toggle, isLoading } = useToggleSubscribe();

    return (
        <ListBlock>
            <ListItem hover={false}>
                <ListItemPayload>
                    <Block>
                        <Label1>{t('reminder_notifications_title')}</Label1>
                        <Secondary>{t('reminder_notifications_caption')}</Secondary>
                    </Block>
                    <Switch checked={!!data} onChange={toggle} disabled={isFetching || isLoading} />
                </ListItemPayload>
            </ListItem>
        </ListBlock>
    );
};

export const Notifications = () => {
    const { t } = useTranslation();

    return (
        <>
            <SubHeader title={t('settings_notifications')} />
            <InnerBody>
                <SwitchNotification />
            </InnerBody>
        </>
    );
};
