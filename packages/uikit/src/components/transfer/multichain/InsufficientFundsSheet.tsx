import { FC } from 'react';

import { Button } from '../../../primitives';
import { Modal, ModalFooter, ModalFooterPortal } from '../../../primitives/Modal';
import { useTranslation } from '../../../hooks/translation';
import IcExclamationmarkTriangle84 from '../../../icons/components/IcExclamationmarkTriangle84';

/**
 * Blocks a transfer whose chain balance can't cover the amount + network
 * fee: names the shortfall and offers to buy the missing asset through the
 * onramp. Mirrors the native apps' Insufficient Funds dialog.
 */
export const InsufficientFundsSheet: FC<{
    isOpen: boolean;
    onClose: () => void;
    /** Everything the transaction needs, formatted with symbol (e.g. "10.5 TON"). */
    required: string;
    /** The wallet's current balance, formatted with symbol. */
    balance: string;
    /** Symbol of the asset the Buy button tops up. */
    buySymbol: string;
    onBuy: () => void;
}> = ({ isOpen, onClose, required, balance, buySymbol, onBuy }) => {
    const { t } = useTranslation();

    return (
        <Modal isOpen={isOpen} onClose={onClose} mobileHeight="auto">
            <div className="flex flex-col items-center">
                <div className="pb-6">
                    <IcExclamationmarkTriangle84 className="size-[84px] text-iconSecondary" />
                </div>
                <div className="flex w-full flex-col items-center gap-1 px-8 pb-6 text-center">
                    <h2 className="text-h2 text-textPrimary">
                        {t('send_insufficient_funds_title')}
                    </h2>
                    <p className="whitespace-pre-line text-body1 text-textSecondary">
                        {t('send_insufficient_funds_description', { required, balance })}
                    </p>
                </div>
            </div>
            <ModalFooterPortal>
                <ModalFooter>
                    <Button variant="primaryBlue" size="large" fullWidth onClick={onBuy}>
                        {t('send_insufficient_funds_buy', { symbol: buySymbol })}
                    </Button>
                </ModalFooter>
            </ModalFooterPortal>
        </Modal>
    );
};
