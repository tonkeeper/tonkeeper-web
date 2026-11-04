import { FC, Fragment, useMemo, useState } from 'react';
import type { Currency } from '@tonkeeper/core/dist/tonkeeperApiGenerated';
import { Modal, useSetModalOnBack } from '../../primitives/Modal';
import { SearchField } from '../../primitives/SearchField';
import IcDoneBold16 from '../../icons/components/IcDoneBold16';
import { useTranslation } from '../../hooks/translation';
import { useSupportedCurrencies } from '../../state/fiat';

export interface CurrencyPickerScreenProps {
    isOpen: boolean;
    onClose: () => void;
    onBack: () => void;
    /**
     * Currency codes the user is allowed to pick. The fiats the chosen
     * asset's providers actually support — passed down from
     * `assetDetail.paymentMethods[*].providers[*].fiat`. The full master
     * list from `useSupportedCurrencies` is intersected with this set so
     * we only show currencies the user can actually transact with.
     */
    allowed: string[];
    selected: string | undefined;
    onSelect: (code: string) => void;
}

interface CurrencyRowProps {
    currency: Currency;
    selected: boolean;
    onClick: () => void;
    showDivider: boolean;
}

const CurrencyRow: FC<CurrencyRowProps> = ({ currency, selected, onClick, showDivider }) => (
    <>
        <button
            type="button"
            onClick={onClick}
            className="flex w-full items-center text-left transition-colors hover:bg-backgroundContentTint focus:outline-none focus-visible:bg-backgroundContentTint"
        >
            <div className="flex shrink-0 items-center py-3.5 pl-4">
                <img
                    src={currency.image}
                    alt=""
                    loading="lazy"
                    className="h-7 w-7 shrink-0 rounded-full object-cover"
                />
            </div>
            <div className="flex min-w-0 flex-1 items-center gap-2 p-4">
                <span className="shrink-0 text-label1 text-textPrimary">{currency.code}</span>
                <span className="min-w-0 flex-1 truncate text-body1 text-textSecondary">
                    {currency.name}
                </span>
            </div>
            {selected && (
                <div className="flex shrink-0 items-center py-3.5 pr-4">
                    <IcDoneBold16 className="h-7 w-7 text-accentBlue" />
                </div>
            )}
        </button>
        {showDivider && <div className="ml-12 h-px bg-separatorCommon" />}
    </>
);

export interface CurrencyPickerContentProps {
    allowed: string[];
    selected: string | undefined;
    onSelect: (code: string) => void;
    onBack: () => void;
}

// `useSetModalOnBack` reads `ModalContext` set by `<Modal>` — must run inside
// the Modal's children tree, not on the same component that *renders* the
// Modal. Extracting the body fixes the missing back button.
export const CurrencyPickerContent: FC<CurrencyPickerContentProps> = ({
    allowed,
    selected,
    onSelect,
    onBack
}) => {
    const { t } = useTranslation();
    const [query, setQuery] = useState('');
    const { data: all } = useSupportedCurrencies();

    useSetModalOnBack(onBack);

    const items = useMemo<Currency[]>(() => {
        const allowedSet = new Set(allowed.map(c => c.toUpperCase()));
        const list = (all ?? []).filter(
            c => c.type === 'fiat' && allowedSet.has(c.code.toUpperCase())
        );
        const q = query.trim().toUpperCase();
        if (!q) return list;
        return list.filter(
            c => c.code.toUpperCase().includes(q) || c.name.toUpperCase().includes(q)
        );
    }, [all, allowed, query]);

    return (
        <div className="flex flex-col gap-4 pb-4">
            <SearchField
                value={query}
                onChange={setQuery}
                placeholder={t('currency_picker_search_placeholder')}
            />
            {items.length === 0 ? (
                <p className="py-8 text-center text-body2 text-textSecondary">
                    {t('currency_picker_no_results')}
                </p>
            ) : (
                <div className="overflow-hidden rounded-medium bg-backgroundContent">
                    {items.map((c, i) => (
                        <Fragment key={c.code}>
                            <CurrencyRow
                                currency={c}
                                selected={selected?.toUpperCase() === c.code.toUpperCase()}
                                onClick={() => onSelect(c.code)}
                                showDivider={i < items.length - 1}
                            />
                        </Fragment>
                    ))}
                </div>
            )}
        </div>
    );
};

export const CurrencyPickerScreen: FC<CurrencyPickerScreenProps> = ({
    isOpen,
    onClose,
    onBack,
    allowed,
    selected,
    onSelect
}) => {
    const { t } = useTranslation();
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            variant="content"
            topBarTitle={t('choose_currency_title')}
        >
            {isOpen && (
                <CurrencyPickerContent
                    allowed={allowed}
                    selected={selected}
                    onSelect={onSelect}
                    onBack={onBack}
                />
            )}
        </Modal>
    );
};
