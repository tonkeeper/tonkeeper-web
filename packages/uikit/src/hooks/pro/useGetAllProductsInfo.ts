import { useTranslation } from '../translation';
import { useToast } from '../useNotification';
import { useAppSdk } from '../appSdk';
import { useEffect, useState } from 'react';
import { IProductInfo, isIosStrategy } from '@tonkeeper/core/dist/entries/pro';

export const useGetAllProductsInfo = () => {
    const sdk = useAppSdk();
    const { t } = useTranslation();
    const toast = useToast();

    const [products, setProducts] = useState<IProductInfo[]>([]);

    useEffect(() => {
        if (isIosStrategy(sdk.subscriptionStrategy)) {
            sdk.subscriptionStrategy.getAllProductsInfo().then(productsInfo => {
                if (productsInfo.length > 0) {
                    setProducts(productsInfo);
                } else {
                    toast(t('pro_subscription_load_failed'));
                }
            });
        }
    }, []);

    return products;
};
