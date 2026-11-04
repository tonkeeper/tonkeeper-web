import BigNumber from 'bignumber.js';
import { FC } from 'react';
import { FiatCurrencies } from '@tonkeeper/core/dist/entries/fiat';
import { ImportWalletKindPreview } from '@tonkeeper/core/dist/service/importWalletKindPreviewService';
import { ChooseWalletKind, WalletKind } from './ChooseWalletKind';

export interface PreviewFixture {
    fiatTotal: number;
    nftsCount?: number;
}

const toPreview = ({ fiatTotal, nftsCount = 0 }: PreviewFixture): ImportWalletKindPreview => ({
    fiatTotal: new BigNumber(fiatTotal),
    nftsCount,
    hasActivity: fiatTotal > 0 || nftsCount > 0
});

/**
 * CT mount wrapper for {@link ChooseWalletKind}. Mount props cross the
 * test-runner/browser boundary as plain JSON, which strips a BigNumber down
 * to its own fields, so the previews are built from plain numbers here, in
 * the browser.
 */
export const ChooseWalletKindHarness: FC<{
    ton: PreviewFixture;
    multichain: PreviewFixture;
    onContinue?: (kind: WalletKind) => void;
    isLoading?: boolean;
}> = ({ ton, multichain, onContinue = () => {}, isLoading }) => (
    <ChooseWalletKind
        ton={toPreview(ton)}
        multichain={toPreview(multichain)}
        fiat={FiatCurrencies.USD}
        onContinue={onContinue}
        isLoading={isLoading}
    />
);
