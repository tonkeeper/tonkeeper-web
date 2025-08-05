import { ChangeEvent, Dispatch, FC, ReactNode, SetStateAction } from 'react';
import styled from 'styled-components';
import { IDisplayPlan } from '@tonkeeper/core/dist/entries/pro';

import { Body3 } from '../Text';
import { useTranslation } from '../../hooks/translation';
import { ProPlanLabelTemporal } from './ProPlanLabelTemporal';

interface IProps {
    productsForRender: IDisplayPlan[];
    selectedPlanId: string;
    onPlanIdSelection: Dispatch<SetStateAction<string>>;
    isLoading: boolean;
    isEnterPromoVisible: boolean;
    onPromoInputShow: () => void;
    promoCodeNode: ReactNode;
}

export const ProChooseSubscriptionPlan: FC<IProps> = props => {
    const {
        productsForRender,
        selectedPlanId,
        onPlanIdSelection,
        isEnterPromoVisible,
        onPromoInputShow,
        promoCodeNode,
        isLoading
    } = props;
    const { t } = useTranslation();

    const handlePlanSelection = (e: ChangeEvent<HTMLInputElement>) => {
        onPlanIdSelection(e.target.value);
    };

    return (
        <SubscriptionPlansBlock>
            <Header>
                <Subtitle>{t('your_plan')}</Subtitle>
                {isEnterPromoVisible && (
                    <ButtonStyled as="button" type="button" onClick={onPromoInputShow}>
                        {t('enter_promo_code')}
                    </ButtonStyled>
                )}
            </Header>

            {promoCodeNode}

            <RadioGroup>
                {productsForRender.map(productProps => (
                    <ProPlanLabelTemporal
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

const ButtonStyled = styled(Body3)`
    height: auto;
    padding: 0 0 0 1rem;
    margin-left: auto;
    color: ${props => props.theme.textAccent};
    opacity: 1;
    transition: opacity 0.3s;

    &:hover {
        opacity: 0.7;
    }
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
