import styled, { css } from "styled-components";
import React, { FC, useRef, useState } from 'react';
import { WalletEmoji } from '../../shared/emoji/WalletEmoji';
import { Body2, Body3, Label2 } from '../../Text';
import { useActiveAccount, useActiveTonNetwork } from '../../../state/wallet';
import { useTranslation } from '../../../hooks/translation';
import { formatAddress, toShortValue } from '@tonkeeper/core/dist/utils/common';
import { useAppSdk, useAppTargetEnv } from '../../../hooks/appSdk';
import { ChevronDownIcon, ChevronLeftIcon, CopyIcon, DoneIcon } from '../../Icon';
import { Transition } from 'react-transition-group';
import { AccountAndWalletBadgesGroup } from '../../account/AccountBadge';
import { AsideHeaderContainer } from './AsideHeaderElements';
import { useActiveTronWallet } from '../../../state/tron/tron';
import { DropDownContent, DropDownItem, DropDownItemsDivider } from '../../DropDown';
import { SelectDropDown } from '../../fields/Select';
import { AccountMAM, AccountTonMnemonic } from '@tonkeeper/core/dist/entries/account';
import { BLOCKCHAIN_NAME } from '@tonkeeper/core/dist/entries/crypto';
import { TON_ASSET, TRON_TRX_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { ForTargetEnv, NotForTargetEnv } from '../../shared/TargetEnv';
import { IconButtonTransparentBackground } from '../../fields/IconButton';
import { useMenuController } from '../../../hooks/ionic';

const HeaderContainer = styled(AsideHeaderContainer)`
    display: flex;
    gap: 10px;
    align-items: center;
    cursor: pointer;

    ${p =>
        p.theme.proDisplayType === 'desktop' &&
        css`
            justify-content: space-between;
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
    gap: 0.5rem;
    align-items: center;
    height: 20px;

    & > ${Body3} {
        color: ${p => p.theme.textSecondary};
        font-family: ${p => p.theme.fontMono};
    }
`;

const CopyIconWrapper = styled.div<{ opacity: number }>`
    transition: opacity 0.15s ease-in-out;
    opacity: ${p => p.opacity};
`;

const CopyIconStyled = styled(CopyIcon)`
    color: ${p => p.theme.iconTertiary};
    cursor: pointer;
`;

const DoneIconStyled = styled(DoneIcon)`
    color: ${p => p.theme.accentGreen};
`;

export const AsideHeaderWallet: FC<{ width: number }> = ({ width }) => {
    const tronWallet = useActiveTronWallet();

    if (!tronWallet) {
        return <AsideHeaderSingleChainWallet width={width} />;
    }

    return <AsideHeaderMultiChainWallet width={width} />;
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

const AsideHeaderMultiChainWallet: FC<{ width: number }> = ({ width }) => {
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

    return (
        <SelectDropDown
            top="calc(100% - 12px)"
            left="8px"
            width={width - 16 + 'px'}
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
            <HeaderContainer width={width}>
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

const AsideHeaderSingleChainWallet: FC<{ width: number }> = ({ width }) => {
    const { t } = useTranslation();
    const account = useActiveAccount();
    const activeWallet = account.activeTonWallet;
    const [copied, setIsCopied] = useState(false);
    const sdk = useAppSdk();
    const [hovered, setHovered] = useState(false);

    const network = useActiveTonNetwork();

    const address = formatAddress(activeWallet.rawAddress, network);

    const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const targetEnv = useAppTargetEnv();
    const menuController = useMenuController('aside-nav');

    const onCopy = () => {
        if (targetEnv === 'mobile') {
            return;
        }

        clearTimeout(timeoutRef.current);
        sdk.copyToClipboard(address);
        setIsCopied(true);
        timeoutRef.current = setTimeout(() => setIsCopied(false), 2000);
    };

    const transitionStyles = {
        entering: { opacity: 1 },
        entered: { opacity: 1 },
        exiting: { opacity: 0 },
        exited: { opacity: 0 },
        unmounted: { opacity: 0 }
    };

    const ref = useRef<HTMLDivElement>(null);
    const name = account.type === 'mam' ? account.activeDerivation.name : account.name;
    const emoji = account.type === 'mam' ? account.activeDerivation.emoji : account.emoji;

    return (
        <HeaderContainer
            width={width}
            onClick={onCopy}
            onMouseOver={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <ForTargetEnv env="mobile">
                <IconButtonTransparentBackground onClick={() => menuController.close()}>
                    <ChevronLeftIcon />
                </IconButtonTransparentBackground>
            </ForTargetEnv>
            <TextContainer>
                <Label2>{name || t('wallet_title')}</Label2>
                <AddressWrapper>
                    <Body3>{toShortValue(address)}</Body3>
                    <AccountAndWalletBadgesGroup
                        account={account}
                        walletId={account.activeTonWallet.id}
                        size="s"
                    />
                    <NotForTargetEnv env="mobile">
                        <Transition
                            nodeRef={ref}
                            in={hovered}
                            timeout={200}
                            onExited={() => setIsCopied(false)}
                        >
                            {state => (
                                <CopyIconWrapper
                                    ref={ref}
                                    opacity={transitionStyles[state].opacity}
                                >
                                    {copied ? <DoneIconStyled /> : <CopyIconStyled />}
                                </CopyIconWrapper>
                            )}
                        </Transition>
                    </NotForTargetEnv>
                </AddressWrapper>
            </TextContainer>
            <NotForTargetEnv env="mobile">
                <WalletEmoji emoji={emoji} emojiSize="24px" containerSize="24px" />
            </NotForTargetEnv>
        </HeaderContainer>
    );
};
