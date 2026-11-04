import {
    backwardCompatibilityOnlyWalletVersions,
    WalletVersion,
    WalletVersions,
    walletVersionText
} from '@tonkeeper/core/dist/entries/wallet';
import { BRAND_CONFIG } from '@tonkeeper/core/dist/config/brand';
import { formatAddress, toShortValue } from '@tonkeeper/core/dist/utils/common';
import { FC, Fragment, ReactNode, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { useAppContext } from '../../hooks/appContext';
import { useAppSdk } from '../../hooks/appSdk';
import { toFormattedTonBalance } from '../../hooks/balance';
import { hideIosKeyboard, openIosKeyboard } from '../../hooks/ios';
import { useTranslation } from '../../hooks/translation';
import { useAccountState, useStandardTonWalletVersions } from '../../state/wallet';
import { Checkbox } from '../../primitives/Checkbox';
import { Button } from '../../primitives/Button';
import { SkeletonScope, useSkeletonMask } from '../../primitives/Skeleton';
import { isAccountTonWalletStandard } from '@tonkeeper/core/dist/entries/account';
import { mnemonicToKeypair } from '@tonkeeper/core/dist/service/mnemonicService';
import { MnemonicType } from '@tonkeeper/core/dist/entries/password';
import { Network } from '@tonkeeper/core/dist/entries/network';
import { mayBeCreateAccountId } from '@tonkeeper/core/dist/service/walletService';
import { handleSubmit } from '../../libs/form';
import { ModalFooter, ModalFooterPortal } from '../../primitives/Modal';

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
    }, [mnemonic, mnemonicType]);

    return (
        <ChoseWalletVersions
            network={network}
            publicKey={publicKey}
            onSubmit={onSubmit}
            isLoading={isLoading}
        />
    );
};

const WalletVersionRow: FC<{
    title: ReactNode;
    description: ReactNode;
    checked: boolean;
    onToggle: () => void;
}> = ({ title, description, checked, onToggle }) => {
    const mask = useSkeletonMask();

    return (
        <button
            type="button"
            role="checkbox"
            aria-checked={checked}
            onClick={onToggle}
            className="flex w-full items-center gap-4 p-4 text-left transition-colors duration-100 hover:bg-backgroundContentTint"
        >
            <div className="min-w-0 flex-1">
                <div {...mask({ w: 48, h: 16 })} className="truncate text-label1 text-textPrimary">
                    {title}
                </div>
                <div {...mask({ w: 180 })} className="truncate text-body2 text-textSecondary">
                    {description}
                </div>
            </div>
            <span {...mask({ w: 22, h: 22, r: 6 })} className="flex shrink-0">
                <Checkbox checked={checked} borderColor="textTertiary" />
            </span>
        </button>
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
    }, [sdk]);

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
    }, [filteredWallets, accountState, defaultWalletVersion]);

    const toggleVersion = (version: WalletVersion) => {
        setCheckedVersions(state =>
            state.includes(version) ? state.filter(i => i !== version) : state.concat(version)
        );
    };

    const onSelect = () => {
        if (sdk.isIOs()) {
            openIosKeyboard('text', 'password');
        }
        onSubmit(checkedVersions);
    };

    const loading = !filteredWallets;

    return (
        <form
            onSubmit={handleSubmit(onSelect)}
            className="mx-auto flex w-full max-w-[524px] flex-col items-center"
        >
            <div className="flex flex-col items-center gap-1 px-8 pb-6 text-center">
                <h2 className="text-h2 text-textPrimary">{t('choose_wallets_title')}</h2>
                <p className="text-balance text-body1 text-textSecondary">
                    {t('choose_wallets_subtitle')}
                </p>
            </div>

            <SkeletonScope loading={loading}>
                <div
                    role="group"
                    aria-busy={loading}
                    className="mb-4 w-full overflow-hidden rounded-medium bg-backgroundContent"
                >
                    {loading
                        ? WalletVersions.map((version, index) => (
                              <Fragment key={version}>
                                  {index > 0 && (
                                      <div className="ml-4 h-[0.5px] bg-separatorCommon" />
                                  )}
                                  <WalletVersionRow
                                      title={walletVersionText(version)}
                                      description="—"
                                      checked={false}
                                      onToggle={() => {}}
                                  />
                              </Fragment>
                          ))
                        : filteredWallets.map((wallet, index) => (
                              <Fragment key={wallet.address.toRawString()}>
                                  {index > 0 && (
                                      <div className="ml-4 h-[0.5px] bg-separatorCommon" />
                                  )}
                                  <WalletVersionRow
                                      title={walletVersionText(wallet.version)}
                                      description={
                                          <>
                                              {toShortValue(formatAddress(wallet.address, network))}
                                              &nbsp;·&nbsp;
                                              {toFormattedTonBalance(wallet.tonBalance)}&nbsp;
                                              {BRAND_CONFIG.coinSymbol}
                                              {wallet.hasJettons && t('wallet_version_and_tokens')}
                                          </>
                                      }
                                      checked={checkedVersions.includes(wallet.version)}
                                      onToggle={() => toggleVersion(wallet.version)}
                                  />
                              </Fragment>
                          ))}
                </div>
            </SkeletonScope>

            <ModalFooterPortal>
                <ModalFooter>
                    <Button
                        size="large"
                        variant="primaryBlue"
                        fullWidth
                        type="submit"
                        disabled={loading || !checkedVersions.length}
                        loading={isLoading}
                        onClick={onSelect}
                        autoFocus
                    >
                        {t('continue')}
                    </Button>
                </ModalFooter>
            </ModalFooterPortal>
        </form>
    );
};
