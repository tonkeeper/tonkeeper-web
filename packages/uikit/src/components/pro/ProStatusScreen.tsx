import { Label2 } from '../Text';
import { SlidersIcon } from '../Icon';
import { Button } from '../fields/Button';
import { ProActiveWallet } from './ProActiveWallet';
import { ProFeaturesList } from './ProFeaturesList';
import { useTranslation } from '../../hooks/translation';
import { ProStatusDetailsList } from './ProStatusDetailsList';
import { ProSubscriptionHeader } from './ProSubscriptionHeader';
import { ProScreenContentWrapper } from './ProScreenContentWrapper';

// TODO Implement different strategies rendering
export const ProStatusScreen = () => {
    const { t } = useTranslation();

    return (
        <ProScreenContentWrapper>
            <ProSubscriptionHeader
                titleKey="tonkeeper_pro_is_active"
                subtitleKey="subscription_is_linked"
            />
            <ProActiveWallet />
            <ProStatusDetailsList />
            <Button secondary fullWidth>
                <SlidersIcon />
                <Label2>{t('Manage')}</Label2>
            </Button>
            <ProFeaturesList />
        </ProScreenContentWrapper>
    );
};
