import { FC, ReactNode } from 'react';

import { MultichainWalletAsset } from '@tonkeeper/core/dist/service/multichainWalletService';
import { formatAmount } from '@tonkeeper/core/dist/utils/numberFormat';

import { ModalFooter, ModalFooterPortal } from '../../../primitives/Modal';
import { useTranslation } from '../../../hooks/translation';
import { parseAssetIdHead } from '../../../pages/home/multichain/multichain-utils';
import Wallet16 from '../../../icons/components/Wallet16';
import IcExclamationmarkCircle16 from '../../../icons/components/IcExclamationmarkCircle16';
import { MultichainDetailCell } from '../../../pages/home/multichain/MultichainDetailCell';
import {
    AssetIcon,
    networkLabel,
    networkTokenStandardLabel,
    RecipientValue
} from './multichainSendShared';

export interface SendConfirmViewProps {
    asset: MultichainWalletAsset;
    accountName: string;
    toAddress: string;
    /** Name-service domain the address was resolved from; shown as its own recipient row. */
    toDomain?: string;
    amountDisplay: string;
    /** Fiat equivalent of the amount, pre-formatted. */
    amountFiat?: string;
    comment?: string;
    /**
     * Fee row label. "Network fee" when the method can be chosen, plain
     * "Fee" when the chain has only one — the native apps' wording.
     */
    feeLabel: string;
    /** Network-fee value node (see `NetworkFeeValue`). */
    fee: ReactNode;
    /** Fiat equivalent under the fee, pre-formatted; omitted in picker mode where the value line carries it. */
    feeSub?: string;
    /** Show the "couldn't calculate network fee" banner. */
    feeError?: boolean;
    /** Send-failure message rendered under the table. */
    sendError?: string;
    /** Confirm action slot — the confirm button, or the settled done / error row. */
    action: ReactNode;
}

/**
 * Presentational body of the multichain send confirm screen: the asset header,
 * the wallet / recipient / network / amount / fee / comment table, and the
 * action slot. Pure — every value is a prop, so it renders identically in a
 * screenshot as in the app. `SendConfirmScreen` wires the data hooks and the
 * `Modal` chrome around it.
 */
export const SendConfirmView: FC<SendConfirmViewProps> = ({
    asset,
    accountName,
    toAddress,
    toDomain,
    amountDisplay,
    amountFiat,
    comment,
    feeLabel,
    fee,
    feeSub,
    feeError,
    sendError,
    action
}) => {
    const { t } = useTranslation();
    const network = parseAssetIdHead(asset.assetId).network;

    return (
        <div className="flex min-h-full flex-col">
            {feeError && (
                <div className="mb-2 flex justify-center">
                    <span className="inline-flex items-center gap-2 rounded-full bg-backgroundContent px-4 py-2 text-label2 text-textPrimary shadow-lg">
                        <span className="text-accentRed">
                            <IcExclamationmarkCircle16 className="h-5 w-5" />
                        </span>
                        {t('send_fee_error_banner')}
                    </span>
                </div>
            )}
            <div className="flex flex-col items-center pb-8 pt-2">
                <div className="pb-5">
                    <AssetIcon asset={asset} size={96} />
                </div>
                <p className="text-body1 text-textSecondary">{t('send_confirm_action')}</p>
                <p className="text-h3 text-textPrimary">
                    {t('send_confirm_transfer')} {asset.symbol}{' '}
                    <span className="text-textTertiary">{networkLabel(network)}</span>
                </p>
            </div>

            <div className="rounded-medium bg-backgroundContent">
                <MultichainDetailCell
                    label={t('send_confirm_wallet')}
                    value={
                        <span className="inline-flex items-center justify-end gap-1.5">
                            <Wallet16 className="h-5 w-5" />
                            {accountName}
                        </span>
                    }
                />
                {toDomain && (
                    <MultichainDetailCell label={t('send_confirm_recipient')} value={toDomain} />
                )}
                <MultichainDetailCell
                    label={t('send_confirm_recipient')}
                    value={<RecipientValue address={toAddress} />}
                />
                <MultichainDetailCell
                    label={t('send_confirm_network')}
                    value={networkLabel(network)}
                    sub={networkTokenStandardLabel(network)}
                />
                <MultichainDetailCell
                    label={t('send_amount')}
                    value={formatAmount(amountDisplay, { unit: asset.symbol, exact: true })}
                    sub={amountFiat}
                />
                <MultichainDetailCell label={feeLabel} value={fee} sub={feeSub} last={!comment} />
                {comment && <MultichainDetailCell label={t('send_comment')} value={comment} last />}
            </div>

            {sendError && (
                <p className="px-1 pt-3 text-center text-body2 text-accentRed">{sendError}</p>
            )}

            <ModalFooterPortal>
                <ModalFooter>{action}</ModalFooter>
            </ModalFooterPortal>
        </div>
    );
};
