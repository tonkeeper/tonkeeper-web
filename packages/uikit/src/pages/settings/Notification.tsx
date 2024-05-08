import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import { getMnemonic } from '../../state/mnemonic';
import { useCheckTouchId } from '../../state/password';

const useSubscribed = () => {
    const sdk = useAppSdk();
    const wallet = useWalletContext();

    return useQuery<boolean, Error>(
        [wallet.active.rawAddress, wallet.network, QueryKey.subscribed],
        async () => {
            const { notifications } = sdk;
            if (!notifications) {
                throw new Error('Missing notifications');
            }
            return notifications.subscribed(wallet.active.rawAddress);
        }
    );
};

const useToggleSubscribe = () => {
    const sdk = useAppSdk();
    const wallet = useWalletContext();
    const client = useQueryClient();
    const { mutateAsync: checkTouchId } = useCheckTouchId();

    return useMutation<void, Error, boolean>(async checked => {
        const { notifications } = sdk;
        if (!notifications) {
            throw new Error('Missing notifications');
        }
        if (checked) {
            const mnemonic = await getMnemonic(sdk, wallet.publicKey, checkTouchId);
            try {
                await notifications.subscribe(wallet, mnemonic);
            } catch (e) {
                if (e instanceof Error) sdk.topMessage(e.message);
                throw e;
            }
        } else {
            try {
                await notifications.unsubscribe(wallet.active.rawAddress);
            } catch (e) {
                if (e instanceof Error) sdk.topMessage(e.message);
                throw e;
            }
        }

        await client.invalidateQueries([
            wallet.active.rawAddress,
            wallet.network,
            QueryKey.subscribed
        ]);
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
