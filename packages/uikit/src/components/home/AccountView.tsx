import { BLOCKCHAIN_NAME } from '@tonkeeper/core/dist/entries/crypto';
import {
    formatAddress,
    formatTransferUrl,
    seeIfValidTonAddress
} from '@tonkeeper/core/dist/utils/common';
import { FC, MouseEventHandler, PropsWithChildren, useRef, useState } from 'react';
import { QRCode } from 'react-qrcode-logo';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { BRAND_CONFIG } from '@tonkeeper/core/dist/config/brand';
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
import { Button } from '../fields/Button';
import { childFactoryCreator, duration, Wrapper } from '../transfer/common';
import { QrWrapper } from './qrCodeView';
import { Network } from '@tonkeeper/core/dist/entries/network';
import { cn } from '../../libs/css';
import { useActiveAccount, useActiveTonNetwork, useActiveWallet } from '../../state/wallet';
import { AccountBadge, NetworkBadge } from '../account/AccountBadge';
import {
    TRON_TRX_ASSET,
    TRON_USDT_ASSET
} from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { Tabs } from '../Tabs';
import { useActiveTronWallet, useCanReceiveTron } from '../../state/tron/tron';

export const Background: FC<
    PropsWithChildren<{
        extension?: boolean;
        margin?: boolean;
        onClick?: MouseEventHandler<HTMLDivElement>;
    }>
> = ({ extension, margin, onClick, children }) => (
    <div
        onClick={onClick}
        className={cn(
            'box-border w-full max-w-[300px] rounded-[20px] bg-constantWhite p-5',
            '[&_canvas]:absolute [&_canvas]:!h-full [&_canvas]:!w-full',
            margin && 'mb-4',
            extension && 'max-[768px]:max-w-[217px] max-[768px]:p-4'
        )}
    >
        {children}
    </div>
);

const AddressText: FC<PropsWithChildren<{ extension?: boolean }>> = ({ extension, children }) => (
    <span
        className={cn(
            'mx-1 mb-0 mt-4 inline-block break-all text-center font-mono text-body1 text-constantBlack',
            extension && 'max-[768px]:mt-2'
        )}
    >
        {children}
    </span>
);

export const HeaderBlock: FC<{ title?: string; description: string }> = ({
    title,
    description
}) => {
    const { extension } = useAppContext();
    return (
        <div
            className={cn(
                'flex w-full flex-col items-center pb-4',
                extension && 'max-[768px]:pb-0'
            )}
        >
            {title && <h3 className="mb-1 select-none text-center text-h3">{title}</h3>}
            <span className="text-center text-body1 text-textSecondary">{description}</span>
        </div>
    );
};

/**
 * Names the kind of wallet the QR belongs to, so a payer isn't misled into
 * sending to a testnet, hardware or watch-only address by mistake.
 */
const ReceiveWalletTypeBadge: FC = () => {
    const account = useActiveAccount();
    const network = useActiveTonNetwork();
    const className = 'mx-auto mb-[10px] w-fit';

    if (network === Network.TESTNET) {
        return <NetworkBadge network={network} className={className} />;
    }
    switch (account.type) {
        case 'watch-only':
        case 'ton-only':
        case 'ledger':
        case 'keystone':
            return <AccountBadge accountType={account.type} className={className} />;
        default:
            return null;
    }
};

const CopyButton: FC<{ address: string }> = ({ address }) => {
    const sdk = useAppSdk();
    const { t } = useTranslation();

    return (
        <div className="flex items-center">
            <Button
                secondary
                onClick={e => {
                    e.preventDefault();
                    sdk.copyToClipboard(address, t('copied'));
                }}
            >
                <CopyIcon />
                <span>{t('Copy_address')}</span>
            </Button>
        </div>
    );
};

const ReceiveTon: FC<{ jetton?: string }> = ({ jetton }) => {
    const sdk = useAppSdk();
    const { extension } = useAppContext();
    const wallet = useActiveWallet();
    const { t } = useTranslation();
    const network = useActiveTonNetwork();

    const address = formatAddress(wallet.rawAddress, network);
    return (
        <NotificationBlock>
            <HeaderBlock title={t('receive_ton')} description={t('receive_ton_description')} />
            <Background
                extension={extension}
                onClick={e => {
                    e.preventDefault();
                    sdk.copyToClipboard(address, t('copied'));
                }}
            >
                <ReceiveWalletTypeBadge />
                <QrWrapper>
                    <QRCode
                        size={400}
                        value={formatTransferUrl({
                            address,
                            jetton
                        })}
                        logoImage={BRAND_CONFIG.chainIcon}
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

const ReceiveTron: FC<{ token: string }> = ({ token }) => {
    const sdk = useAppSdk();
    const { t } = useTranslation();
    const { extension } = useAppContext();
    const tronWallet = useActiveTronWallet();

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

    if (!tronWallet) {
        return null;
    }

    return (
        <NotificationBlock>
            <HeaderBlock {...translations} />
            <Background
                extension={extension}
                onClick={e => {
                    e.preventDefault();
                    sdk.copyToClipboard(tronWallet.address, t('copied'));
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

    const isTon = active === BLOCKCHAIN_NAME.TON;
    const nodeRef = isTon ? tonRef : tronRef;

    const isTronEnabled = useCanReceiveTron();

    return (
        <FullHeightBlockResponsive standalone={standalone}>
            <NotificationHeaderPortal>
                <NotificationHeader>
                    <NotificationTitleRow handleClose={handleClose} center className="relative">
                        {!jetton && isTronEnabled && (
                            <Tabs
                                active={active}
                                setActive={setActive}
                                values={tabsValues}
                                className="!absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                            />
                        )}
                    </NotificationTitleRow>
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
                                isTronEnabled && (
                                    <ReceiveTron token={jetton || TRON_USDT_ASSET.id} />
                                )
                            )}
                        </div>
                    </CSSTransition>
                </TransitionGroup>
            </Wrapper>
        </FullHeightBlockResponsive>
    );
};
