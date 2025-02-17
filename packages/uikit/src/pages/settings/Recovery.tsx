import {
    AccountId,
    AccountSecret,
    isAccountBip39,
    isAccountTronCompatible,
    isMnemonicAndPassword
} from '@tonkeeper/core/dist/entries/account';
import { WalletId } from '@tonkeeper/core/dist/entries/wallet';
import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import styled, { css } from 'styled-components';
import { BackButtonBlock } from '../../components/BackButton';
import { WordsGridAndHeaders } from '../../components/create/Words';
import { useAppSdk } from '../../hooks/appSdk';
import { getAccountSecret, getMAMWalletMnemonic } from '../../state/mnemonic';
import { useCheckTouchId } from '../../state/password';
import { useAccountState, useActiveAccount } from '../../state/wallet';
import { Body2Class, H2Label2Responsive } from '../../components/Text';
import { useTranslation } from '../../hooks/translation';
import { tonMnemonicToTronMnemonic } from '@tonkeeper/core/dist/service/walletService';
import { SpinnerRing } from '../../components/Icon';
import { useSetNotificationOnBack } from '../../components/Notification';
import { BorderSmallResponsive } from '../../components/shared/Styles';

export const ActiveRecovery = () => {
    const account = useActiveAccount();
    if (isMnemonicAndPassword(account)) {
        return <RecoveryContent accountId={account.id} />;
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
        return <RecoveryContent accountId={accountId} walletId={walletId} />;
    } else {
        return <ActiveRecovery />;
    }
};

const useSecret = (onBack: () => void, accountId: AccountId, walletId?: WalletId) => {
    const [secret, setSecret] = useState<AccountSecret | undefined>(undefined);
    const sdk = useAppSdk();
    const { mutateAsync: checkTouchId } = useCheckTouchId();

    useEffect(() => {
        (async () => {
            try {
                let _secret;
                if (walletId !== undefined) {
                    _secret = {
                        type: 'mnemonic' as const,
                        mnemonic: await getMAMWalletMnemonic(sdk, accountId, walletId, checkTouchId)
                    };
                } else {
                    _secret = await getAccountSecret(sdk, accountId, checkTouchId);
                }
                setSecret(_secret);
            } catch (e) {
                console.error(e);
                onBack();
            }
        })();
    }, [onBack, accountId, checkTouchId, walletId]);

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

export const RecoveryContent: FC<{
    accountId: AccountId;
    walletId?: WalletId;
    isPage?: boolean;
    onClose?: () => void;
}> = ({ accountId, walletId, isPage = true, onClose }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const onBack = useCallback(() => (onClose ? onClose() : navigate(-1)), [onClose, navigate]);

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

    const hasTronWallet =
        account &&
        isAccountTronCompatible(account) &&
        !!account.activeTronWallet &&
        !isAccountBip39(account);

    const onShowTron = async () => {
        const tronMnemonic = await tonMnemonicToTronMnemonic(mnemonicBySecret(secret)!);
        setMnemonicToShow(tronMnemonic);
        setIsExportingTrc20(true);
    };

    const wordsType =
        account?.type === 'mam' && walletId === undefined
            ? 'mam'
            : isExportingTRC20
            ? 'tron'
            : 'standard';

    if (secret?.type === 'sk') {
        return (
            <Wrapper>
                <H2Label2Responsive>{t('recovery_wallet_secret_key')}</H2Label2Responsive>
                {isPage ? <BackButtonBlockStyled onClick={onBack} /> : null}
                <SKWrapper>{secret.sk}</SKWrapper>
            </Wrapper>
        );
    }

    return (
        <Wrapper>
            {isPage && <BackButtonBlockStyled onClick={onBack} />}
            <WordsGridAndHeaders mnemonic={mnemonicToShow!} type={wordsType} allowCopy />

            {hasTronWallet && !isExportingTRC20 && (
                <TronButton onClick={onShowTron}>{t('export_trc_20_wallet')}</TronButton>
            )}
        </Wrapper>
    );
};
