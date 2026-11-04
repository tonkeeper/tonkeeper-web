import { FC } from 'react';

import { Button } from '../../../../primitives';
import { Modal, ModalFooter, ModalFooterPortal } from '../../../../primitives/Modal';
import { useTranslation } from '../../../../hooks/translation';
import IcVerification84 from '../../../../icons/components/IcVerification84';

export type VerificationSheetVariant = 'verified' | 'unverified';

const UNVERIFIED_POINT_KEYS = [
    'wallet_asset_unverified_point_liquidity',
    'wallet_asset_unverified_point_unlisted',
    'wallet_asset_unverified_point_spam',
    'wallet_asset_unverified_point_scam'
];

/**
 * Verification explainer sheets. Verified (Figma 5404:191628): the seal
 * icon, title and disclaimer. Unverified (4185:49404): title, subtitle and
 * the bullet card listing why a token may look suspicious.
 */
export const MultichainAssetVerificationSheet: FC<{
    variant: VerificationSheetVariant;
    isOpen: boolean;
    onClose: () => void;
}> = ({ variant, isOpen, onClose }) => {
    const { t } = useTranslation();

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="flex flex-col items-center">
                {variant === 'verified' && (
                    <div className="pb-3">
                        {/* Two-tone icon: the pipeline collapses every paint to
                            currentColor, so the white checkmark stroke is
                            restored here on the second path. */}
                        <IcVerification84 className="size-[84px] text-textAccent [&>path:last-of-type]:stroke-constantWhite" />
                    </div>
                )}
                <div className="flex w-full flex-col items-center gap-1 px-8 pb-4 text-center">
                    <h2 className="text-h2 text-textPrimary">
                        {variant === 'verified'
                            ? t('wallet_asset_verified_token')
                            : t('wallet_asset_unverified_token')}
                    </h2>
                    {variant === 'verified' ? (
                        <p className="text-body1 text-textSecondary">
                            {t('wallet_asset_verified_description')}
                        </p>
                    ) : (
                        <p className="text-body2 text-textSecondary">
                            {t('wallet_asset_unverified_subtitle')}
                        </p>
                    )}
                </div>
                {variant === 'unverified' && (
                    <div className="w-full px-4 pb-4">
                        <ul className="flex list-disc flex-col gap-2 rounded-2xl bg-backgroundContent py-3 pl-8 pr-4 text-body2 text-textPrimary">
                            {UNVERIFIED_POINT_KEYS.map(key => (
                                <li key={key}>{t(key)}</li>
                            ))}
                        </ul>
                    </div>
                )}
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
