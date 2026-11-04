import { FC, Fragment, useState } from 'react';
import { FiatCurrencies } from '@tonkeeper/core/dist/entries/fiat';
import { ImportWalletKindPreview } from '@tonkeeper/core/dist/service/importWalletKindPreviewService';
import { useTranslation } from '../../hooks/translation';
import { formatFiatCurrency } from '../../hooks/balance';
import { Button } from '../../primitives/Button';
import { Radio } from '../../primitives/Checkbox';
import { ModalFooter, ModalFooterPortal } from '../../primitives/Modal';
import IcChainTon20 from '../../icons/components/IcChainTon20';
import IcEllipsis28 from '../../icons/components/IcEllipsis28';
import { cn } from '../../libs/css';

export type WalletKind = 'ton' | 'multichain';

/**
 * Picks which wallet a seed phrase that can become either should be
 * imported as: a phrase valid both as a TON mnemonic and as BIP39 derives
 * different keys per reading, and a BIP39 phrase whose legacy TRON
 * side-wallet holds funds would leave them behind as multichain. Multichain
 * is preselected, while either wallet can be chosen.
 */
export const ChooseWalletKind: FC<{
    ton: ImportWalletKindPreview;
    multichain: ImportWalletKindPreview;
    fiat: FiatCurrencies;
    onContinue: (kind: WalletKind) => void;
    isLoading?: boolean;
}> = ({ ton, multichain, fiat, onContinue, isLoading }) => {
    const { t } = useTranslation();
    const [selected, setSelected] = useState<WalletKind>('multichain');

    const previewText = (preview: ImportWalletKindPreview) => {
        if (!preview.hasActivity) {
            return t('choose_wallet_kind_no_activity_yet');
        }
        const balance = formatFiatCurrency(fiat, preview.fiatTotal);
        return preview.nftsCount > 0
            ? `${balance} · ${t('choose_wallet_kind_nfts_count', { nftsCount: preview.nftsCount })}`
            : balance;
    };

    const options: { kind: WalletKind; title: string; preview: ImportWalletKindPreview }[] = [
        {
            kind: 'multichain',
            title: t('choose_wallet_kind_multichain_wallet'),
            preview: multichain
        },
        { kind: 'ton', title: t('choose_wallet_kind_ton_wallet'), preview: ton }
    ];

    return (
        <div className="mx-auto flex w-full max-w-[524px] flex-col items-center">
            <div className="flex flex-col items-center gap-1 px-8 pb-6 text-center">
                <h2 className="text-h2 text-textPrimary">{t('choose_wallet_kind_title')}</h2>
                <p className="text-balance text-body1 text-textSecondary">
                    {t('choose_wallet_kind_description')}
                </p>
            </div>

            <div
                role="radiogroup"
                className="mb-4 w-full overflow-hidden rounded-medium bg-backgroundContent"
            >
                {options.map(({ kind, title, preview }, index) => (
                    <Fragment key={kind}>
                        {index > 0 && <div className="ml-4 h-[0.5px] bg-separatorCommon" />}
                        <button
                            type="button"
                            role="radio"
                            aria-checked={selected === kind}
                            disabled={isLoading}
                            onClick={() => setSelected(kind)}
                            className="flex w-full items-center gap-4 p-4 text-left transition-colors duration-100 hover:bg-backgroundContentTint disabled:cursor-default disabled:opacity-50"
                        >
                            <WalletKindAvatar kind={kind} />
                            <div className="min-w-0 flex-1">
                                <div className="truncate text-label1 text-textPrimary">{title}</div>
                                <div className="truncate text-body2 text-textSecondary">
                                    {previewText(preview)}
                                </div>
                            </div>
                            <Radio checked={selected === kind} borderColor="textTertiary" />
                        </button>
                    </Fragment>
                ))}
            </div>

            <ModalFooterPortal>
                <ModalFooter>
                    <Button
                        size="large"
                        variant="primaryBlue"
                        fullWidth
                        loading={isLoading}
                        onClick={() => onContinue(selected)}
                        autoFocus
                    >
                        {t('continue')}
                    </Button>
                </ModalFooter>
            </ModalFooterPortal>
        </div>
    );
};

const WalletKindAvatar: FC<{ kind: WalletKind }> = ({ kind }) =>
    kind === 'ton' ? (
        <IcChainTon20 className="size-11 shrink-0 rounded-full" />
    ) : (
        <div
            className={cn(
                'flex size-11 shrink-0 items-center justify-center rounded-full text-accentPurple',
                'bg-[color-mix(in_srgb,var(--tk-accent-purple)_12%,transparent)]'
            )}
        >
            <IcEllipsis28 className="size-7" />
        </div>
    );
