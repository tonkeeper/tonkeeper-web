import styled from 'styled-components';
import { FC } from 'react';
import { WalletEmoji } from '../../shared/emoji/WalletEmoji';
import { Body3, Label2 } from '../../Text';
import { useAppContext } from '../../../hooks/appContext';
import { useWalletState } from '../../../state/wallet';
import { useTranslation } from '../../../hooks/translation';
import { toShortValue } from '@tonkeeper/core/dist/utils/common';

const HeaderContainer = styled.div<{ width: number }>`
    box-sizing: border-box;
    width: ${p => p.width}px;
    padding: 1rem;
    display: flex;
    gap: 10px;
    align-items: center;
    border-bottom: 1px solid ${p => p.theme.backgroundContentAttention};
    background: ${p => p.theme.backgroundContent};
    min-height: 68px;
    justify-content: space-between;
`;

const TextContainer = styled.div`
    overflow: hidden;

    > * {
        display: block;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    & > ${Body3} {
        color: ${p => p.theme.textSecondary};
        font-family: ${p => p.theme.fontMono};
    }
`;

export const AsideHeader: FC<{ width: number }> = ({ width }) => {
    const { t } = useTranslation();
    const { account } = useAppContext();
    const { data: wallet } = useWalletState(account.activePublicKey!);

    return (
        <HeaderContainer width={width}>
            {wallet && (
                <>
                    <TextContainer>
                        <Label2>{wallet.name || t('wallet_title')}</Label2>
                        <Body3>{toShortValue(wallet.active.friendlyAddress)}</Body3>
                    </TextContainer>
                    <WalletEmoji emoji={wallet.emoji} emojiSize="24px" containerSize="24px" />
                </>
            )}
        </HeaderContainer>
    );
};
