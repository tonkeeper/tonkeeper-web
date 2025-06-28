import styled from 'styled-components';
import {
    backwardCompatibilityOnlyWalletVersions,
    sortWalletsByVersion,
    TonWalletStandard
} from '@tonkeeper/core/dist/entries/wallet';
import {
    Account,
    AccountMAM,
    AccountTonMnemonic,
    seeIfMainnnetAccount
} from '@tonkeeper/core/dist/entries/account';

import { Label2 } from '../Text';
import { DoneIcon } from '../Icon';
import { ListBlock } from '../List';
import { Button } from '../fields/Button';
import { SubscriptionScreens } from '../../enums/pro';
import { ProWalletListItem } from './ProWalletListItem';
import { useTranslation } from '../../hooks/translation';
import { useNotifyError } from '../../hooks/useNotification';
import { ProSubscriptionHeader } from './ProSubscriptionHeader';
import { useSelectWalletForProMutation } from '../../state/pro';
import { ProScreenContentWrapper } from './ProScreenContentWrapper';
import { useAccountsState, useActiveWallet } from '../../state/wallet';
import { ProSettingsMainButtonWrapper } from './ProSettingsMainButtonWrapper';
import { useGoToSubscriptionScreen } from '../../hooks/pro/useGoToSubscriptionScreen';

interface AccountWallet {
    wallet: TonWalletStandard;
    account: Account;
}

export const ProAccountChooseScreen = () => {
    const { t } = useTranslation();
    const activeWallet = useActiveWallet();
    const { mutateAsync, error, isLoading } = useSelectWalletForProMutation();
    const goTo = useGoToSubscriptionScreen();
    useNotifyError(error);

    const accounts = useAccountsState()
        .filter(seeIfMainnnetAccount)
        .filter(acc => acc.type === 'mnemonic' || acc.type === 'mam') as (
        | AccountTonMnemonic
        | AccountMAM
    )[];

    const accountsWallets: AccountWallet[] = accounts.flatMap(a => {
        if (a.type === 'mam') {
            return a.derivations.map<AccountWallet>(derivation => ({
                wallet: derivation.tonWallets[0],
                account: a,
                derivation
            }));
        }

        return a.allTonWallets
            .filter(w => !backwardCompatibilityOnlyWalletVersions.includes(w.version))
            .sort(sortWalletsByVersion)
            .map<AccountWallet>(w => ({
                wallet: w,
                account: a
            }));
    });

    const handleNextClick = () => {
        goTo(SubscriptionScreens.PURCHASE);
    };

    return (
        <ProScreenContentWrapper>
            <ProSubscriptionHeader
                titleKey="choose_wallet_for_pro"
                subtitleKey="subscription_will_be_linked_to_wallet"
            />
            <ListBlock fullWidth margin={false}>
                {accountsWallets.flatMap(accountWalletProps => (
                    <ProWalletListItem
                        key={accountWalletProps.wallet.id}
                        onClick={() => mutateAsync(accountWalletProps.wallet.id)}
                        rightElement={
                            <Icon>
                                {activeWallet?.id === accountWalletProps.wallet.id && <DoneIcon />}
                            </Icon>
                        }
                        {...accountWalletProps}
                    />
                ))}
            </ListBlock>
            <ProSettingsMainButtonWrapper>
                <Button
                    primary
                    fullWidth
                    size="large"
                    loading={isLoading}
                    onClick={handleNextClick}
                >
                    <Label2>{t('continue')}</Label2>
                </Button>
            </ProSettingsMainButtonWrapper>
        </ProScreenContentWrapper>
    );
};

const Icon = styled.span`
    padding-left: 0.5rem;
    color: ${props => props.theme.accentBlue};
    display: flex;
    margin-left: auto;
`;
