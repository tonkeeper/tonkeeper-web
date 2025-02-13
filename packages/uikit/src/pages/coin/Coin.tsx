import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppRoute } from '../../libs/routes';
import { JettonContent } from './Jetton';
import { TonPage } from './Ton';
import { TRON_USDT_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { TronUsdtContent } from './TronUsdt';
import { seeIfValidTonAddress } from '@tonkeeper/core/dist/utils/common';
import { ExtraCurrencyPage } from './ExtraCurrency';

const CoinPage = () => {
    const navigate = useNavigate();
    const { name } = useParams();

    useEffect(() => {
        if (!name) {
            navigate(AppRoute.home);
        }
    }, [name]);

    if (!name) return <></>;

    if (name === TRON_USDT_ASSET.id) {
        return <TronUsdtContent />;
    } else if (name === 'ton') {
        return <TonPage />;
    } else {
        if (seeIfValidTonAddress(decodeURIComponent(name))) {
            return <JettonContent jettonAddress={decodeURIComponent(name)} />;
        } else {
            return <ExtraCurrencyPage name={name} />;
        }
    }
};

export default CoinPage;
