import { ListBlock, ListItem, ListItemPayload } from '../List';
import styled from 'styled-components';
import { Body1, Body2, H2, Label1 } from '../Text';
import { useTranslation } from '../../hooks/translation';
import {
    WalletVersion,
    WalletVersions,
    walletVersionText
} from '@tonkeeper/core/dist/entries/wallet';
import { formatAddress, toShortValue } from '@tonkeeper/core/dist/utils/common';
import React, { FC, useEffect, useLayoutEffect, useState } from 'react';
import { useAccountState, useStandardTonWalletVersions } from '../../state/wallet';
import { SkeletonList } from '../Skeleton';
import { toFormattedTonBalance } from '../../hooks/balance';
import { Checkbox } from '../fields/Checkbox';
import { Button } from '../fields/Button';
import { mnemonicToWalletKey } from '@ton/crypto';
import { ChevronLeftIcon } from '../Icon';
import { RoundedButton } from '../fields/RoundedButton';
import { useAppContext } from '../../hooks/appContext';
import { isAccountControllable } from '@tonkeeper/core/dist/entries/account';

const Wrapper = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
`;

const BackButtonContainer = styled.div`
    padding: 8px;
    margin-bottom: 24px;
    margin-right: auto;
`;

const Body1Styled = styled(Body1)`
    margin-top: 4px;
    margin-bottom: 32px;
    color: ${p => p.theme.textSecondary};
`;

const SkeletonListStyled = styled(SkeletonList)`
    width: 100%;
`;

const ListBlockStyled = styled(ListBlock)`
    width: 100%;
`;

const TextContainer = styled.span`
    flex-direction: column;
    display: flex;
    align-items: flex-start;
`;

const Body2Secondary = styled(Body2)`
    color: ${props => props.theme.textSecondary};
`;

const SubmitBlock = styled.div`
    padding: 16px 0 32px;
    flex: 1;
    display: flex;
    align-items: flex-end;
    width: 100%;
`;

export const ChoseWalletVersions: FC<{
    mnemonic: string[];
    onSubmit: (versions: WalletVersion[]) => void;
    onBack: () => void;
    isLoading?: boolean;
}> = ({ mnemonic, onSubmit, onBack, isLoading }) => {
    const { t } = useTranslation();
    const { defaultWalletVersion } = useAppContext();

    const [publicKey, setPublicKey] = useState<string | undefined>(undefined);
    const { data: wallets } = useStandardTonWalletVersions(publicKey);
    const [checkedVersions, setCheckedVersions] = useState<WalletVersion[]>([]);
    const accountState = useAccountState(publicKey);

    useEffect(() => {
        mnemonicToWalletKey(mnemonic).then(keypair =>
            setPublicKey(keypair.publicKey.toString('hex'))
        );
    }, [mnemonic]);

    useLayoutEffect(() => {
        if (wallets) {
            if (accountState && isAccountControllable(accountState)) {
                return setCheckedVersions(accountState.allTonWallets.map(w => w.version));
            }

            const versionsToCheck = wallets
                .filter(w => w.tonBalance || w.hasJettons)
                .map(w => w.version);
            if (!versionsToCheck.length) {
                versionsToCheck.push(defaultWalletVersion);
            }
            setCheckedVersions(versionsToCheck);
        }
    }, [wallets, accountState]);

    const toggleVersion = (version: WalletVersion, isChecked: boolean) => {
        setCheckedVersions(state =>
            isChecked ? state.concat(version) : state.filter(i => i !== version)
        );
    };

    return (
        <Wrapper>
            <BackButtonContainer>
                <RoundedButton onClick={onBack}>
                    <ChevronLeftIcon />
                </RoundedButton>
            </BackButtonContainer>
            <H2>{t('choose_wallets_title')}</H2>
            <Body1Styled>{t('choose_wallets_subtitle')}</Body1Styled>
            {!wallets ? (
                <SkeletonListStyled size={WalletVersions.length} />
            ) : (
                <>
                    <ListBlockStyled>
                        {wallets.map(wallet => (
                            <ListItem hover={false} key={wallet.address.toRawString()}>
                                <ListItemPayload>
                                    <TextContainer>
                                        <Label1>{walletVersionText(wallet.version)}</Label1>
                                        <Body2Secondary>
                                            {toShortValue(formatAddress(wallet.address))}
                                            &nbsp;·&nbsp;
                                            {toFormattedTonBalance(wallet.tonBalance)}&nbsp;TON
                                            {wallet.hasJettons && t('wallet_version_and_tokens')}
                                        </Body2Secondary>
                                    </TextContainer>
                                    <Checkbox
                                        checked={checkedVersions.includes(wallet.version)}
                                        onChange={isChecked =>
                                            toggleVersion(wallet.version, isChecked)
                                        }
                                    />
                                </ListItemPayload>
                            </ListItem>
                        ))}
                    </ListBlockStyled>
                    <SubmitBlock>
                        <Button
                            fullWidth
                            primary
                            disabled={!checkedVersions.length}
                            onClick={() => onSubmit(checkedVersions)}
                            loading={isLoading}
                        >
                            {t('continue')}
                        </Button>
                    </SubmitBlock>
                </>
            )}
        </Wrapper>
    );
};
