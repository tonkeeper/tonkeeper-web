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
            <Header>
                <Subtitle>{t('your_plan')}</Subtitle>
            </Header>

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

const Header = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
`;

const SubscriptionPlansBlock = styled.div`
    width: 100%;
`;

const RadioGroup = styled.fieldset`
    border: none;
    display: flex;
    gap: 8px;
    padding: 0;
    margin: 8px 0 0;
    min-width: 0;
`;

const Subtitle = styled(Body3)`
    max-width: 576px;
    display: block;
    color: ${p => p.theme.textSecondary};
    text-align: left;
`;
