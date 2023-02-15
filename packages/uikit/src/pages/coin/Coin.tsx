import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppRoute } from '../../libs/routes';
import { JettonContent } from './Jetton';
import { TonPage } from './Ton';

const CoinPage = () => {
  const navigate = useNavigate();
  const { name } = useParams();

  useEffect(() => {
    if (!name) {
      navigate(AppRoute.home);
    }
  }, [name]);

  if (!name) return <></>;

  if (name === 'ton') {
    return <TonPage />;
  } else {
    return <JettonContent jettonAddress={decodeURIComponent(name)} />;
  }
};

export default CoinPage;
