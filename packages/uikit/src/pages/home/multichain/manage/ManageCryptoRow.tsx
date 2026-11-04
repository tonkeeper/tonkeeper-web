import { FC, useMemo } from 'react';
import BigNumber from 'bignumber.js';

import {
    MultichainWalletAsset,
    isVerifiedMultichainAsset
} from '@tonkeeper/core/dist/service/multichainWalletService';

import { formatAmount } from '@tonkeeper/core/dist/utils/numberFormat';
import { ChainChip } from '../../../../primitives';
import { useAppContext } from '../../../../hooks/appContext';
import { formatFiatCurrency } from '../../../../hooks/balance';
import { isNativeRow, networkLabel, parseAssetIdHead } from '../multichain-utils';
import {
    TokenCell,
    TokenCellIcon,
    TokenTrustedBadge,
    TokenVerificationWarning
} from '../TokenCell';

const EyeVisible = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-textAccent">
        <path
            d="M2 12C2 12 5.5 5 12 5C18.5 5 22 12 22 12C22 12 18.5 19 12 19C5.5 19 2 12 2 12Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
        />
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
    </svg>
);

const EyeHidden = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-textTertiary">
        <path
            d="M2 12C2 12 5.5 5 12 5C13.7 5 15.2 5.5 16.5 6.2M22 12C22 12 18.5 19 12 19C10.3 19 8.8 18.5 7.5 17.8M14.5 9.5C15.5 10.4 15.5 13.6 14.5 14.5M9.5 14.5C8.5 13.6 8.5 10.4 9.5 9.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
        />
        <path d="M3 21L21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

export const ManageCryptoRow: FC<{
    asset: MultichainWalletAsset;
    visible: boolean;
    onToggle: () => void;
}> = ({ asset, visible, onToggle }) => {
    const { fiat } = useAppContext();
    const { network } = parseAssetIdHead(asset.assetId);
    const native = isNativeRow(asset.assetId);

    const human = useMemo(
        () => new BigNumber(asset.balance).shiftedBy(-asset.decimals),
        [asset.balance, asset.decimals]
    );
    const fiatBalance = useMemo(
        () => (asset.price ? human.multipliedBy(asset.price) : undefined),
        [human, asset.price]
    );

    const balanceLine = `${formatAmount(human)} ${asset.symbol}`;
    const subtitle = fiatBalance
        ? `${balanceLine} · ${formatFiatCurrency(fiat, fiatBalance)}`
        : balanceLine;

    return (
        <TokenCell
            onClick={onToggle}
            icon={<TokenCellIcon assetId={asset.assetId} image={asset.image} />}
            title={asset.symbol}
            titleExtras={
                <>
                    <TokenTrustedBadge verification={asset.verification} />
                    {!native && <ChainChip label={networkLabel(network)} />}
                </>
            }
            subtitle={
                isVerifiedMultichainAsset(asset.verification) ? (
                    subtitle
                ) : (
                    <TokenVerificationWarning verification={asset.verification} />
                )
            }
            accessory={
                <div className="flex h-6 w-6 shrink-0 items-center justify-center">
                    {visible ? <EyeVisible /> : <EyeHidden />}
                </div>
            }
        />
    );
};
