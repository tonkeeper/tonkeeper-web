import styled from 'styled-components';
import { FC, useRef, useState } from 'react';
import { WalletEmoji } from '../../shared/emoji/WalletEmoji';
import { Body3, Label2 } from '../../Text';
import { useActiveAccount } from '../../../state/wallet';
import { useTranslation } from '../../../hooks/translation';
import { formatAddress, toShortValue } from '@tonkeeper/core/dist/utils/common';
import { useAppSdk } from '../../../hooks/appSdk';
import { CopyIcon, DoneIcon } from '../../Icon';
import { Transition } from 'react-transition-group';
import { AccountAndWalletBadgesGroup } from '../../account/AccountBadge';
import { AsideHeaderContainer } from './AsideHeaderElements';

const HeaderContainer = styled(AsideHeaderContainer)`
    display: flex;
    gap: 10px;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
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
    const { t } = useTranslation();
    const account = useActiveAccount();
    const activeWallet = account.activeTonWallet;
    const [copied, setIsCopied] = useState(false);
    const sdk = useAppSdk();
    const [hovered, setHovered] = useState(false);

    const address = formatAddress(activeWallet.rawAddress);

    const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    const onCopy = () => {
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

    return (
        <HeaderContainer
            width={width}
            onClick={onCopy}
            onMouseOver={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <TextContainer>
                <Label2>{account.name || t('wallet_title')}</Label2>
                <AddressWrapper>
                    <Body3>{toShortValue(address)}</Body3>
                    <AccountAndWalletBadgesGroup
                        account={account}
                        walletId={account.activeTonWallet.id}
                        size="s"
                    />
                    <Transition
                        nodeRef={ref}
                        in={hovered}
                        timeout={200}
                        onExited={() => setIsCopied(false)}
                    >
                        {state => (
                            <CopyIconWrapper ref={ref} opacity={transitionStyles[state].opacity}>
                                {copied ? <DoneIconStyled /> : <CopyIconStyled />}
                            </CopyIconWrapper>
                        )}
                    </Transition>
                </AddressWrapper>
            </TextContainer>
            <WalletEmoji emoji={account.emoji} emojiSize="24px" containerSize="24px" />
        </HeaderContainer>
    );
};
