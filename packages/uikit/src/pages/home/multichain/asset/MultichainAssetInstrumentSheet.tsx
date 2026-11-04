import { FC } from 'react';

import { Button } from '../../../../primitives';
import { Modal, ModalFooter, ModalFooterPortal } from '../../../../primitives/Modal';
import { useTranslation } from '../../../../hooks/translation';

export type InstrumentSheetVariant = 'stocks' | 'etfs';

const COPY: Record<
    InstrumentSheetVariant,
    { title: string; description: string; points: string[] }
> = {
    stocks: {
        title: 'wallet_asset_what_are_stocks',
        description: 'wallet_asset_tokenized_stocks_description',
        points: [
            'wallet_asset_tokenized_point_247',
            'wallet_asset_tokenized_point_onchain',
            'wallet_asset_tokenized_stocks_point_fractions'
        ]
    },
    etfs: {
        title: 'wallet_asset_what_are_etfs',
        description: 'wallet_asset_tokenized_etfs_description',
        points: [
            'wallet_asset_tokenized_point_247',
            'wallet_asset_tokenized_point_onchain',
            'wallet_asset_tokenized_etfs_point_fractions'
        ]
    }
};

/**
 * "What are Tokenized Stocks / ETFs?" explainer sheets (Figma 3341:123038 /
 * 3341:123144): title, intro and the bullet card, opened from the blue
 * instrument banner on tokenized-asset pages.
 */
export const MultichainAssetInstrumentSheet: FC<{
    variant: InstrumentSheetVariant;
    isOpen: boolean;
    onClose: () => void;
}> = ({ variant, isOpen, onClose }) => {
    const { t } = useTranslation();
    const copy = COPY[variant];

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="flex flex-col items-center">
                <div className="flex w-full flex-col items-center gap-1 px-8 pb-4 text-center">
                    <h2 className="text-h2 text-textPrimary">{t(copy.title)}</h2>
                    <p className="text-body2 text-textSecondary">{t(copy.description)}</p>
                </div>
                <div className="w-full px-4 pb-4">
                    <ul className="flex list-disc flex-col gap-2 rounded-2xl bg-backgroundContent py-3 pl-8 pr-4 text-body2 text-textPrimary">
                        {copy.points.map(key => (
                            <li key={key}>{t(key)}</li>
                        ))}
                    </ul>
                </div>
            </div>
            <ModalFooterPortal>
                <ModalFooter>
                    <Button variant="primaryBlue" size="large" fullWidth onClick={onClose}>
                        {t('multichain_collectibles_info_ok')}
                    </Button>
                </ModalFooter>
            </ModalFooterPortal>
        </Modal>
    );
};
