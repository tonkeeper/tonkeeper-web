import React, { useEffect } from 'react';
import { AppRoute } from '../../libs/routes';
import { JettonContent } from './Jetton';
import { TonPage } from './Ton';
import { TRON_USDT_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { TronUsdtContent } from './TronUsdt';
import { useNavigate } from '../../hooks/useNavigate';
import { useParams } from '../../hooks/useParams';

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
        return <JettonContent jettonAddress={decodeURIComponent(name)} />;
    }
};

export default CoinPage;
