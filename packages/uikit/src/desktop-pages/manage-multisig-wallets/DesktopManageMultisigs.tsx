import {
    DesktopViewHeader,
    DesktopViewPageLayout
} from '../../components/desktop/DesktopViewLayout';
import { Body2, Body2Class, Body3, Label2 } from '../../components/Text';
import { useIsScrolled } from '../../hooks/useIsScrolled';
import { useTranslation } from '../../hooks/translation';
import {
    MultisigInfo,
    useActiveWalletMultisigWallets,
    useMultisigTogglePinForWallet,
    useMutateMultisigSelectedHostWallet
} from '../../state/multisig';
import { SkeletonListDesktopAdaptive } from '../../components/Skeleton';
import React, { FC, useMemo } from 'react';
import { ListBlockDesktopAdaptive, ListItem, ListItemPayload } from '../../components/List';
import { WalletEmoji } from '../../components/shared/emoji/WalletEmoji';
import { formatAddress, toShortValue } from '@tonkeeper/core/dist/utils/common';
import { toFormattedTonBalance } from '../../hooks/balance';
import { PencilIcon, PinIconOutline, UnpinIconOutline } from '../../components/Icon';
import { Button } from '../../components/fields/Button';
import {
    useAccountsState,
    useActiveAccount,
    useActiveConfig,
    useCreateAccountTonMultisig,
    useMutateActiveAccount
} from '../../state/wallet';
import { styled } from 'styled-components';
import { Dot } from '../../components/Dot';
import { IconButtonTransparentBackground } from '../../components/fields/IconButton';
import { useAppSdk, useAppTargetEnv } from '../../hooks/appSdk';
import { useAddWalletNotification } from '../../components/modals/AddWalletNotificationControlled';
import { useRenameNotification } from '../../components/modals/RenameNotificationControlled';
import { getFallbackAccountEmoji } from '@tonkeeper/core/dist/service/walletService';
import { Address } from '@ton/core';
import { AppRoute } from '../../libs/routes';
import {
    AccountTonMultisig,
    isAccountCanManageMultisigs
} from '@tonkeeper/core/dist/entries/account';
import { WalletId } from '@tonkeeper/core/dist/entries/wallet';
import { Navigate } from '../../components/shared/Navigate';
import { useNavigate } from '../../hooks/router/useNavigate';

const DesktopViewPageLayoutStyled = styled(DesktopViewPageLayout)`
    height: 100%;
`;

const NewMultisigButton = styled.button`
    ${Body2Class};
    border: none;
    padding: 8px;
    cursor: pointer;

    color: ${p => p.theme.textAccent};
    margin-right: -8px;
    margin-left: auto;
`;

export const DesktopManageMultisigsPage = () => {
    const { ref: scrollRef, closeTop } = useIsScrolled();
    const { t } = useTranslation();
    const activeAccount = useActiveAccount();
    const isActiveAccountMultisigManagable = isAccountCanManageMultisigs(activeAccount);
    const { onOpen: addWallet } = useAddWalletNotification();
    const env = useAppTargetEnv();

    if (!isActiveAccountMultisigManagable) {
        return <Navigate to={AppRoute.home} />;
    }

    return (
        <DesktopViewPageLayoutStyled ref={scrollRef}>
            <DesktopViewHeader borderBottom={!closeTop} backButton={env === 'mobile'}>
                <Label2>{t('wallet_aside_multisig_wallets')}</Label2>
                <NewMultisigButton onClick={() => addWallet({ walletType: 'multisig' })}>
                    {t('add_wallet_new_multisig_title')}
                </NewMultisigButton>
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
    align-items: center;
    display: flex;
    gap: 8px;
`;

const IconButtonTransparentBackgroundStyled = styled(IconButtonTransparentBackground)`
    > svg {
        color: ${p => p.theme.iconTertiary};
    }
`;

export const ManageExistingMultisigWallets: FC<{ multisigs: MultisigInfo[] }> = ({ multisigs }) => {
    const { t } = useTranslation();
    const accounts = useAccountsState();
    const currentActiveAccount = useActiveAccount();
    const { onOpen: openRename } = useRenameNotification();
    const { mutateAsync: createMultisig } = useCreateAccountTonMultisig();
    const { mutateAsync: setActiveAccount } = useMutateActiveAccount();
    const { mutateAsync: selectMultisigHost } = useMutateMultisigSelectedHostWallet();

    const selectedHostWalletId = currentActiveAccount.activeTonWallet.rawAddress;
    const { mutate: togglePinForWallet } = useMultisigTogglePinForWallet();

    const multisigAccounts = useMemo(() => {
        const allWallets = accounts.flatMap(a => a.activeTonWallet).map(w => w.rawAddress);
        return multisigs.map(m => {
            const existingAccount = accounts.find(a => a.id === m.address) as AccountTonMultisig;
            const name =
                existingAccount?.name || 'Multisig ' + toShortValue(formatAddress(m.address));
            const emoji =
                existingAccount?.emoji ||
                getFallbackAccountEmoji(Address.parse(m.address).hash.toString('hex'));

            return {
                address: m.address,
                name,
                emoji,
                isAdded: !!existingAccount,
                isPinned: existingAccount?.isPinnedForWallet(selectedHostWalletId),
                balance: m.balance,
                hostWallets: m.signers.filter(s => allWallets.includes(s))
            };
        });
    }, [
        accounts,
        multisigs,
        selectedHostWalletId,
        currentActiveAccount.name,
        currentActiveAccount.emoji
    ]);

    const onRename = async (item: {
        address: string;
        name: string;
        emoji: string;
        hostWallets: WalletId[];
    }) => {
        if (!accounts.some(a => a.id === item.address)) {
            await createMultisig({ ...item, selectedHostWalletId });
        }

        openRename({ accountId: item.address });
    };

    const onTogglePin = async (item: {
        address: string;
        name: string;
        emoji: string;
        isPinned: boolean;
        hostWallets: WalletId[];
    }) => {
        if (!accounts.some(a => a.id === item.address)) {
            await createMultisig({ ...item, selectedHostWalletId });
        }

        togglePinForWallet({ multisigId: item.address, hostWalletId: selectedHostWalletId });
    };

    const navigate = useNavigate();
    const onOpen = async (item: {
        address: string;
        name: string;
        emoji: string;
        hostWallets: WalletId[];
    }) => {
        if (!accounts.some(a => a.id === item.address)) {
            await createMultisig({ ...item, selectedHostWalletId });
        }
        await selectMultisigHost({
            multisigId: item.address,
            selectedWalletId: selectedHostWalletId
        });
        await setActiveAccount(item.address);
        navigate(AppRoute.home);
    };

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
                            </Body3>
                        </TextContainer>

                        <ButtonsContainer>
                            <IconButtonTransparentBackgroundStyled onClick={() => onRename(item)}>
                                <PencilIcon />
                            </IconButtonTransparentBackgroundStyled>
                            <IconButtonTransparentBackgroundStyled
                                onClick={() => onTogglePin(item)}
                            >
                                {item.isPinned ? <UnpinIconOutline /> : <PinIconOutline />}
                            </IconButtonTransparentBackgroundStyled>
                            <Button onClick={() => onOpen(item)}>{t('open')}</Button>
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
    const config = useActiveConfig();
    const sdk = useAppSdk();
    const { onOpen: addWallet } = useAddWalletNotification();

    const multisig_about_url = config.multisig_about_url;

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
