import React, { FC, useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import styled, { css } from 'styled-components';
import { BackButtonBlock } from '../../components/BackButton';
import { Body1, Body2, H2 } from '../../components/Text';
import { WorldNumber, WorldsGrid } from '../../components/create/Words';
import { useAppSdk } from '../../hooks/appSdk';
import { useTranslation } from '../../hooks/translation';
import { getMnemonic } from '../../state/mnemonic';
import { useCheckTouchId } from '../../state/password';
import { useActiveAccount } from '../../state/wallet';
import { AccountId } from '@tonkeeper/core/dist/entries/account';

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

const useMnemonic = (accountId: AccountId) => {
    const [mnemonic, setMnemonic] = useState<string[] | undefined>(undefined);
    const sdk = useAppSdk();
    const navigate = useNavigate();
    const { mutateAsync: checkTouchId } = useCheckTouchId();

    useEffect(() => {
        (async () => {
            try {
                setMnemonic(await getMnemonic(sdk, accountId, checkTouchId));
            } catch (e) {
                navigate(-1);
            }
        })();
    }, [accountId, checkTouchId]);

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

    position: relative;
`;

const Title = styled(H2)`
    user-select: none;
    padding: 0 2rem;
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

const RecoveryContent: FC<{ accountId: AccountId }> = ({ accountId }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const mnemonic = useMnemonic(accountId);

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

            <WorldsGrid>
                {mnemonic.map((world, index) => (
                    <Body1 key={index}>
                        <WorldNumber> {index + 1}.</WorldNumber> {world}{' '}
                    </Body1>
                ))}
            </WorldsGrid>
        </Wrapper>
    );
};
