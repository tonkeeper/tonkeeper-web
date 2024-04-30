import styled from 'styled-components';
import { Body2, Label1 } from '../../Text';
import { Notification } from '../../Notification';
import React, { FC, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { InputBlockStyled, InputFieldStyled } from './InputStyled';
import { Button } from '../../fields/Button';
import { useTranslation } from '../../../hooks/translation';

const NotificationBodyStyled = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0 1rem 1rem;
`;

const Body2Secondary = styled(Body2)`
    color: ${props => props.theme.textTertiary};
    margin-top: 4px;
    margin-bottom: 24px;
    max-width: 304px;
    text-align: center;
`;

const ButtonsContainer = styled.div`
    display: flex;
    margin-top: 2rem;
    gap: 0.5rem;
    width: 100%;

    > * {
        flex: 1;
    }
`;

export const EditListNotification: FC<{
    isOpen: boolean;
    onCancel: () => void;
    onSave: (name: string) => void;
    listName: string;
    rowsNumber: number;
    totalValue: string;
}> = ({ isOpen, onCancel, onSave, listName, rowsNumber, totalValue }) => {
    const { t } = useTranslation();
    const [inputValue, setInputValue] = useState(listName);

    useLayoutEffect(() => {
        if (isOpen) {
            setInputValue(listName);
        }
    }, [isOpen]);

    return (
        <Notification isOpen={isOpen} handleClose={onCancel}>
            {() => (
                <NotificationBodyStyled>
                    <Label1>
                        {t('multi_send_edit')}&nbsp;{listName}
                    </Label1>
                    <Body2Secondary>{t('multi_send_enter_a_name')}</Body2Secondary>
                    <NameInput
                        inputValue={inputValue}
                        rowsNumber={rowsNumber}
                        totalValue={totalValue}
                        setInputValue={setInputValue}
                    />
                    <ButtonsContainer>
                        <Button secondary onClick={onCancel}>
                            {t('cancel')}
                        </Button>
                        <Button
                            primary
                            disabled={!inputValue || inputValue === listName}
                            onClick={() => onSave(inputValue)}
                        >
                            {t('save')}
                        </Button>
                    </ButtonsContainer>
                </NotificationBodyStyled>
            )}
        </Notification>
    );
};

const Dot = styled(Body2)`
    color: ${props => props.theme.textTertiary};
`;

const InputRight = styled.div`
    color: ${props => props.theme.textSecondary};
    white-space: nowrap;
`;

const InputFieldRegular = styled(InputFieldStyled)`
    font-family: inherit;
`;

const NameInput: FC<{
    inputValue: string;
    rowsNumber: number;
    totalValue: string;
    setInputValue: (s: string) => void;
}> = ({ inputValue, setInputValue, rowsNumber, totalValue }) => {
    const { t } = useTranslation();
    const [focus, setFocus] = useState(true);
    const inputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    return (
        <InputBlockStyled valid={inputValue !== ''} focus={focus}>
            <InputFieldRegular
                ref={inputRef}
                onChange={e => {
                    setInputValue(e.target.value);
                }}
                onFocus={() => setFocus(true)}
                onBlur={() => setFocus(false)}
                value={inputValue}
                placeholder="List name"
            />
            <InputRight>
                <Body2>
                    {rowsNumber}&nbsp;{t('multi_send_wallets')}
                </Body2>
                &nbsp;
                <Dot>·</Dot>
                &nbsp;
                <Body2>{totalValue}</Body2>
            </InputRight>
        </InputBlockStyled>
    );
};
