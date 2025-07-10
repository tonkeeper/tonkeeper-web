import { ChangeEvent, Dispatch, FC, SetStateAction } from 'react';
import styled from 'styled-components';
import { IDisplayPlan } from '@tonkeeper/core/dist/entries/pro';

import { Body3 } from '../Text';
import { ProPlanLabel } from './ProPlanLabel';
import { useTranslation } from '../../hooks/translation';

interface IProps {
    productsForRender: IDisplayPlan[];
    selectedPlanId: string;
    onPlanIdSelection: Dispatch<SetStateAction<string>>;
    isLoading: boolean;
}

export const ProChooseSubscriptionPlan: FC<IProps> = props => {
    const { productsForRender, selectedPlanId, onPlanIdSelection, isLoading } = props;
    const { t } = useTranslation();

    const handlePlanSelection = (e: ChangeEvent<HTMLInputElement>) => {
        onPlanIdSelection(e.target.value);
    };

    return (
        <SubscriptionPlansBlock>
            <Subtitle>{t('choose_plan')}</Subtitle>
            <RadioGroup>
                {productsForRender.map(productProps => (
                    <ProPlanLabel
                        key={productProps.id}
                        isLoading={isLoading}
                        selectedPlanId={selectedPlanId}
                        onChange={handlePlanSelection}
                        {...productProps}
                    />
                ))}
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
