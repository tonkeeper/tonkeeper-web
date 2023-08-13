import { BLOCKCHAIN_NAME } from '@tonkeeper/core/dist/entries/crypto';
import { TronWalletState } from '@tonkeeper/core/dist/entries/wallet';
import { formatTransferUrl } from '@tonkeeper/core/dist/utils/common';
import React, { FC, useCallback, useRef, useState } from 'react';
import { QRCode } from 'react-qrcode-logo';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import styled from 'styled-components';
import { useAppContext, useWalletContext } from '../../hooks/appContext';
import { useAppSdk } from '../../hooks/appSdk';
import { useTranslation } from '../../hooks/translation';
import { useTronWalletState } from '../../state/tron/tron';
import { CopyIcon } from '../Icon';
import {
    FullHeightBlock,
    Notification,
    NotificationBlock,
    NotificationTitleRow
} from '../Notification';
import { Tabs } from '../Tabs';
import { Body1, H3 } from '../Text';
import { Button } from '../fields/Button';
import { Wrapper, childFactoryCreator, duration } from '../transfer/common';
import { Action } from './Actions';
import { ReceiveIcon } from './HomeIcons';

const CopyBlock = styled.div`
    display: flex;
    align-items: center;
`;

const Background = styled.div`
    padding: 24px;
    width: 100%;
    box-sizing: border-box;
    border-radius: 20px;
    background: ${props => props.theme.textPrimary};
    max-width: 300px;

    @media (max-width: 768px) {
        max-width: 217px;
        padding: 16px;
    }

    canvas {
        width: 100% !important;
        height: 100% !important;
    }
`;

const AddressText = styled(Body1)`
    display: inline-block;
    word-break: break-all;
    color: black;
    margin-top: 24px;
    text-align: center;

    @media (max-width: 768px) {
        margin-top: 8px;
    }
`;

const TextBlock = styled.div`
    display: flex;
    padding-bottom: 16px;
    flex-direction: column;
    align-items: center;
    width: 100%;
`;

const Title = styled(H3)`
    text-align: center;
`;

const Description = styled(Body1)`
    text-align: center;
    color: ${props => props.theme.textSecondary};
`;

const values = [
    { name: BLOCKCHAIN_NAME.TON, id: BLOCKCHAIN_NAME.TON },
    { name: 'TRC20', id: BLOCKCHAIN_NAME.TRON }
];

const HeaderBlock: FC<{ title: string; description: string }> = ({ title, description }) => {
    return (
        <TextBlock>
            <Title>{title}</Title>
            <Description>{description}</Description>
        </TextBlock>
    );
};

const CopyButton: FC<{ address: string }> = ({ address }) => {
    const sdk = useAppSdk();
    const { t } = useTranslation();

    return (
        <CopyBlock>
            <Button
                secondary
                onClick={e => {
                    e.preventDefault();
                    sdk.copyToClipboard(address, t('address_copied'));
                }}
            >
                <CopyIcon />
                <span>{t('Copy_address')}</span>
            </Button>
        </CopyBlock>
    );
};

const ReceiveTon: FC<{ jetton?: string }> = ({ jetton }) => {
    const sdk = useAppSdk();
    const wallet = useWalletContext();
    const { t } = useTranslation();

    return (
        <NotificationBlock>
            <HeaderBlock title={t('receive_ton')} description={t('receive_ton_description')} />
            <Background
                onClick={e => {
                    e.preventDefault();
                    sdk.copyToClipboard(wallet.active.friendlyAddress, t('address_copied'));
                }}
            >
                <QRCode
                    size={400}
                    value={formatTransferUrl({
                        address: wallet.active.friendlyAddress,
                        jetton: jetton
                    })}
                    logoImage="/img/toncoin.svg"
                    logoPadding={15}
                    logoPaddingStyle="circle"
                />
                <AddressText>{wallet.active.friendlyAddress}</AddressText>
            </Background>
            <CopyButton address={wallet.active.friendlyAddress} />
        </NotificationBlock>
    );
};

const ReceiveTron: FC<{ tron: TronWalletState }> = ({ tron }) => {
    const sdk = useAppSdk();
    const { t } = useTranslation();

    return (
        <NotificationBlock>
            <HeaderBlock title={t('receive_trc20')} description={t('receive_trc20_description')} />
            <Background
                onClick={e => {
                    e.preventDefault();
                    sdk.copyToClipboard(tron.walletAddress, t('address_copied'));
                }}
            >
                <QRCode
                    size={400}
                    value={tron.walletAddress}
                    logoImage="/img/usdt.webp"
                    logoPadding={15}
                />
                <AddressText>{tron.walletAddress}</AddressText>
            </Background>
            <CopyButton address={tron.walletAddress} />
        </NotificationBlock>
    );
};

const ReceiveContent: FC<{ chain?: BLOCKCHAIN_NAME; jetton?: string; handleClose: () => void }> = ({
    chain = BLOCKCHAIN_NAME.TON,
    jetton,
    handleClose
}) => {
    const { standalone } = useAppContext();
    const [active, setActive] = useState(chain);
    const { data: tron } = useTronWalletState(active === BLOCKCHAIN_NAME.TRON);
    const tonRef = useRef<HTMLDivElement>(null);
    const tronRef = useRef<HTMLDivElement>(null);

    const isTon = active === BLOCKCHAIN_NAME.TON || !tron;
    const nodeRef = isTon ? tonRef : tronRef;
    const state = isTon ? 'ton' : 'tron';

    return (
        <FullHeightBlock standalone={standalone}>
            <NotificationTitleRow handleClose={handleClose} center>
                <Tabs active={active} setActive={setActive} values={values} />
            </NotificationTitleRow>
            <Wrapper standalone={false} extension fullWidth>
                <TransitionGroup childFactory={childFactoryCreator(!isTon)}>
                    <CSSTransition
                        key={state}
                        nodeRef={nodeRef}
                        classNames="right-to-left"
                        addEndListener={done => {
                            setTimeout(done, duration);
                        }}
                    >
                        <div ref={nodeRef}>
                            {isTon ? <ReceiveTon jetton={jetton} /> : <ReceiveTron tron={tron} />}
                        </div>
                    </CSSTransition>
                </TransitionGroup>
            </Wrapper>
        </FullHeightBlock>
    );
};

export const ReceiveNotification: FC<{
    open: boolean;
    handleClose: () => void;
    chain?: BLOCKCHAIN_NAME;
    jetton?: string;
}> = ({ open, handleClose, chain, jetton }) => {
    const Content = useCallback(() => {
        if (!open) return undefined;
        return <ReceiveContent chain={chain} jetton={jetton} handleClose={handleClose} />;
    }, [open, handleClose]);

    return (
        <Notification isOpen={open} handleClose={handleClose} backShadow hideButton>
            {Content}
        </Notification>
    );
};

export const ReceiveAction: FC<{ chain?: BLOCKCHAIN_NAME; jetton?: string }> = ({
    chain,
    jetton
}) => {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);

    return (
        <>
            <Action
                icon={<ReceiveIcon />}
                title={t('wallet_receive')}
                action={() => setOpen(true)}
            />
            <ReceiveNotification
                open={open}
                handleClose={() => setOpen(false)}
                chain={chain}
                jetton={jetton}
            />
        </>
    );
};
