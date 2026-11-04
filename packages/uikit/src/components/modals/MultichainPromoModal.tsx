import { FC } from 'react';

import { useTranslation } from '../../hooks/translation';
import { Button } from '../../primitives';
import { Modal } from '../../primitives/Modal';
import { useMultichainPromo } from '../../state/multichain/useMultichainPromo';
import illustration from './assets/multichain-promo.jpg';

export const MultichainPromoModal: FC<{
    isOpen: boolean;
    onClose: () => void;
    onTry: () => void;
}> = ({ isOpen, onClose, onTry }) => {
    const { t } = useTranslation();

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            {/* Full-bleed from 16px below the card's top edge: the negative
                margins undo the body's side padding and the top inset it
                reserves for the floating close button. */}
            <img
                src={illustration}
                alt=""
                className="-mx-4 -mt-12 aspect-[520/304] w-[calc(100%+2rem)] max-w-none object-cover"
            />
            <div className="flex flex-col items-center gap-1 px-4 pb-4 text-center text-balance">
                <h2 className="text-h2 text-textPrimary">{t('multichain_promo_title')}</h2>
                <p className="text-body1 text-textSecondary">{t('multichain_promo_description')}</p>
            </div>
            <div className="flex flex-col gap-4 pt-4">
                <Button variant="primaryBlue" size="large" fullWidth onClick={onTry}>
                    {t('multichain_promo_try_button')}
                </Button>
                <Button variant="secondary" size="large" fullWidth onClick={onClose}>
                    {t('later')}
                </Button>
            </div>
        </Modal>
    );
};

/** Mounted in every shell's legacy-account branch; shows itself once when eligible. */
export const MultichainPromo: FC = () => {
    const { isOpen, dismiss, tryMultichain } = useMultichainPromo();
    return <MultichainPromoModal isOpen={isOpen} onClose={dismiss} onTry={tryMultichain} />;
};
