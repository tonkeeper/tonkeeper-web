import { BLOCKCHAIN_NAME, CryptoCurrency } from '@tonkeeper/core/dist/entries/crypto';

import { Account } from '@tonkeeper/core/dist/tonApiV2';
import { formatDecimals } from '@tonkeeper/core/dist/utils/balance';
import React, { FC, useMemo, useRef } from 'react';
import { InnerBody } from '../../components/Body';
import { CoinSkeletonPage } from '../../components/Skeleton';
import { SubHeader } from '../../components/SubHeader';
import { HomeActions } from '../../components/home/TonActions';
import { CoinInfo } from '../../components/jettons/Info';
import { useFormatBalance } from '../../hooks/balance';
import { useTranslation } from '../../hooks/translation';
import { useFormatFiat, useRate } from '../../state/rates';
import { useWalletAccountInfo } from '../../state/wallet';
import { MobileAssetHistory } from './Jetton';

const TonHeader: FC<{ info: Account }> = ({ info: { balance } }) => {
    const { t } = useTranslation();

    const amount = useMemo(() => formatDecimals(balance), [balance]);
    const total = useFormatBalance(amount);

    const { data } = useRate(CryptoCurrency.TON);
    const { fiatAmount } = useFormatFiat(data, amount);

    return (
        <CoinInfo
            amount={total}
            symbol="TON"
            price={fiatAmount}
            description={t('Ton_page_description')}
            image="https://wallet.tonkeeper.com/img/toncoin.svg"
        />
    );
};

export const TonPage = () => {
    const { t } = useTranslation();
    const ref = useRef<HTMLDivElement>(null);

    const { data: info } = useWalletAccountInfo();

    if (!info) {
        return <CoinSkeletonPage activity={4} />;
    }

    return (
        <>
            <SubHeader title={t('Toncoin')} />
            <InnerBody ref={ref}>
                <TonHeader info={info} />
                <HomeActions chain={BLOCKCHAIN_NAME.TON} />
                <MobileAssetHistory innerRef={ref} assetAddress={CryptoCurrency.TON} />
            </InnerBody>
        </>
    );
};
