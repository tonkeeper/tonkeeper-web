import { BLOCKCHAIN_NAME } from '@tonkeeper/core/dist/entries/crypto';
import { ExtraCurrency } from '@tonkeeper/core/dist/tonApiV2';
import { formatDecimals } from '@tonkeeper/core/dist/utils/balance';
import { FC, useMemo, useRef } from 'react';
import { InnerBody } from '../../components/Body';
import { CoinSkeletonPage } from '../../components/Skeleton';
import { SubHeader } from '../../components/SubHeader';
import { HomeActions } from '../../components/home/TonActions';
import { CoinInfo } from '../../components/jettons/Info';
import { useFormatBalance } from '../../hooks/balance';
import { useTranslation } from '../../hooks/translation';
import { useFormatFiat, useRate } from '../../state/rates';
import { useWalletAccountInfo } from '../../state/wallet';

const ItemHeader: FC<{ extra: ExtraCurrency }> = ({ extra }) => {
    const amount = useMemo(() => formatDecimals(extra.amount, extra.preview.decimals), [extra]);
    const total = useFormatBalance(amount);

    const { data } = useRate(extra.preview.symbol);
    const { fiatAmount } = useFormatFiat(data, amount);

    return (
        <CoinInfo
            amount={total}
            symbol={extra.preview.symbol}
            price={fiatAmount}
            image={extra.preview.image}
        />
    );
};

export const ExtraCurrencyPage: FC<{ name: string }> = ({ name }) => {
    const { t } = useTranslation();
    const ref = useRef<HTMLDivElement>(null);

    const { data: info } = useWalletAccountInfo();

    const extra = info?.extraBalance?.find(item => item.preview.symbol === name);

    if (!extra) {
        return <CoinSkeletonPage activity={4} />;
    }

    return (
        <>
            <SubHeader title={name} />
            <InnerBody ref={ref}>
                <ItemHeader extra={extra} />
                <HomeActions chain={BLOCKCHAIN_NAME.TON} />
                {/* TODO: Extra Currency History */}
            </InnerBody>
        </>
    );
};
