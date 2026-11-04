import { FC, Fragment, ReactNode, useEffect, useState } from 'react';
import { WalletVersion, walletVersionText } from '@tonkeeper/core/dist/entries/wallet';
import { MnemonicType } from '@tonkeeper/core/dist/entries/password';
import { Network } from '@tonkeeper/core/dist/entries/network';
import { BRAND_CONFIG } from '@tonkeeper/core/dist/config/brand';
import { mnemonicToKeypair } from '@tonkeeper/core/dist/service/mnemonicService';
import { formatAddress, toShortValue } from '@tonkeeper/core/dist/utils/common';
import { useTranslation } from '../../hooks/translation';
import { toFormattedTonBalance } from '../../hooks/balance';
import { useStandardTonWalletVersions } from '../../state/wallet';
import { Button } from '../../primitives/Button';
import { Radio } from '../../primitives/Checkbox';
import { ModalFooter, ModalFooterPortal } from '../../primitives/Modal';
import { SkeletonScope, useSkeletonMask } from '../../primitives/Skeleton';

export interface TonVersionOption {
    version: WalletVersion;
    /** Raw or friendly address of this version's wallet. */
    address: string;
    /** Coin balance in nanotons. */
    tonBalance: number;
    hasJettons: boolean;
}

/** W5 first — the recommended version, preselected. */
const OFFERED_VERSIONS: readonly WalletVersion[] = [WalletVersion.V5R1, WalletVersion.V4R2];

/**
 * Picks the TON wallet version a BIP39 phrase is imported as when both
 * v4R2 and W5 hold funds. A multichain account holds one TON wallet, so
 * exactly one version is chosen; the other one stays reachable by
 * importing the phrase again.
 */
export const ChooseMultichainTonVersion: FC<{
    /** Undefined while the per-version holdings load. */
    options: readonly TonVersionOption[] | undefined;
    network: Network;
    onSubmit: (version: WalletVersion) => void;
    isLoading?: boolean;
}> = ({ options, network, onSubmit, isLoading }) => {
    const { t } = useTranslation();
    const [selected, setSelected] = useState<WalletVersion>(WalletVersion.V5R1);
    const loading = options === undefined;

    return (
        <div className="mx-auto flex w-full max-w-[524px] flex-col items-center">
            <div className="flex flex-col items-center gap-1 px-8 pb-6 text-center">
                <h2 className="text-h2 text-textPrimary">{t('choose_wallet_version_title')}</h2>
                <p className="text-balance text-body1 text-textSecondary">
                    {t('choose_wallet_version_description')}
                </p>
            </div>

            <SkeletonScope loading={loading}>
                <div
                    role="radiogroup"
                    aria-busy={loading}
                    className="mb-4 w-full overflow-hidden rounded-medium bg-backgroundContent"
                >
                    {OFFERED_VERSIONS.map((version, index) => {
                        const option = options?.find(o => o.version === version);
                        return (
                            <Fragment key={version}>
                                {index > 0 && <div className="ml-4 h-[0.5px] bg-separatorCommon" />}
                                <TonVersionRow
                                    title={walletVersionText(version)}
                                    description={
                                        option ? (
                                            <>
                                                {toShortValue(
                                                    formatAddress(option.address, network)
                                                )}
                                                &nbsp;·&nbsp;
                                                {toFormattedTonBalance(option.tonBalance)}&nbsp;
                                                {BRAND_CONFIG.coinSymbol}
                                                {option.hasJettons &&
                                                    t('wallet_version_and_tokens')}
                                            </>
                                        ) : (
                                            '—'
                                        )
                                    }
                                    checked={selected === version}
                                    disabled={loading || isLoading}
                                    onSelect={() => setSelected(version)}
                                />
                            </Fragment>
                        );
                    })}
                </div>
            </SkeletonScope>

            <ModalFooterPortal>
                <ModalFooter>
                    <Button
                        size="large"
                        variant="primaryBlue"
                        fullWidth
                        disabled={loading}
                        loading={isLoading}
                        onClick={() => onSubmit(selected)}
                        autoFocus
                    >
                        {t('continue')}
                    </Button>
                </ModalFooter>
            </ModalFooterPortal>
        </div>
    );
};

const TonVersionRow: FC<{
    title: string;
    description: ReactNode;
    checked: boolean;
    disabled?: boolean;
    onSelect: () => void;
}> = ({ title, description, checked, disabled, onSelect }) => {
    const mask = useSkeletonMask();

    return (
        <button
            type="button"
            role="radio"
            aria-checked={checked}
            disabled={disabled}
            onClick={onSelect}
            className="flex w-full items-center gap-4 p-4 text-left transition-colors duration-100 hover:bg-backgroundContentTint disabled:cursor-default"
        >
            <div className="min-w-0 flex-1">
                <div {...mask({ w: 48, h: 16 })} className="truncate text-label1 text-textPrimary">
                    {title}
                </div>
                <div {...mask({ w: 180 })} className="truncate text-body2 text-textSecondary">
                    {description}
                </div>
            </div>
            <span {...mask({ w: 24, h: 24, r: 12 })} className="flex shrink-0">
                <Radio checked={checked} borderColor="textTertiary" />
            </span>
        </button>
    );
};

/** Loads the per-version holdings of `mnemonic` read as BIP39 and renders the picker. */
export const ChooseMultichainTonVersionByMnemonic: FC<{
    mnemonic: string[];
    network: Network;
    onSubmit: (version: WalletVersion) => void;
    isLoading?: boolean;
}> = ({ mnemonic, network, onSubmit, isLoading }) => {
    const [publicKey, setPublicKey] = useState<string | undefined>(undefined);
    useEffect(() => {
        const mnemonicType: MnemonicType = 'bip39';
        mnemonicToKeypair(mnemonic, mnemonicType).then(keypair =>
            setPublicKey(keypair.publicKey.toString('hex'))
        );
    }, [mnemonic]);

    const { data: wallets } = useStandardTonWalletVersions(network, publicKey);
    const options = wallets?.map(w => ({
        version: w.version,
        address: w.address.toRawString(),
        tonBalance: w.tonBalance,
        hasJettons: w.hasJettons
    }));

    return (
        <ChooseMultichainTonVersion
            options={options}
            network={network}
            onSubmit={onSubmit}
            isLoading={isLoading}
        />
    );
};
