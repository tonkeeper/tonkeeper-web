import {
    AccountId,
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
import { getAccountMnemonic, getMAMWalletMnemonic } from '../../state/mnemonic';
import { useCheckTouchId } from '../../state/password';
import { useAccountState, useActiveAccount } from '../../state/wallet';
import { Body2Class } from '../../components/Text';
import { useTranslation } from '../../hooks/translation';
import { tonMnemonicToTronMnemonic } from '@tonkeeper/core/dist/service/walletService';
import { SpinnerRing } from '../../components/Icon';
import { useSetNotificationOnBack } from '../../components/Notification';
import { Navigate } from '../../components/shared/Navigate';
import { useSearchParams } from '../../hooks/router/useSearchParams';
import { useNavigate } from '../../hooks/router/useNavigate';
import { useParams } from '../../hooks/router/useParams';
import { DesktopViewPageLayout } from '../../components/desktop/DesktopViewLayout';
import { useIsFullWidthMode } from '../../hooks/useIsFullWidthMode';

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

const useMnemonic = (onBack: () => void, accountId: AccountId, walletId?: WalletId) => {
    const [mnemonic, setMnemonic] = useState<string[] | undefined>(undefined);
    const sdk = useAppSdk();
    const { mutateAsync: checkTouchId } = useCheckTouchId();

    useEffect(() => {
        (async () => {
            try {
                let _mnemonic;
                if (walletId !== undefined) {
                    _mnemonic = await getMAMWalletMnemonic(sdk, accountId, walletId, checkTouchId);
                } else {
                    _mnemonic = await getAccountMnemonic(sdk, accountId, checkTouchId);
                }
                setMnemonic(_mnemonic);
            } catch (e) {
                onBack();
            }
        })();
    }, [onBack, accountId, checkTouchId, walletId]);

    return mnemonic;
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

export const RecoveryContent: FC<{
    accountId: AccountId;
    walletId?: WalletId;
    isPage?: boolean;
    onClose?: () => void;
}> = ({ accountId, walletId, isPage = true, onClose }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const onBack = useCallback(() => (onClose ? onClose() : navigate('../')), [onClose, navigate]);

    const mnemonic = useMnemonic(onBack, accountId, walletId);
    const account = useAccountState(accountId);
    const [isExportingTRC20, setIsExportingTrc20] = useState(false);

    const [mnemonicToShow, setMnemonicToShow] = useState(mnemonic);
    useEffect(() => {
        setMnemonicToShow(mnemonic);
    }, [mnemonic]);

    const onHideTron = () => {
        setMnemonicToShow(mnemonic);
        setIsExportingTrc20(false);
    };

    useSetNotificationOnBack(isExportingTRC20 ? onHideTron : undefined);

    if (!mnemonicToShow) {
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
        const tronMnemonic = await tonMnemonicToTronMnemonic(mnemonic!);
        setMnemonicToShow(tronMnemonic);
        setIsExportingTrc20(true);
    };

    const wordsType =
        account?.type === 'mam' && walletId === undefined
            ? 'mam'
            : isExportingTRC20
            ? 'tron'
            : 'standard';

    return (
        <Wrapper>
            {isPage && <BackButtonBlockStyled onClick={onBack} />}
            <WordsGridAndHeaders mnemonic={mnemonicToShow} type={wordsType} allowCopy />

            {hasTronWallet && !isExportingTRC20 && (
                <TronButton onClick={onShowTron}>{t('export_trc_20_wallet')}</TronButton>
            )}
        </Wrapper>
    );
};
