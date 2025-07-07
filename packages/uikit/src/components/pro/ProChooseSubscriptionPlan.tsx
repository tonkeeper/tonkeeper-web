import { ChangeEvent, Dispatch, FC, SetStateAction, useEffect } from 'react';
import styled from 'styled-components';
import { IDisplayPlan, isCryptoStrategy } from '@tonkeeper/core/dist/entries/pro';

import { Body3 } from '../Text';
import { ProPlanLabel } from './ProPlanLabel';
import { useAppSdk } from '../../hooks/appSdk';
import { formatter } from '../../hooks/balance';
import { getSkeletonProducts } from '../../libs/pro';
import { useTranslation } from '../../hooks/translation';

interface IProps {
    productsForRender: ReturnType<typeof getSkeletonProducts> | IDisplayPlan[];
    selectedPlan: string;
    onPlanSelection: Dispatch<SetStateAction<string>>;
    isLoading: boolean;
}

export const ProChooseSubscriptionPlan: FC<IProps> = props => {
    const { productsForRender, selectedPlan, onPlanSelection, isLoading } = props;
    const sdk = useAppSdk();
    const { t } = useTranslation();

    useEffect(() => {
        if (selectedPlan || productsForRender?.length < 1) return;

        onPlanSelection(String(productsForRender[0].id));
    }, []);

    const handlePlanSelection = (e: ChangeEvent<HTMLInputElement>) => {
        onPlanSelection(e.target.value);
    };

    return (
        <SubscriptionPlansBlock>
            <Subtitle>{t('choose_plan')}</Subtitle>
            <RadioGroup>
                {productsForRender.map(productProps => {
                    const { id, displayName } = productProps;
                    const isCrypto =
                        isCryptoStrategy(sdk.subscriptionStrategy) &&
                        productProps.displayPrice !== null;

                    const displayPrice = isCrypto
                        ? formatter.fromNano(productProps.displayPrice)
                        : productProps.displayPrice;

                    return (
                        <ProPlanLabel
                            key={id}
                            id={String(id)}
                            isCrypto={isCrypto}
                            isLoading={isLoading}
                            displayName={displayName}
                            displayPrice={displayPrice}
                            selectedPlan={selectedPlan}
                            onChange={handlePlanSelection}
                        />
                    );
                })}
            </RadioGroup>
        </SubscriptionPlansBlock>
    );
};

const SubscriptionPlansBlock = styled.div`
    width: 100%;
`;

const RadioGroup = styled.fieldset`
    border: none;
    display: flex;
    gap: 8px;
    padding: 0;
    margin: 0;
    min-width: 0;
`;

const Subtitle = styled(Body3)`
    margin-bottom: 8px;
    max-width: 576px;
    display: block;
    color: ${p => p.theme.textSecondary};
    text-align: left;
`;
