import { BLOCKCHAIN_NAME } from '@tonkeeper/core/dist/entries/crypto';
import {
    formatAddress,
    formatTransferUrl,
    seeIfValidTonAddress
} from '@tonkeeper/core/dist/utils/common';
import { FC, useRef, useState } from 'react';
import { QRCode } from 'react-qrcode-logo';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import styled, { css } from 'styled-components';
import { useAppContext } from '../../hooks/appContext';
import { useAppSdk } from '../../hooks/appSdk';
import { useTranslation } from '../../hooks/translation';
import { CopyIcon } from '../Icon';
import {
    FullHeightBlockResponsive,
    NotificationBlock,
    NotificationHeader,
    NotificationHeaderPortal,
    NotificationTitleRow
} from '../Notification';
import { Body1, H3 } from '../Text';
import { Button } from '../fields/Button';
import { childFactoryCreator, duration, Wrapper } from '../transfer/common';
import { QrWrapper } from './qrCodeView';
import {
    useActiveTonNetwork,
    useActiveWallet,
    useIsActiveWalletWatchOnly
} from '../../state/wallet';
import { AccountBadge } from '../account/AccountBadge';
import { useTonAssetImage } from '../../state/asset';
import {
    TON_ASSET,
    TRON_TRX_ASSET,
    TRON_USDT_ASSET
} from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { Address } from '@ton/core';
import { Tabs } from '../Tabs';
import { TronWallet } from '@tonkeeper/core/dist/entries/tron/tron-wallet';
import { useActiveTronWallet } from '../../state/tron/tron';

const CopyBlock = styled.div`
    display: flex;
    align-items: center;
`;

export const Background = styled.div<{ extension?: boolean; margin?: boolean }>`
    padding: 20px;
    width: 100%;
    box-sizing: border-box;
    border-radius: 20px;
    background: white;
    max-width: 300px;

    ${props =>
        props.margin &&
        css`
            margin-bottom: 16px;
        `}

    ${props =>
        props.extension &&
        css`
            @media (max-width: 768px) {
                max-width: 217px;
                padding: 16px;
            }
        `}

    canvas {
        width: 100% !important;
        height: 100% !important;
        position: absolute;
    }
`;

export const AddressText = styled(Body1)<{ extension?: boolean }>`
    display: inline-block;
    word-break: break-all;
    color: black;
    margin: 16px 4px 0;
    text-align: center;
    font-family: ${p => p.theme.fontMono};

    ${props =>
        props.extension &&
        css`
            @media (max-width: 768px) {
                margin-top: 8px;
            }
        `}
`;

const TextBlock = styled.div<{ extension?: boolean }>`
    display: flex;
    padding-bottom: 16px;
    flex-direction: column;
    align-items: center;
    width: 100%;

    ${props =>
        props.extension &&
        css`
            @media (max-width: 768px) {
                padding-bottom: 0;
            }
        `}
`;

const Title = styled(H3)`
    text-align: center;
`;

const Description = styled(Body1)`
    text-align: center;
    color: ${props => props.theme.textSecondary};
`;

const WatchOnlyBadge = styled(AccountBadge)`
    width: fit-content;
    margin: 0 auto 10px;
`;

/*const values = [
    { name: BLOCKCHAIN_NAME.TON, id: BLOCKCHAIN_NAME.TON },
    { name: 'TRC20', id: BLOCKCHAIN_NAME.TRON }
];*/

export const HeaderBlock: FC<{ title?: string; description: string }> = ({
    title,
    description
}) => {
    const { extension } = useAppContext();
    return (
        <TextBlock extension={extension}>
            {title && <Title>{title}</Title>}
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
    const { extension } = useAppContext();
    const wallet = useActiveWallet();
    const isWatchOnly = useIsActiveWalletWatchOnly();
    const { t } = useTranslation();
    const network = useActiveTonNetwork();

    const assetImage = useTonAssetImage({
        blockchain: BLOCKCHAIN_NAME.TON,
        address: jetton ? Address.parse(jetton) : TON_ASSET.address
    });

    const address = formatAddress(wallet.rawAddress, network);
    return (
        <NotificationBlock>
            <HeaderBlock title={t('receive_ton')} description={t('receive_ton_description')} />
            <Background
                extension={extension}
                onClick={e => {
                    e.preventDefault();
                    sdk.copyToClipboard(address, t('address_copied'));
                }}
            >
                {isWatchOnly && <WatchOnlyBadge accountType="watch-only" />}
                <QrWrapper>
                    <QRCode
                        size={400}
                        value={formatTransferUrl({
                            address,
                            jetton
                        })}
                        logoImage={assetImage || 'https://wallet.tonkeeper.com/img/toncoin.svg'}
                        logoPadding={8}
                        qrStyle="dots"
                        eyeRadius={{
                            inner: 2,
                            outer: 16
                        }}
                    />
                </QrWrapper>
                <AddressText extension={extension}>{address}</AddressText>
            </Background>
            <CopyButton address={address} />
        </NotificationBlock>
    );
};

const ReceiveTron: FC<{ token: string; tronWallet: TronWallet }> = ({ tronWallet, token }) => {
    const sdk = useAppSdk();
    const { t } = useTranslation();
    const { extension } = useAppContext();

    const asset = token === TRON_USDT_ASSET.id ? TRON_USDT_ASSET : TRON_TRX_ASSET;

    let translations;
    if (token === TRON_USDT_ASSET.id) {
        translations = {
            title: t('receive_trc20'),
            description: t('receive_trc20_description')
        };
    } else {
        translations = {
            title: t('receive_trx'),
            description: t('receive_trx_description')
        };
    }

    return (
        <NotificationBlock>
            <HeaderBlock {...translations} />
            <Background
                extension={extension}
                onClick={e => {
                    e.preventDefault();
                    sdk.copyToClipboard(tronWallet.address, t('address_copied'));
                }}
            >
                <QrWrapper>
                    <QRCode
                        size={400}
                        value={tronWallet.address}
                        logoImage={asset.image}
                        logoPadding={8}
                        qrStyle="dots"
                        eyeRadius={{
                            inner: 2,
                            outer: 16
                        }}
                    />
                </QrWrapper>
                <AddressText extension={extension}>{tronWallet.address}</AddressText>
            </Background>
            <CopyButton address={tronWallet.address} />
        </NotificationBlock>
    );
};

const TabsStyled = styled(Tabs)`
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translateX(-50%) translateY(-50%);
`;

const NotificationTitleRowStyled = styled(NotificationTitleRow)`
    position: relative;
`;

const tabsValues = [
    { id: BLOCKCHAIN_NAME.TON, name: 'Ton' },
    { id: BLOCKCHAIN_NAME.TRON, name: 'Tron' }
];

export const ReceiveContent: FC<{
    chain?: BLOCKCHAIN_NAME;
    jetton?: string;
    handleClose?: () => void;
}> = ({ chain = BLOCKCHAIN_NAME.TON, jetton, handleClose }) => {
    const { standalone } = useAppContext();
    const [active, setActive] = useState(chain);
    const tonRef = useRef<HTMLDivElement>(null);
    const tronRef = useRef<HTMLDivElement>(null);

    const isTon = active === BLOCKCHAIN_NAME.TON; /*|| !tron*/
    const nodeRef = isTon ? tonRef : tronRef;

    const tronWallet = useActiveTronWallet();

    return (
        <FullHeightBlockResponsive standalone={standalone}>
            <NotificationHeaderPortal>
                <NotificationHeader>
                    <NotificationTitleRowStyled handleClose={handleClose} center>
                        {!jetton && tronWallet && (
                            <TabsStyled active={active} setActive={setActive} values={tabsValues} />
                        )}
                    </NotificationTitleRowStyled>
                </NotificationHeader>
            </NotificationHeaderPortal>
            <Wrapper standalone={false} extension fullWidth>
                <TransitionGroup childFactory={childFactoryCreator(!isTon)}>
                    <CSSTransition
                        key={isTon ? 'ton' : 'tron'}
                        nodeRef={nodeRef}
                        classNames="right-to-left"
                        addEndListener={done => {
                            setTimeout(done, duration);
                        }}
                    >
                        <div ref={nodeRef}>
                            {isTon ? (
                                <ReceiveTon
                                    jetton={
                                        jetton && seeIfValidTonAddress(jetton) ? jetton : undefined
                                    }
                                />
                            ) : (
                                !!tronWallet && (
                                    <ReceiveTron
                                        token={jetton || TRON_USDT_ASSET.id}
                                        tronWallet={tronWallet}
                                    />
                                )
                            )}
                        </div>
                    </CSSTransition>
                </TransitionGroup>
            </Wrapper>
        </FullHeightBlockResponsive>
    );
};
