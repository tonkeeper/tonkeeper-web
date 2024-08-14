import React, { FC, useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import styled, { css } from 'styled-components';
import { BackButtonBlock } from '../../components/BackButton';
import { Body1, Body2, Body3, H2, Label2Class } from '../../components/Text';
import { WorldNumber, WorldsGrid } from '../../components/create/Words';
import { useAppSdk } from '../../hooks/appSdk';
import { useTranslation } from '../../hooks/translation';
import { getAccountMnemonic, getMAMWalletMnemonic } from '../../state/mnemonic';
import { useCheckTouchId } from '../../state/password';
import { useAccountState, useActiveAccount } from '../../state/wallet';
import { AccountId } from '@tonkeeper/core/dist/entries/account';
import { BorderSmallResponsive } from '../../components/shared/Styles';
import { WalletId } from '@tonkeeper/core/dist/entries/wallet';
import { ExclamationMarkCircleIcon } from '../../components/Icon';
import { useAppContext } from '../../hooks/appContext';

export const ActiveRecovery = () => {
    const account = useActiveAccount();
    if (account.type === 'mnemonic') {
        return <RecoveryContent accountId={account.id} />;
    } else {
        return <Navigate to="../" replace={true} />;
    }
};

export const Recovery = () => {
    const { accountId } = useParams();
    if (accountId) {
        return <RecoveryContent accountId={accountId} />;
    } else {
        return <ActiveRecovery />;
    }
};

const useMnemonic = (accountId: AccountId, walletId?: WalletId) => {
    const [mnemonic, setMnemonic] = useState<string[] | undefined>(undefined);
    const sdk = useAppSdk();
    const navigate = useNavigate();
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
                navigate(-1);
            }
        })();
    }, [accountId, checkTouchId, walletId]);

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

const Block = styled.div`
    display: flex;
    text-align: center;
    flex-direction: column;
    margin-bottom: 16px;

    position: relative;
`;

const WorldsGridStyled = styled(WorldsGrid)`
    margin-top: 0;
`;

const Title = styled(H2)`
    user-select: none;
    padding: 0 2rem;

    ${p => p.theme.displayType === 'full-width' && Label2Class}
`;

const Body = styled(Body2)`
    text-align: center;
    color: ${props => props.theme.textSecondary};
    user-select: none;
`;

const BackButtonBlockStyled = styled(BackButtonBlock)`
    ${p =>
        p.theme.displayType === 'full-width' &&
        css`
            margin-top: -64px;
        `}
`;

const MamAccountCallout = styled.div`
    background: ${p => p.theme.backgroundContent};
    ${BorderSmallResponsive};
    padding: 8px 12px;
    display: flex;
    gap: 12px;
    margin-bottom: 24px;
`;

const Body3Secondary = styled(Body3)`
    color: ${p => p.theme.textSecondary};
`;

const ExclamationMarkCircleIconStyled = styled(ExclamationMarkCircleIcon)`
    margin-top: 4px;
    height: 16px;
    width: 16px;
    color: ${p => p.theme.accentOrange};
    flex-shrink: 0;
`;

const LinkStyled = styled(Body3)`
    color: ${p => p.theme.accentBlueConstant};
    cursor: pointer;
`;

export const RecoveryContent: FC<{ accountId: AccountId; walletId?: WalletId }> = ({
    accountId,
    walletId
}) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const mnemonic = useMnemonic(accountId, walletId);
    const account = useAccountState(accountId);
    const sdk = useAppSdk();
    const { config } = useAppContext();

    const onBack = () => {
        navigate(-1);
    };

    if (!mnemonic) {
        return <Wrapper />;
    }

    return (
        <Wrapper>
            <BackButtonBlockStyled onClick={onBack} />
            <Block>
                <Title>{t('secret_words_title')}</Title>
                <Body>{t('secret_words_caption')}</Body>
            </Block>

            {account?.type === 'mam' && walletId === undefined && (
                <MamAccountCallout>
                    <div>
                        <Body3Secondary>{t('mam_account_explanation') + ' '}</Body3Secondary>
                        <LinkStyled onClick={() => sdk.openPage(config.mamLearnMoreUrl)}>
                            {t('learn_more')}
                        </LinkStyled>
                    </div>
                    <ExclamationMarkCircleIconStyled />
                </MamAccountCallout>
            )}

            <WorldsGridStyled>
                {mnemonic.map((world, index) => (
                    <Body1 key={index}>
                        <WorldNumber> {index + 1}.</WorldNumber> {world}{' '}
                    </Body1>
                ))}
            </WorldsGridStyled>
        </Wrapper>
    );
};
