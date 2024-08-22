import {
    DesktopViewHeader,
    DesktopViewPageLayout
} from '../../components/desktop/DesktopViewLayout';
import { Body2, Body3, Label2 } from '../../components/Text';
import { useIsScrolled } from '../../hooks/useIsScrolled';
import { useTranslation } from '../../hooks/translation';
import { MultisigInfo, useActiveWalletMultisigWallets } from '../../state/multisig';
import { SkeletonListDesktopAdaptive } from '../../components/Skeleton';
import React, { FC, useMemo } from 'react';
import { ListBlockDesktopAdaptive, ListItem, ListItemPayload } from '../../components/List';
import { WalletEmoji } from '../../components/shared/emoji/WalletEmoji';
import { formatAddress, toShortValue } from '@tonkeeper/core/dist/utils/common';
import { toFormattedTonBalance } from '../../hooks/balance';
import { PencilIcon, PinIcon } from '../../components/Icon';
import { Button } from '../../components/fields/Button';
import { useGlobalPreferences } from '../../state/global-preferences';
import { useAccountsState, useActiveAccount } from '../../state/wallet';
import { styled } from 'styled-components';
import { Dot } from '../../components/Dot';
import { IconButtonTransparentBackground } from '../../components/fields/IconButton';
import { useAppContext } from '../../hooks/appContext';
import { useAppSdk } from '../../hooks/appSdk';
import { useAddWalletNotification } from '../../components/modals/AddWalletNotificationControlled';

const DesktopViewPageLayoutStyled = styled(DesktopViewPageLayout)`
    height: 100%;
`;

export const DesktopManageMultisigsPage = () => {
    const { ref: scrollRef, closeTop } = useIsScrolled();
    const { t } = useTranslation();

    return (
        <DesktopViewPageLayoutStyled ref={scrollRef}>
            <DesktopViewHeader borderBottom={!closeTop}>
                <Label2>{t('wallet_aside_multisig_wallets')}</Label2>
            </DesktopViewHeader>
            <DesktopManageMultisigsPageBody />
        </DesktopViewPageLayoutStyled>
    );
};

const DesktopManageMultisigsPageBody = () => {
    const { data: multisigs } = useActiveWalletMultisigWallets();

    if (!multisigs) {
        return <SkeletonListDesktopAdaptive size={3} />;
    }

    if (!multisigs.length) {
        return <EmptyMultisigsPage />;
    }

    return <ManageExistingMultisigWallets multisigs={multisigs} />;
};

const TextContainer = styled.div`
    display: flex;
    flex-direction: column;

    > ${Body3} {
        color: ${p => p.theme.textSecondary};
    }
`;

const ButtonsContainer = styled.div`
    margin-left: auto;
    display: flex;
    gap: 8px;
`;

const IconButtonTransparentBackgroundStyled = styled(IconButtonTransparentBackground)`
    > svg {
        color: ${p => p.theme.iconTertiary};
    }
`;

const ManageExistingMultisigWallets: FC<{ multisigs: MultisigInfo[] }> = ({ multisigs }) => {
    const config = useGlobalPreferences();
    const { t } = useTranslation();
    const accounts = useAccountsState();
    const currentActiveAccount = useActiveAccount();

    const multisigAccounts = useMemo(() => {
        return multisigs.map(m => {
            const existingAccount = accounts.find(a => a.id === m.address);
            const name = existingAccount?.name || currentActiveAccount.name;
            const emoji = existingAccount?.emoji || currentActiveAccount.emoji;

            return {
                address: m.address,
                name,
                emoji,
                isAdded: !!existingAccount,
                isPinned: config.pinnedMultisigs.some(item => m.address === item),
                role: m.signers.includes(currentActiveAccount.activeTonWallet.rawAddress)
                    ? 'signer-and-proposer'
                    : 'proposer',
                balance: m.balance
            };
        });
    }, [accounts, multisigs, config, currentActiveAccount.name, currentActiveAccount.emoji]);

    return (
        <ListBlockDesktopAdaptive>
            {multisigAccounts.map(item => (
                <ListItem hover={false} key={item.address}>
                    <ListItemPayload>
                        <WalletEmoji containerSize="24px" emoji={item.emoji} />
                        <TextContainer>
                            <Label2>{item.name}</Label2>
                            <Body3>
                                {toShortValue(formatAddress(item.address))}
                                <Dot />
                                {toFormattedTonBalance(item.balance)}&nbsp;TON
                                <Dot />
                                {t(item.role)}
                            </Body3>
                        </TextContainer>

                        <ButtonsContainer>
                            <IconButtonTransparentBackgroundStyled
                                onClick={() => rename({ accountId: account.id, derivationIndex })}
                            >
                                <PencilIcon />
                            </IconButtonTransparentBackgroundStyled>
                            <IconButtonTransparentBackgroundStyled
                                onClick={() => rename({ accountId: account.id, derivationIndex })}
                            >
                                <PinIcon />
                            </IconButtonTransparentBackgroundStyled>
                            <Button
                                onClick={() => onOpenDerivation(derivationIndex)}
                                loading={isLoading}
                            >
                                {t('open')}
                            </Button>
                        </ButtonsContainer>
                    </ListItemPayload>
                </ListItem>
            ))}
        </ListBlockDesktopAdaptive>
    );
};

const EmptyMultisigsPageWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: calc(100% - 54px);
    width: 100%;
`;

const EmptyMultisigsPageContent = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;

    > ${Label2} {
        margin-bottom: 4px;
    }

    > ${Body2} {
        color: ${p => p.theme.textSecondary};
        margin-bottom: 24px;
    }
`;

const Buttons = styled.div`
    display: flex;
    gap: 8px;
    margin: 0 auto;
`;

const EmptyMultisigsPage = () => {
    const { t } = useTranslation();
    const { config } = useAppContext();
    const sdk = useAppSdk();
    const { onOpen: addWallet } = useAddWalletNotification();

    const multisig_about_url = config.multisig_about_url || '123';

    return (
        <EmptyMultisigsPageWrapper>
            <EmptyMultisigsPageContent>
                <Label2>{t('no_multisig_heading')}</Label2>
                <Body2>{t('no_multisig_description')}</Body2>
                <Buttons>
                    <Button primary onClick={() => addWallet({ walletType: 'multisig' })}>
                        {t('add_wallet_new_multisig_title')}
                    </Button>
                    {multisig_about_url && (
                        <Button onClick={() => sdk.openPage(multisig_about_url)}>
                            {t('no_multisig_learn_more')}
                        </Button>
                    )}
                </Buttons>
            </EmptyMultisigsPageContent>
        </EmptyMultisigsPageWrapper>
    );
};
