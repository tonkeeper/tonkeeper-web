import {
    AccountId,
    AccountMAM,
    AccountSecret,
    isAccountBip39,
    isAccountTronCompatible,
    isMnemonicAndPassword
} from '@tonkeeper/core/dist/entries/account';
import { WalletId } from '@tonkeeper/core/dist/entries/wallet';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import styled, { css } from 'styled-components';
import { BackButtonBlock } from '../../components/BackButton';
import { WordsGridAndHeaders } from '../../components/create/Words';
import { useAppSdk } from '../../hooks/appSdk';
import { getAccountSecret, getSecretAndPassword } from '../../state/mnemonic';
import { useAccountState, useActiveAccount } from '../../state/wallet';
import { Body2Class, H2Label2Responsive } from '../../components/Text';
import { useTranslation } from '../../hooks/translation';
import {
    tonMnemonicToTronMnemonic,
    tronWalletByTonMnemonic
} from '@tonkeeper/core/dist/service/walletService';
import { SpinnerRing } from '../../components/Icon';
import { useSetNotificationOnBack } from '../../components/Notification';
import { Navigate } from '../../components/shared/Navigate';
import { useSearchParams } from '../../hooks/router/useSearchParams';
import { useNavigate } from '../../hooks/router/useNavigate';
import { useParams } from '../../hooks/router/useParams';
import { DesktopViewPageLayout } from '../../components/desktop/DesktopViewLayout';
import { useIsFullWidthMode } from '../../hooks/useIsFullWidthMode';
import { BorderSmallResponsive } from '../../components/shared/Styles';
import { IAppSdk } from '@tonkeeper/core/dist/AppSdk';
import { accountsStorage } from '@tonkeeper/core/dist/service/accountsStorage';
import { TonKeychainRoot } from '@ton-keychain/core';

export const ActiveRecovery = () => {
    const account = useActiveAccount();
    if (isMnemonicAndPassword(account)) {
        return <RecoveryPageContent accountId={account.id} />;
    } else {
        return <Navigate to="../" replace={true} />;
    }
};

export const Recovery = () => {
    const { accountId } = useParams();
    const [searchParams] = useSearchParams();
    const walletId = useMemo(() => {
        return new URLSearchParams(searchParams).get('wallet') ?? undefined;
    }, [searchParams, location]);

    if (accountId) {
        return <RecoveryPageContent accountId={accountId} walletId={walletId} />;
    } else {
        return <ActiveRecovery />;
    }
};

/* TODO tron mnemonic fx */
export const getMAMWalletAndRootMnemonic = async (
    sdk: IAppSdk,
    accountId: AccountId,
    walletId: WalletId
) => {
    const account = await accountsStorage(sdk.storage).getAccount(accountId);
    if (account?.type !== 'mam') {
        throw new Error('Unexpected account type');
    }
    const derivation = account.getTonWalletsDerivation(walletId);
    if (!derivation) {
        throw new Error('Derivation not found');
    }

    const { secret } = await getSecretAndPassword(sdk, accountId);
    if (secret.type !== 'mnemonic') {
        throw new Error('Unexpected secret type');
    }
    const root = await TonKeychainRoot.fromMnemonic(secret.mnemonic, { allowLegacyMnemonic: true });
    const tonAccount = await root.getTonAccount(derivation.index);
    return { mnemonic: tonAccount.mnemonics, rootMnemonic: secret.mnemonic };
};
/* TODO tron mnemonic fx */

const useSecret = (onBack: () => void, accountId: AccountId, walletId?: WalletId) => {
    const [secret, setSecret] = useState<
        | AccountSecret
        | {
              type: 'mnemonic';
              mnemonic: string[];
              rootMnemonic: string[];
          }
        | undefined
    >(undefined);
    const sdk = useAppSdk();

    useEffect(() => {
        (async () => {
            try {
                let _secret;
                if (walletId !== undefined) {
                    const { rootMnemonic, mnemonic } = await getMAMWalletAndRootMnemonic(
                        sdk,
                        accountId,
                        walletId
                    );
                    _secret = {
                        type: 'mnemonic' as const,
                        mnemonic,
                        rootMnemonic
                    };
                } else {
                    _secret = await getAccountSecret(sdk, accountId);
                }
                setSecret(_secret);
            } catch (e) {
                console.error(e);
                onBack();
            }
        })();
    }, [onBack, accountId, walletId]);

    return secret;
};

const Wrapper = styled.div`
    flex-grow: 1;
    display: flex;
    justify-content: center;

    flex-direction: column;
    padding: 0 1rem;
    position: relative;
`;

const BackButtonBlockStyled = styled(BackButtonBlock)`
    top: 0;
    ${p =>
        p.theme.displayType === 'full-width' &&
        css`
            margin-top: -64px;
        `}
`;

const TronButton = styled.button`
    margin-top: 15px;
    padding: 4px 8px;
    background-color: transparent;
    border: none;
    outline: none;

    ${Body2Class};
    color: ${p => p.theme.textSecondary};
`;

const SpinnerRingStyled = styled(SpinnerRing)`
    margin: 16px auto;
`;

const RecoveryPageContent: FC<{
    accountId: AccountId;
    walletId?: WalletId;
    isPage?: boolean;
    onClose?: () => void;
}> = props => {
    const isDesktopPro = useIsFullWidthMode();
    if (isDesktopPro) {
        return (
            <DesktopViewPageLayout>
                <RecoveryContent {...props} />
            </DesktopViewPageLayout>
        );
    }

    return <RecoveryContent {...props} />;
};

const mnemonicBySecret = (secret: AccountSecret | undefined) => {
    if (secret?.type === 'mnemonic') {
        return secret.mnemonic;
    }

    return undefined;
};

const SKWrapper = styled.div`
    margin: 1rem 0;
    padding: 1rem;
    ${BorderSmallResponsive};
    ${Body2Class};
    background: ${p => p.theme.backgroundContent};
    font-family: ${p => p.theme.fontMono};
    word-break: break-all;
`;

const PageWrapper = styled.div<{ isPage$?: boolean }>`
    ${p =>
        p.isPage$ &&
        css`
            padding-top: 20px;
        `}
`;

const H2Label2ResponsiveStyled = styled(H2Label2Responsive)`
    ${p =>
        p.theme.displayType === 'compact' &&
        css`
            padding: 0 40px;
        `}
`;

export const RecoveryContent: FC<{
    accountId: AccountId;
    walletId?: WalletId;
    isPage?: boolean;
    onClose?: () => void;
}> = ({ accountId, walletId, isPage = true, onClose }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const onBack = useCallback(() => (onClose ? onClose() : navigate('../')), [onClose, navigate]);

    const secret = useSecret(onBack, accountId, walletId);
    const account = useAccountState(accountId);
    const [isExportingTRC20, setIsExportingTrc20] = useState(false);

    const [mnemonicToShow, setMnemonicToShow] = useState(mnemonicBySecret(secret));
    useEffect(() => {
        setMnemonicToShow(mnemonicBySecret(secret));
    }, [secret]);

    const onHideTron = () => {
        setMnemonicToShow(mnemonicBySecret(secret));
        setIsExportingTrc20(false);
    };

    useSetNotificationOnBack(isExportingTRC20 ? onHideTron : undefined);

    if (!mnemonicToShow && secret?.type !== 'sk') {
        return (
            <Wrapper>
                <SpinnerRingStyled />
            </Wrapper>
        );
    }

    const wordsType =
        account?.type === 'mam' && walletId === undefined
            ? 'mam'
            : isExportingTRC20
            ? 'tron'
            : 'standard';

    const hasTronWallet =
        account &&
        isAccountTronCompatible(account) &&
        !!account.activeTronWallet &&
        !isAccountBip39(account) &&
        wordsType !== 'mam';

    const onShowTron = async () => {
        /* TODO tron mnemonic fx */
        let tronMnemonic = await tonMnemonicToTronMnemonic(mnemonicBySecret(secret)!);
        if (
            account instanceof AccountMAM &&
            account.activeDerivation.index !== 0 &&
            secret &&
            'rootMnemonic' in secret
        ) {
            const rootTonWallet = await tronWalletByTonMnemonic(secret.rootMnemonic);
            if (rootTonWallet.address === account.activeTronWallet?.address) {
                tronMnemonic = await tonMnemonicToTronMnemonic(secret.rootMnemonic);
            }
            /* TODO tron mnemonic fx */
        }

        setMnemonicToShow(tronMnemonic);
        setIsExportingTrc20(true);
    };

    if (secret?.type === 'sk') {
        return (
            <PageWrapper isPage$={isPage}>
                <Wrapper>
                    <H2Label2ResponsiveStyled>
                        {t('recovery_wallet_secret_key')}
                    </H2Label2ResponsiveStyled>
                    {isPage ? <BackButtonBlockStyled onClick={onBack} /> : null}
                    <SKWrapper>{secret.sk}</SKWrapper>
                </Wrapper>
            </PageWrapper>
        );
    }

    return (
        <PageWrapper isPage$={isPage}>
            <Wrapper>
                {isPage && <BackButtonBlockStyled onClick={onBack} />}
                <WordsGridAndHeaders
                    descriptionDown={isPage || window.innerHeight < 800}
                    mnemonic={mnemonicToShow!}
                    type={wordsType}
                    allowCopy
                />

                {hasTronWallet && !isExportingTRC20 && (
                    <TronButton onClick={onShowTron}>{t('export_trc_20_wallet')}</TronButton>
                )}
            </Wrapper>
        </PageWrapper>
    );
};
