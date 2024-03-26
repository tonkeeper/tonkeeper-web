import React, { useState } from 'react';
import styled from 'styled-components';
import { useAppSdk } from '../../hooks/appSdk';
import { useTranslation } from '../../hooks/translation';
import { useTonendpointBuyMethods } from '../../state/tonendpoint';
import { Body2, Label2 } from '../Text';
import { BuyNotification } from '../home/BuyAction';
import { Button } from '../fields/Button';
import { ArrowDownIcon, PlusIcon } from '../Icon';

const EmptyBody = styled.div`
    margin-top: -64px;
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
`;

const BodyText = styled(Body2)`
    color: ${props => props.theme.textSecondary};
    margin-bottom: 1.5rem;
`;

const ButtonRow = styled.div`
    display: flex;
    flex-direction: row;
    gap: 0.75rem;
`;

const ButtonStyled = styled(Button)`
    display: flex;
    gap: 6px;

    > svg {
        color: ${p => p.theme.buttonTertiaryForeground};
    }
`;

const EmptyActivity = () => {
    const { t } = useTranslation();
    const sdk = useAppSdk();

    const [openBuy, setOpenBuy] = useState(false);

    const { data: buy } = useTonendpointBuyMethods();

    return (
        <EmptyBody>
            <Label2>{t('activity_empty_transaction_title')}</Label2>
            <BodyText>{t('activity_empty_transaction_caption')}</BodyText>
            <ButtonRow>
                <ButtonStyled size="small" onClick={() => setOpenBuy(true)}>
                    <PlusIcon />
                    {t('exchange_title')}
                </ButtonStyled>
                <ButtonStyled
                    size="small"
                    onClick={() => sdk.uiEvents.emit('receive', { method: 'receive', params: {} })}
                >
                    <ArrowDownIcon />
                    {t('wallet_receive')}
                </ButtonStyled>
            </ButtonRow>
            <BuyNotification buy={buy} open={openBuy} handleClose={() => setOpenBuy(false)} />
        </EmptyBody>
    );
};

export default EmptyActivity;
