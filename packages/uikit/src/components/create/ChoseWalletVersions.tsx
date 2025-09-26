import {
    backwardCompatibilityOnlyWalletVersions,
    WalletVersion,
    WalletVersions,
    walletVersionText
} from '@tonkeeper/core/dist/entries/wallet';
import { formatAddress, toShortValue } from '@tonkeeper/core/dist/utils/common';
import { FC, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { useAppContext } from '../../hooks/appContext';
import { useAppSdk } from '../../hooks/appSdk';
import { toFormattedTonBalance } from '../../hooks/balance';
import { hideIosKeyboard, openIosKeyboard } from '../../hooks/ios';
import { useTranslation } from '../../hooks/translation';
import { useAccountState, useStandardTonWalletVersions } from '../../state/wallet';
import { SkeletonListDesktopAdaptive } from '../Skeleton';
import { Checkbox } from '../fields/Checkbox';
import { ButtonResponsiveSize } from '../fields/Button';
import { Body1, Body2, Body2Class, H2Label2Responsive, Label1 } from '../Text';
import { ListBlock, ListItem, ListItemPayload } from '../List';
import { isAccountTonWalletStandard } from '@tonkeeper/core/dist/entries/account';
import { mnemonicToKeypair } from '@tonkeeper/core/dist/service/mnemonicService';
import { MnemonicType } from '@tonkeeper/core/dist/entries/password';
import { Network } from '@tonkeeper/core/dist/entries/network';
import { mayBeCreateAccountId } from '@tonkeeper/core/dist/service/walletService';
import { handleSubmit } from '../../libs/form';
import { NotificationFooter, NotificationFooterPortal } from '../Notification';

const Wrapper = styled.form`
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
`;

const Body = styled(Body1)`
    user-select: none;
    margin-bottom: 1rem;

    text-align: center;
    color: ${props => props.theme.textSecondary};

    ${p => p.theme.displayType === 'full-width' && Body2Class}
`;

const SkeletonListStyled = styled(SkeletonListDesktopAdaptive)`
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
    padding-top: 16px;
    flex: 1;
    display: flex;
    align-items: flex-end;
    width: 100%;
`;

export const ChoseWalletVersionsByMnemonic: FC<{
    mnemonic: string[];
    mnemonicType: MnemonicType;
    network: Network;
    onSubmit: (versions: WalletVersion[]) => void;
    isLoading?: boolean;
}> = ({ mnemonic, onSubmit, network, isLoading, mnemonicType }) => {
    const [publicKey, setPublicKey] = useState<string | undefined>(undefined);

    useEffect(() => {
        mnemonicToKeypair(mnemonic, mnemonicType).then(keypair =>
            setPublicKey(keypair.publicKey.toString('hex'))
        );
    }, [mnemonic]);

    return (
        <ChoseWalletVersions
            network={network}
            publicKey={publicKey}
            onSubmit={onSubmit}
            isLoading={isLoading}
        />
    );
};

export const ChoseWalletVersions: FC<{
    publicKey: string | undefined;
    network: Network;
    onSubmit: (versions: WalletVersion[]) => void;
    isLoading?: boolean;
}> = ({ publicKey, onSubmit, network, isLoading }) => {
    const { t } = useTranslation();
    const sdk = useAppSdk();
    const { defaultWalletVersion } = useAppContext();

    const { data: wallets } = useStandardTonWalletVersions(network, publicKey);
    const filteredWallets = useMemo(
        () =>
            wallets?.filter(w => {
                if (
                    backwardCompatibilityOnlyWalletVersions.includes(w.version) &&
                    !w.hasJettons &&
                    w.tonBalance === 0
                ) {
                    return false;
                }

                return true;
            }),
        [wallets]
    );
    const [checkedVersions, setCheckedVersions] = useState<WalletVersion[]>([]);
    const accountState = useAccountState(mayBeCreateAccountId(network, publicKey));

    useEffect(() => {
        if (sdk.isIOs()) {
            hideIosKeyboard();
        }
    }, []);

    useLayoutEffect(() => {
        if (filteredWallets) {
            if (accountState && isAccountTonWalletStandard(accountState)) {
                return setCheckedVersions(accountState.allTonWallets.map(w => w.version));
            }

            const versionsToCheck = filteredWallets
                .filter(w => w.tonBalance || w.hasJettons)
                .map(w => w.version);
            if (!versionsToCheck.length) {
                versionsToCheck.push(defaultWalletVersion);
            }
            setCheckedVersions(versionsToCheck);
        }
    }, [filteredWallets, accountState]);

    const toggleVersion = (version: WalletVersion, isChecked: boolean) => {
        setCheckedVersions(state =>
            isChecked ? state.concat(version) : state.filter(i => i !== version)
        );
    };

    const onSelect = () => {
        if (sdk.isIOs()) {
            openIosKeyboard('text', 'password');
        }
        onSubmit(checkedVersions);
    };

    return (
        <Wrapper onSubmit={handleSubmit(onSelect)}>
            <H2Label2Responsive>{t('choose_wallets_title')}</H2Label2Responsive>
            <Body>{t('choose_wallets_subtitle')}</Body>
            {!filteredWallets ? (
                <SkeletonListStyled size={WalletVersions.length} />
            ) : (
                <>
                    <ListBlockStyled>
                        {filteredWallets.map(wallet => (
                            <ListItem hover={false} key={wallet.address.toRawString()}>
                                <ListItemPayload>
                                    <TextContainer>
                                        <Label1>{walletVersionText(wallet.version)}</Label1>
                                        <Body2Secondary>
                                            {toShortValue(formatAddress(wallet.address, network))}
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
                    <NotificationFooterPortal>
                        <NotificationFooter>
                            <ButtonResponsiveSize
                                fullWidth
                                primary
                                disabled={!checkedVersions.length}
                                onClick={onSelect}
                                loading={isLoading}
                                type="submit"
                                autoFocus
                            >
                                {t('continue')}
                            </ButtonResponsiveSize>
                        </NotificationFooter>
                    </NotificationFooterPortal>
                </>
            )}
        </Wrapper>
    );
};
