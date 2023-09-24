import { toShortValue } from '@tonkeeper/core/dist/utils/common';
import React, { FC, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { createGlobalStyle, css } from 'styled-components';
import { useAppContext, useWalletContext } from '../hooks/appContext';
import { useTranslation } from '../hooks/translation';
import { AppRoute, SettingsRoute } from '../libs/routes';
import { useMutateActiveWallet } from '../state/account';
import { useWalletState } from '../state/wallet';
import { DropDown } from './DropDown';
import { DoneIcon, DownIcon, PlusIcon, SettingsIcon } from './Icon';
import { ColumnText, Divider } from './Layout';
import { ListItem, ListItemPayload } from './List';
import { H1, H3, Label1 } from './Text';
import { ScanButton } from './connect/ScanButton';
import { ImportNotification } from './create/ImportNotification';

const Block = styled.div<{
    center?: boolean;
    second?: boolean;
}>`
    flex-shrink: 0;

    user-select: none;

    position: fixed;
    width: var(--app-width);
    overflow: visible !important;
    max-width: 548px;
    top: 0px;
    z-index: 1;

    ${props =>
        css`
            padding: ${props.second ? '12px 1rem 0.75rem' : '16px 1rem 1rem'};
        `}

    display: flex;
    box-sizing: border-box;

    ${props =>
        props.center &&
        css`
            justify-content: center;
        `}

    background-color: ${props => props.theme.backgroundPage};
`;

export const HeaderGlobalStyle = createGlobalStyle`
  body:not(.top) ${Block} {
    &:after {
      content: '';
      display: block;
      width: 100%;
      height: 1px;
      background: ${props => props.theme.separatorCommon};
      position: absolute;
      top: 100%;
      left: 0;
    }
  }
`;

const Title = styled(H3)`
    display: flex;
    gap: 0.5rem;
`;

const TitleName = styled.span`
    display: inline-block;
    max-width: 320px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

const DownIconWrapper = styled.span`
    color: ${props => props.theme.iconSecondary};
    display: flex;
    align-items: center;
`;

const Icon = styled.span`
    padding-left: 0.5rem;
    color: ${props => props.theme.accentBlue};
    display: flex;
`;

const Row = styled.div`
    cursor: pointer;
    display: flex;
    padding: 1rem;
    box-sizing: border-box;
    align-items: center;
    justify-content: space-between;

    background: ${props => props.theme.backgroundContentTint};

    &:hover {
        background: ${props => props.theme.backgroundHighlighted};
    }
`;

const WalletRow: FC<{
    activePublicKey?: string;
    publicKey: string;
    index: number;
    onClose: () => void;
}> = ({ activePublicKey, publicKey, index, onClose }) => {
    const { mutate } = useMutateActiveWallet();
    const { t } = useTranslation();
    const { data: wallet } = useWalletState(publicKey);
    return (
        <ListItem
            dropDown
            onClick={() => {
                mutate(publicKey);
                onClose();
            }}
        >
            <ListItemPayload>
                <ColumnText
                    noWrap
                    text={wallet?.name ? wallet.name : `${t('wallet_title')} ${index + 1}`}
                    secondary={wallet && toShortValue(wallet.active.friendlyAddress)}
                />
                {activePublicKey === publicKey ? (
                    <Icon>
                        <DoneIcon />
                    </Icon>
                ) : undefined}
            </ListItemPayload>
        </ListItem>
    );
};

const DropDownPayload: FC<{ onClose: () => void; onCreate: () => void }> = ({
    onClose,
    onCreate
}) => {
    const navigate = useNavigate();
    const { account } = useAppContext();
    const { t } = useTranslation();

    if (account.publicKeys.length === 1) {
        return (
            <Row
                onClick={() => {
                    onClose();
                    onCreate();
                }}
            >
                <Label1>{t('balances_setup_wallet')}</Label1>
                <Icon>
                    <PlusIcon />
                </Icon>
            </Row>
        );
    } else {
        return (
            <>
                {account.publicKeys.map((publicKey, index) => (
                    <WalletRow
                        key={publicKey}
                        publicKey={publicKey}
                        activePublicKey={account.activePublicKey}
                        index={index}
                        onClose={onClose}
                    />
                ))}
                <Divider />
                <Row
                    onClick={() => {
                        onClose();
                        navigate(AppRoute.settings + SettingsRoute.account);
                    }}
                >
                    <Label1>{t('Manage')}</Label1>
                    <Icon>
                        <SettingsIcon />
                    </Icon>
                </Row>
            </>
        );
    }
};

export const Header: FC<{ showQrScan?: boolean }> = ({ showQrScan = true }) => {
    const { t } = useTranslation();
    const wallet = useWalletContext();
    const [isOpen, setOpen] = useState(false);
    return (
        <Block center>
            <DropDown
                center
                payload={onClose => (
                    <DropDownPayload onClose={onClose} onCreate={() => setOpen(true)} />
                )}
            >
                <Title>
                    <TitleName> {wallet.name ? wallet.name : t('wallet_title')}</TitleName>

                    <DownIconWrapper>
                        <DownIcon />
                    </DownIconWrapper>
                </Title>
            </DropDown>

            {showQrScan && <ScanButton />}

            <ImportNotification isOpen={isOpen} setOpen={setOpen} />
        </Block>
    );
};

export const ActivityHeader = () => {
    const { t } = useTranslation();

    return (
        <Block second>
            <H1>{t('activity_screen_title')}</H1>
        </Block>
    );
};

export const SettingsHeader = () => {
    const { t } = useTranslation();

    return (
        <Block second>
            <H1>{t('settings_title')}</H1>
        </Block>
    );
};
