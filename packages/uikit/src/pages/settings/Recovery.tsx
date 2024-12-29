import { AccountId, isMnemonicAndPassword } from '@tonkeeper/core/dist/entries/account';
import { WalletId } from '@tonkeeper/core/dist/entries/wallet';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import styled, { css } from 'styled-components';
import { BackButtonBlock } from '../../components/BackButton';
import { WordsGridAndHeaders } from '../../components/create/Words';
import { useAppSdk } from '../../hooks/appSdk';
import { getAccountMnemonic, getMAMWalletMnemonic } from '../../state/mnemonic';
import { useCheckTouchId } from '../../state/password';
import { useAccountState, useActiveAccount } from '../../state/wallet';

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

export const RecoveryContent: FC<{
    accountId: AccountId;
    walletId?: WalletId;
    isPage?: boolean;
    onClose?: () => void;
}> = ({ accountId, walletId, isPage = true, onClose }) => {
    const navigate = useNavigate();
    const onBack = useCallback(() => {
        onClose ? onClose() : navigate(-1);
    }, [onClose, navigate]);

    const mnemonic = useMnemonic(onBack, accountId, walletId);
    const account = useAccountState(accountId);

    if (!mnemonic) {
        return <Wrapper />;
    }

    return (
        <Wrapper>
            {isPage && <BackButtonBlockStyled onClick={onBack} />}
            <WordsGridAndHeaders
                mnemonic={mnemonic}
                showMamInfo={account?.type === 'mam' && walletId === undefined}
                allowCopy
            />
        </Wrapper>
    );
};
