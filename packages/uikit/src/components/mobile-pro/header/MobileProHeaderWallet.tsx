import styled, { css } from 'styled-components';
import React, { useRef, useState } from 'react';
import { WalletEmoji } from '../../shared/emoji/WalletEmoji';
import { Body2, Body3, Body3Class, Label2 } from '../../Text';
import { useActiveAccount, useActiveTonNetwork } from '../../../state/wallet';
import { useTranslation } from '../../../hooks/translation';
import { formatAddress, toShortValue } from '@tonkeeper/core/dist/utils/common';
import { useAppSdk } from '../../../hooks/appSdk';
import { ChevronDownIcon, ChevronRightIcon, CopyIcon, DoneIcon, EllipsisIcon } from '../../Icon';
import { AccountAndWalletBadgesGroup } from '../../account/AccountBadge';
import { MobileProHeaderContainer } from './MobileProHeaderElements';
import { useActiveTronWallet } from '../../../state/tron/tron';
import { DropDownContent, DropDownItem, DropDownItemsDivider } from '../../DropDown';
import { SelectDropDown } from '../../fields/Select';
import { AccountMAM, AccountTonMnemonic } from '@tonkeeper/core/dist/entries/account';
import { BLOCKCHAIN_NAME } from '@tonkeeper/core/dist/entries/crypto';
import { TON_ASSET, TRON_TRX_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { IconButtonTransparentBackground } from '../../fields/IconButton';
import { Dot } from '../../Dot';
import { useUserFiat } from '../../../state/fiat';
import { useWalletTotalBalance } from '../../../state/asset';
import { Skeleton } from '../../shared/Skeleton';
import { formatFiatCurrency } from '../../../hooks/balance';
import { useMenuController } from '../../../hooks/ionic';
import { MobileProWalletMenu, useIsProWalletMenuOpened } from '../MobileProWalletMenu';
import { useLocation } from 'react-router-dom';
import { AppRoute } from '../../../libs/routes';

const HeaderContainer = styled(MobileProHeaderContainer)<{ $transparent?: boolean }>`
    display: flex;
    gap: 10px;
    align-items: center;
    justify-content: center;
    position: relative;

    ${p =>
        p.$transparent &&
        css`
            background: transparent;
        `}
`;

const TextContainer = styled.div`
    overflow: hidden;

    & > ${Label2} {
        display: block;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
`;

const AddressWrapper = styled.div`
    display: flex;
    align-items: center;
    height: 16px;
    color: ${p => p.theme.textSecondary};
    font-family: ${p => p.theme.fontMono};

    ${Body3Class};
`;

const CopyIconStyled = styled(CopyIcon)`
    color: ${p => p.theme.iconTertiary};
    cursor: pointer;
`;

const DoneIconStyled = styled(DoneIcon)`
    color: ${p => p.theme.accentGreen};
`;

export const MobileProHeaderWallet = () => {
    const tronWallet = useActiveTronWallet();

    if (!tronWallet) {
        return <AsideHeaderSingleChainWallet />;
    }

    return <AsideHeaderMultiChainWallet />;
};

const BlockchainImage = styled.img`
    border-radius: ${p => p.theme.cornerFull};
    width: 24px;
    height: 24px;
`;

const DropDownItemStyled = styled(DropDownItem)`
    padding: 8px 12px;
    gap: 12px;

    font-family: ${p => p.theme.fontMono};

    > *:last-child {
        margin-left: auto;
    }
`;

const MultichainLine = styled.div`
    display: flex;
    align-items: center;
    gap: 4px;
    height: 20px;
    color: ${props => props.theme.textSecondary};

    > svg {
        color: ${props => props.theme.iconTertiary};
    }
`;

const AsideHeaderMultiChainWallet = () => {
    const { t } = useTranslation();
    const account = useActiveAccount() as AccountMAM | AccountTonMnemonic;
    const activeWallet = account.activeTonWallet;

    const [tonCopied, setIsTonCopied] = useState(false);
    const [tronCopied, setIsTronCopied] = useState(false);

    const sdk = useAppSdk();

    const tonAddress = formatAddress(activeWallet.rawAddress, useActiveTonNetwork());
    const tronAddress = account.activeTronWallet!.address;

    const timeoutRef = useRef<
        Record<keyof typeof BLOCKCHAIN_NAME, ReturnType<typeof setTimeout> | undefined>
    >({
        [BLOCKCHAIN_NAME.TON]: undefined,
        [BLOCKCHAIN_NAME.TRON]: undefined
    });

    const onCopy = (chain: BLOCKCHAIN_NAME) => {
        const setIsCopied = chain === BLOCKCHAIN_NAME.TON ? setIsTonCopied : setIsTronCopied;
        clearTimeout(timeoutRef.current[chain]);
        sdk.copyToClipboard(chain === BLOCKCHAIN_NAME.TON ? tonAddress : tronAddress);
        setIsCopied(true);
        timeoutRef.current[chain] = setTimeout(() => setIsCopied(false), 2000);
    };

    const name = account.type === 'mam' ? account.activeDerivation.name : account.name;
    const emoji = account.type === 'mam' ? account.activeDerivation.emoji : account.emoji;

    const location = useLocation();

    return (
        <SelectDropDown
            top="calc(100% - 12px)"
            left="8px"
            width="calc(100% - 16px)"
            payload={() => (
                <DropDownContent>
                    <DropDownItemStyled
                        isSelected={false}
                        onClick={() => {
                            onCopy(BLOCKCHAIN_NAME.TON);
                        }}
                    >
                        <BlockchainImage src={TON_ASSET.image} />
                        <Body2>{toShortValue(tonAddress)}</Body2>
                        {tonCopied ? <DoneIconStyled /> : <CopyIconStyled />}
                    </DropDownItemStyled>
                    <DropDownItemsDivider />
                    <DropDownItemStyled
                        isSelected={false}
                        onClick={() => {
                            onCopy(BLOCKCHAIN_NAME.TRON);
                        }}
                    >
                        <BlockchainImage src={TRON_TRX_ASSET.image} />
                        <Body2>{toShortValue(tronAddress)}</Body2>
                        {tronCopied ? <DoneIconStyled /> : <CopyIconStyled />}
                    </DropDownItemStyled>
                    <DropDownItemsDivider />
                </DropDownContent>
            )}
        >
            <HeaderContainer $transparent={location.pathname === AppRoute.home}>
                <TextContainer>
                    <Label2>{name || t('wallet_title')}</Label2>
                    <MultichainLine>
                        <Body3>{t('multichain')}</Body3>
                        <AccountAndWalletBadgesGroup
                            account={account}
                            walletId={account.activeTonWallet.id}
                            size="s"
                        />
                        <ChevronDownIcon />
                    </MultichainLine>
                </TextContainer>
                <WalletEmoji emoji={emoji} emojiSize="24px" containerSize="24px" />
            </HeaderContainer>
        </SelectDropDown>
    );
};

const WalletNameWrapper = styled(Label2)`
    display: flex !important;
    align-items: center;
    justify-content: center;
    gap: 6px;
`;

const WalletEmojiStyled = styled(WalletEmoji)`
    top: calc(14px + env(safe-area-inset-top));
    left: 10px;
    position: absolute;
`;

const IconButtonStyled = styled(IconButtonTransparentBackground)`
    top: calc(8px + env(safe-area-inset-top));
    right: 0;
    position: absolute;
`;

const AsideHeaderSingleChainWallet = () => {
    const fiat = useUserFiat();
    const { data: balance, isLoading } = useWalletTotalBalance();
    const { t } = useTranslation();
    const account = useActiveAccount();
    const activeWallet = account.activeTonWallet;
    const [copied, setIsCopied] = useState(false);
    const sdk = useAppSdk();
    const manuController = useMenuController('wallet-nav');

    const network = useActiveTonNetwork();

    const address = formatAddress(activeWallet.rawAddress, network);

    const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    const onCopy = () => {
        clearTimeout(timeoutRef.current);
        sdk.copyToClipboard(address);
        setIsCopied(true);
        timeoutRef.current = setTimeout(() => setIsCopied(false), 2000);
    };

    const name = account.type === 'mam' ? account.activeDerivation.name : account.name;
    const emoji = account.type === 'mam' ? account.activeDerivation.emoji : account.emoji;

    const menuController = useMenuController('aside-nav');
    const [isMenuOpened] = useIsProWalletMenuOpened();

    const location = useLocation();

    return (
        <>
            <MobileProWalletMenu />
            <HeaderContainer $transparent={location.pathname === AppRoute.home}>
                <WalletEmojiStyled
                    emoji={emoji}
                    emojiSize="24px"
                    containerSize="24px"
                    onClick={() => menuController.open()}
                />
                <TextContainer onClick={onCopy}>
                    <WalletNameWrapper>
                        {name || t('wallet_title')}
                        <AccountAndWalletBadgesGroup
                            account={account}
                            walletId={account.activeTonWallet.id}
                            size="s"
                        />
                    </WalletNameWrapper>
                    <AddressWrapper>
                        {copied ? t('copied') : toShortValue(address)}
                        <Dot />
                        {isLoading ? (
                            <Skeleton width="50px" height="16px" />
                        ) : (
                            formatFiatCurrency(fiat, balance || 0)
                        )}
                    </AddressWrapper>
                </TextContainer>
                <IconButtonStyled
                    onClick={() => (isMenuOpened ? manuController.close() : manuController.open())}
                >
                    {isMenuOpened ? <ChevronRightIcon /> : <EllipsisIcon />}
                </IconButtonStyled>
            </HeaderContainer>
        </>
    );
};
