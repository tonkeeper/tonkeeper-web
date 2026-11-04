import { FC } from 'react';

import { useTranslation } from '../../../../hooks/translation';
import IcExclamationmarkTriangle84 from '../../../../icons/components/IcExclamationmarkTriangle84';
import { cn } from '../../../../libs/css';
import { Button, Modal, ModalFooter, ModalFooterPortal } from '../../../../primitives';

type Risk = 'unknown' | 'mismatch' | 'scam';

const CONTENT: Record<Risk, { titleKey: string; textKey: string }> = {
    unknown: { titleKey: 'connect_risk_unknown_title', textKey: 'connect_risk_unknown_text' },
    mismatch: { titleKey: 'connect_risk_mismatch_title', textKey: 'connect_risk_mismatch_text' },
    scam: { titleKey: 'connect_risk_scam_title', textKey: 'connect_risk_scam_text' }
};

/**
 * Confirmation gate shown when the connect request failed domain
 * verification (Reown verify API / TonConnect manifest checks): the
 * user must explicitly accept the risk before the approval proceeds.
 */
export const ConnectRiskWarningSheet: FC<{
    isOpen: boolean;
    risk: Risk;
    onConnectAnyway: () => void;
    onCancel: () => void;
}> = ({ isOpen, risk, onConnectAnyway, onCancel }) => {
    const { t } = useTranslation();
    const { titleKey, textKey } = CONTENT[risk];
    const accentClass = risk === 'unknown' ? 'text-accentOrange' : 'text-accentRed';

    return (
        <Modal isOpen={isOpen} onClose={onCancel}>
            <div className="flex flex-col items-center pb-4 text-center">
                {/* TODO(icons): the unknown-domain mockup uses a circled
                    exclamation mark (ic-exclamationmark-circle-36) — see
                    MULTICHAIN_CHECKLIST.md "Icons pending export". */}
                <IcExclamationmarkTriangle84 className={cn('size-14', accentClass)} />
                <h3 className="pt-3 text-h3 text-textPrimary">{t(titleKey)}</h3>
                <p className="max-w-[280px] pt-1 text-body1 text-textSecondary">{t(textKey)}</p>
            </div>
            <ModalFooterPortal>
                <ModalFooter>
                    <Button
                        variant="secondary"
                        size="large"
                        fullWidth
                        onClick={onConnectAnyway}
                        className={accentClass}
                    >
                        {t('connect_anyway')}
                    </Button>
                    <Button variant="secondary" size="large" fullWidth onClick={onCancel}>
                        {t('cancel')}
                    </Button>
                </ModalFooter>
            </ModalFooterPortal>
        </Modal>
    );
};
