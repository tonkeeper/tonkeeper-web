import { FC } from 'react';
import { useAppContext } from '../../hooks/appContext';
import { useTranslation } from '../../hooks/translation';
import { Button } from '../../primitives/Button';
import { ModalFooter, ModalFooterPortal } from '../../primitives/Modal';

/**
 * Which seed shape the imported phrase should be interpreted as.
 * `tonKeychain` is a MAM-style HD seed (TonKeychainRoot); `tonMnemonic`
 * is the legacy 24-word TON-only mnemonic; `bip39` is a standard BIP39
 * phrase (the multichain-eligible shape).
 */
export type ImportMnemonicType = 'tonKeychain' | 'tonMnemonic' | 'bip39';

/**
 * Prompt the user to pick which seed shape to import as, when the
 * entered phrase is valid for more than one (e.g. a 12-word BIP39 that's
 * also valid against the legacy TON 12-word path). Single-option cases
 * skip this step entirely in the caller.
 */
export const SelectMnemonicType: FC<{
    availableTypes: ImportMnemonicType[];
    onSelect: (type: ImportMnemonicType) => void;
    isLoading?: boolean;
}> = ({ availableTypes, onSelect, isLoading }) => {
    const { t } = useTranslation();
    // A BIP39 phrase imports as a multichain account, so the option names
    // the product the user gets rather than the seed standard.
    const { multichainEnabled } = useAppContext();
    const optionKey = (type: ImportMnemonicType) =>
        type === 'bip39' && multichainEnabled
            ? 'import_chose_mnemonic_option_multichain'
            : `import_chose_mnemonic_option_${type}`;

    return (
        <>
            <div className="mb-4 flex flex-col gap-1 text-center">
                <h2 className="text-h2 text-textPrimary">
                    {t('import_chose_mnemonic_type_title')}
                </h2>
                <p className="mx-auto block max-w-[450px] text-balance text-body1 text-textSecondary">
                    {t('import_chose_mnemonic_type_description')}
                </p>
            </div>
            <ModalFooterPortal>
                <ModalFooter>
                    {isLoading ? (
                        <Button variant="secondary" size="large" fullWidth loading />
                    ) : (
                        availableTypes.map(type => (
                            <Button
                                key={type}
                                variant="secondary"
                                size="large"
                                fullWidth
                                onClick={() => onSelect(type)}
                            >
                                {t(optionKey(type))}
                            </Button>
                        ))
                    )}
                </ModalFooter>
            </ModalFooterPortal>
        </>
    );
};
