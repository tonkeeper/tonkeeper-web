import { ProState } from '@tonkeeper/core/dist/entries/pro';
import { formatAddress, toShortValue } from '@tonkeeper/core/dist/utils/common';
import { FC, useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from '../../hooks/translation';
import { useAccountState } from '../../state/account';
import { useProState, useSelectWalletMutation } from '../../state/pro';
import { useWalletState } from '../../state/wallet';
import { InnerBody } from '../Body';
import { DoneIcon, DownIcon } from '../Icon';
import { ColumnText } from '../Layout';
import { ListBlock, ListItem, ListItemPayload } from '../List';
import { SubHeader } from '../SubHeader';
import { Body1, Title } from '../Text';

const Block = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
`;

const Icon = styled.img`
    width: 144px;
    height: 144px;
    margin-bottom: 16px;
`;

const Description = styled(Body1)`
    color: ${props => props.theme.textSecondary};
    margin-bottom: 16px;
`;

const DownIconWrapper = styled.span`
    color: ${props => props.theme.iconSecondary};
    display: flex;
    align-items: center;
`;

const SelectIconWrapper = styled.span`
    padding-left: 0.5rem;
    color: ${props => props.theme.accentBlue};
    display: flex;
`;

const WalletItem: FC<{ publicKey: string }> = ({ publicKey }) => {
    const { t } = useTranslation();
    const { data: wallet } = useWalletState(publicKey);

    const address = wallet
        ? toShortValue(formatAddress(wallet.active.rawAddress, wallet.network))
        : undefined;

    return (
        <ColumnText
            noWrap
            text={wallet?.name ? wallet.name : `${t('wallet_title')}`}
            secondary={address}
        />
    );
};
const SelectWallet: FC<{ data: ProState }> = ({ data }) => {
    const [isEdit, setEdit] = useState(false);
    const { data: accounts } = useAccountState();
    const { mutate } = useSelectWalletMutation();

    if (!accounts) return <></>;

    if (isEdit) {
        return (
            <ListBlock>
                {accounts.publicKeys.map(publicKey => (
                    <ListItem
                        onClick={() =>
                            data.wallet.publicKey === publicKey ? setEdit(false) : mutate(publicKey)
                        }
                    >
                        <ListItemPayload>
                            <WalletItem publicKey={publicKey} />
                            {data.wallet.publicKey === publicKey ? (
                                <SelectIconWrapper>
                                    <DoneIcon />
                                </SelectIconWrapper>
                            ) : undefined}
                        </ListItemPayload>
                    </ListItem>
                ))}
            </ListBlock>
        );
    }

    return (
        <ListBlock>
            <ListItem onClick={() => setEdit(true)}>
                <ListItemPayload>
                    <WalletItem publicKey={data.wallet.publicKey} />
                    <DownIconWrapper>
                        <DownIcon />
                    </DownIconWrapper>
                </ListItemPayload>
            </ListItem>
        </ListBlock>
    );
};

const ProContent: FC<{ data: ProState }> = ({ data }) => {
    return (
        <div>
            <SelectWallet data={data} />
        </div>
    );
};

export const ProSettings = () => {
    const { t } = useTranslation();

    const { data } = useProState();
    return (
        <>
            <SubHeader />
            <InnerBody>
                <Block>
                    <Icon src="https://tonkeeper.com/assets/icon.ico" />
                    <Title>{t('tonkeeper_pro')}</Title>
                    <Description>{t('tonkeeper_pro_description')}</Description>
                </Block>
                {data ? <ProContent data={data} /> : undefined}

                {/* <Block>
            <Input
                value={search}
                onChange={setSearch}
                label={t('settings_search_engine')}
                clearButton
            />
        </Block>
        <SettingsList items={autoItem} />
        <SettingsList items={countries} /> */}
            </InnerBody>
        </>
    );
};
