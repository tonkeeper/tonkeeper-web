import React, { FC, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { Body1, Body2, Body2Class, H2, Label2Class } from '../Text';
import { useTranslation } from '../../hooks/translation';
import { Button } from '../fields/Button';
import { SpinnerRing } from '../Icon';
import { useAccountsState, useActiveConfig, useCreateAccountTonMultisig } from '../../state/wallet';
import { AccountTonMultisig } from '@tonkeeper/core/dist/entries/account';
import { WalletId } from '@tonkeeper/core/dist/entries/wallet';
import {
    Notification,
    useSetNotificationOnBack,
    useSetNotificationOnCloseInterceptor
} from '../Notification';
import { useEstimateDeployMultisig } from '../../hooks/blockchain/multisig/useEstimateDeployMultisig';
import {
    useAwaitMultisigIsDeployed,
    useDeployMultisig
} from '../../hooks/blockchain/multisig/useDeployMultisig';
import {
    ConfirmView,
    ConfirmViewHeading,
    ConfirmViewHeadingSlot,
    ConfirmViewTitleSlot
} from '../transfer/ConfirmView';
import { useDisclosure } from '../../hooks/useDisclosure';

import { Address } from '@ton/core';

import { RenameWalletContent } from '../settings/wallet-name/WalletNameNotification';
import { AddWalletContext } from './AddWalletContext';
import { useConfirmDiscardNotification } from '../modals/ConfirmDiscardNotificationControlled';
import { useAppSdk } from '../../hooks/appSdk';
import { MultisigConfigForm, MultisigUseForm } from '../multisig/MultisigConfigForm';
import { useNavigate } from 'react-router-dom';
import { AppRoute } from '../../libs/routes';
import {
    MultisigConfig,
    MultisigEncoder
} from '@tonkeeper/core/dist/service/ton-blockchain/encoder/multisig-encoder';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import BigNumber from 'bignumber.js';
import { TON_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';

const ContentWrapper = styled.div`
    display: flex;
    flex-direction: column;
`;

const Heading = styled(H2)`
    ${p => p.theme.displayType === 'full-width' && Label2Class};
    margin-bottom: 4px;
    text-align: center;
`;

const SubHeading = styled(Body1)`
    ${p => p.theme.displayType === 'full-width' && Body2Class};
    color: ${p => p.theme.textSecondary};
    margin-bottom: 24px;
    text-align: center;
`;

export const CreateMultisig: FC<{
    onClose: () => void;
}> = ({ onClose }) => {
    const [account, setAccount] = useState<AccountTonMultisig | undefined>();
    const [contractParams, setContractParams] = useState<
        | {
              multisigAddress: string;
              deployerWalletId: WalletId;
              hostWallets: WalletId[];
          }
        | undefined
    >();
    const navigate = useNavigate();
    const finalClose = useCallback(() => {
        onClose();
        navigate(AppRoute.multisigWallets);
    }, []);

    if (!contractParams) {
        return <CreateMultisigFormPage onSentDeploy={setContractParams} />;
    }

    if (!account) {
        return <CreateMultisigAwaitDeployPage onDone={setAccount} {...contractParams} />;
    }

    return <CreateMultisigRenamePage account={account} onClose={finalClose} />;
};

const CreateMultisigRenamePage: FC<{ account: AccountTonMultisig; onClose: () => void }> = ({
    account,
    onClose
}) => {
    useSetNotificationOnBack(undefined);
    const { t } = useTranslation();
    return (
        <ContentWrapper>
            <Heading>{t('customize_modal_title')}</Heading>
            <SubHeading>{t('customize_modal_subtitle')}</SubHeading>
            <RenameWalletContent account={account} onClose={onClose} />
        </ContentWrapper>
    );
};

const SpinnerStyled = styled(SpinnerRing)`
    transform: scale(3);
    margin: 36px auto;
`;

const DeployHelpSection = styled.div`
    margin-top: 24px;
    display: flex;
    flex-direction: column;
    gap: 8px;

    > ${Body2} {
        text-align: center;
        display: block;
        color: ${p => p.theme.textSecondary};
    }
`;

const CreateMultisigAwaitDeployPage: FC<{
    onDone: (account: AccountTonMultisig) => void;
    multisigAddress: string;
    deployerWalletId: WalletId;
    hostWallets: WalletId[];
}> = ({ onDone, multisigAddress, deployerWalletId, hostWallets }) => {
    const { mutateAsync: awaitDeploy } = useAwaitMultisigIsDeployed();
    const { mutateAsync: addAccount } = useCreateAccountTonMultisig();
    const [showHelpButton, setShowHelpButton] = useState(false);
    const { navigateHome } = useContext(AddWalletContext);
    const { onOpen: openConfirmDiscard } = useConfirmDiscardNotification();
    const config = useActiveConfig();
    const sdk = useAppSdk();

    const onNotificationBack = useMemo(
        () =>
            navigateHome
                ? () =>
                      openConfirmDiscard({
                          onClose: discard => {
                              if (discard) {
                                  navigateHome();
                              }
                          }
                      })
                : undefined,
        [openConfirmDiscard, navigateHome]
    );

    const onNotificationCloseInterceptor = useCallback(
        (closeHandler: () => void) => {
            openConfirmDiscard({
                onClose: discard => {
                    if (discard) {
                        closeHandler();
                    }
                }
            });
        },
        [openConfirmDiscard]
    );

    useSetNotificationOnBack(onNotificationBack);
    useSetNotificationOnCloseInterceptor(onNotificationCloseInterceptor);

    useEffect(() => {
        setTimeout(() => setShowHelpButton(true), 1500 * 20);
        awaitDeploy({ multisigAddress, deployerWalletId })
            .then(() =>
                addAccount({
                    address: multisigAddress,
                    hostWallets,
                    selectedHostWalletId: deployerWalletId
                })
            )
            .then(onDone);
    }, []);

    const { t } = useTranslation();
    const explorerUrl = config.accountExplorer ?? 'https://tonviewer.com/%s';

    return (
        <ContentWrapper>
            <Heading>{t('create_multisig_await_deployment_title')}</Heading>
            <SubHeading>{t('create_multisig_await_deployment_description')}</SubHeading>
            <SpinnerStyled />
            {showHelpButton && (
                <DeployHelpSection>
                    <Body2>{t('create_multisig_await_deployment_help_title')}</Body2>
                    <Button
                        secondary
                        onClick={() => sdk.openPage(explorerUrl.replace('%s', multisigAddress))}
                    >
                        {t('create_multisig_await_deployment_help_explorer_button')}
                    </Button>
                    {config.multisig_help_url && (
                        <Button onClick={() => sdk.openPage(config.multisig_help_url!)}>
                            {t('create_multisig_await_deployment_help_support_button')}
                        </Button>
                    )}
                </DeployHelpSection>
            )}
        </ContentWrapper>
    );
};

const deployMultisigAssetAmount = new AssetAmount({
    weiAmount: new BigNumber(MultisigEncoder.deployMultisigValue.toString()),
    asset: TON_ASSET
});

const CreateMultisigFormPage: FC<{
    onSentDeploy: (info: {
        multisigAddress: string;
        deployerWalletId: WalletId;
        hostWallets: WalletId[];
    }) => void;
}> = ({ onSentDeploy }) => {
    const [deployArgs, setDeployArgs] = useState<
        Parameters<typeof useDeployMultisig>[0] | undefined
    >();
    const { t } = useTranslation();
    const { isOpen, onClose, onOpen } = useDisclosure();
    const estimateMutation = useEstimateDeployMultisig();
    const deployMutation = useDeployMultisig(deployArgs);
    const { mutateAsync: estimateDeploy } = estimateMutation;
    const accounts = useAccountsState();

    const onSubmit = async (data: MultisigUseForm) => {
        onOpen();
        const fromWallet = data.firstParticipant;
        const multisigConfig: MultisigConfig = {
            proposers: [],
            signers: data.participants
                .map(p => p.address)
                .concat(data.firstParticipant)
                .map(v => Address.parse(v)),
            threshold: data.quorum,
            allowArbitrarySeqno: false
        };
        const result = await estimateDeploy({ multisigConfig, fromWallet });
        setDeployArgs({ multisigConfig, fromWallet, fee: result?.fee });
    };

    const mutateAsync = useCallback(async () => {
        const address = await deployMutation.mutateAsync();
        if (address) {
            const wallets = accounts.flatMap(a => a.allTonWallets);
            onSentDeploy({
                multisigAddress: address!,
                deployerWalletId: deployArgs!.fromWallet,
                hostWallets: wallets
                    .map(w => w.rawAddress)
                    .filter(w =>
                        deployArgs!.multisigConfig.signers.some(a => a.equals(Address.parse(w)))
                    )
            });
        }
        return !!address;
    }, [deployMutation.mutateAsync, onSentDeploy, deployArgs?.fromWallet, accounts]);

    return (
        <ContentWrapper>
            <Heading>{t('multisig_add_title')}</Heading>
            <SubHeading>{t('multisig_add_description')}</SubHeading>
            <MultisigConfigForm onSubmit={onSubmit} />

            <Notification isOpen={isOpen} handleClose={onClose}>
                {() => (
                    <ConfirmView
                        assetAmount={deployMultisigAssetAmount}
                        onClose={onClose}
                        estimation={{ ...estimateMutation }}
                        {...deployMutation}
                        mutateAsync={mutateAsync}
                    >
                        <ConfirmViewTitleSlot />
                        <ConfirmViewHeadingSlot>
                            <ConfirmViewHeading title={t('multisig_deploy')} />
                        </ConfirmViewHeadingSlot>
                    </ConfirmView>
                )}
            </Notification>
        </ContentWrapper>
    );
};
