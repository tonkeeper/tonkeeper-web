import React, { FC, useLayoutEffect, useState } from 'react';
import { styled } from 'styled-components';
import { Body2, Body3, Label2 } from '../Text';
import { RadioFlatInput } from '../shared/RadioFlatInput';
import { Notification } from '../Notification';
import { InputBlock, InputField } from '../fields/Input';
import { BorderSmallResponsive } from '../shared/Styles';
import { Button } from '../fields/Button';
import { useMutateSwapOptions, useSwapOptions } from '../../state/swap/useSwapOptions';
import { SpinnerIcon } from '../Icon';

export const SwapSettingsNotification: FC<{
    isOpen: boolean;
    onClose: (confirmed?: boolean) => void;
}> = ({ isOpen, onClose }) => {
    return (
        <>
            <Notification isOpen={isOpen} handleClose={onClose} title="Settings">
                {() => <SwapSettingsNotificationContent onClose={onClose} />}
            </Notification>
        </>
    );
};

const SlippageToleranceTextWrapper = styled.div`
    padding-bottom: 10px;

    > * {
        display: block;
    }

    > ${Body3} {
        color: ${p => p.theme.textSecondary};
    }
`;

const SlippageOptionsContainer = styled.div`
    display: flex;
    gap: 0.5rem;
    margin-bottom: 2rem;
`;

const RadioFlatInputStyled = styled(RadioFlatInput)`
    width: 80px;
    height: 36px;
    flex-shrink: 0;
`;

const ButtonsContainer = styled.div`
    display: flex;
    gap: 0.5rem;
    > * {
        flex: 1;
    }
`;

const slippagePercentValues = [0.5, 1, 3];

const InputBlockStyled = styled(InputBlock)`
    min-height: unset;
    height: fit-content;
    padding: 0 12px;
    ${BorderSmallResponsive};
    display: flex;
    align-items: center;
`;

const InputFieldStyled = styled(InputField)`
    width: 100%;
    padding: 8px 0;
    height: 20px;
    box-sizing: content-box;
`;

const LoadingContainer = styled.div`
    height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
`;

const SwapSettingsNotificationContent: FC<{ onClose: () => void }> = ({ onClose }) => {
    const { data: swapOptions } = useSwapOptions();
    const [isTouched, setIsTouched] = useState(false);
    const { mutate } = useMutateSwapOptions();
    const [input, setInput] = useState('');
    const [inputFocus, setInputFocus] = useState(false);
    const [checkedRadioValue, setCheckedRadioValue] = useState<
        (typeof slippagePercentValues)[number] | undefined
    >();

    let isValid = !isTouched;
    if (isFinite(Number(input))) {
        const inputNum = Number(input);
        if (inputNum >= 0 && inputNum <= 100 && inputNum > 0.1) {
            isValid = true;
        }
    }

    if (checkedRadioValue) {
        isValid = true;
    }

    useLayoutEffect(() => {
        if (swapOptions?.slippagePercent) {
            if (slippagePercentValues.includes(swapOptions?.slippagePercent)) {
                setCheckedRadioValue(swapOptions?.slippagePercent);
            } else {
                setInput(swapOptions?.slippagePercent.toString());
                setInputFocus(true);
            }
        }
    }, [swapOptions?.slippagePercent]);

    useLayoutEffect(() => {
        if (checkedRadioValue) {
            setInputFocus(false);
        }
    }, [checkedRadioValue]);

    if (!swapOptions) {
        return (
            <LoadingContainer>
                <SpinnerIcon />
            </LoadingContainer>
        );
    }

    const onFocus = () => {
        setCheckedRadioValue(undefined);
        setInputFocus(true);
    };

    const onBlur = () => {
        setIsTouched(true);
        if (!isValid) {
            setInputFocus(false);
        }
    };

    const formValue = checkedRadioValue ?? Number(input);

    const onSave = () => {
        mutate({ slippagePercent: formValue });
        onClose?.();
    };

    return (
        <>
            <SlippageToleranceTextWrapper>
                <Label2>Slippage Tolerance</Label2>
                <Body3>The amount the price can change unfavorably before the trade reverts.</Body3>
            </SlippageToleranceTextWrapper>
            <SlippageOptionsContainer>
                {slippagePercentValues.map(value => (
                    <RadioFlatInputStyled
                        key={value}
                        name="slippage-percent"
                        value={value}
                        checked={checkedRadioValue === value}
                        onChange={() => setCheckedRadioValue(value)}
                    >
                        {value}%
                    </RadioFlatInputStyled>
                ))}
                <InputBlockStyled valid={isValid} focus={inputFocus}>
                    <InputFieldStyled
                        onChange={e => {
                            if (
                                /^[0-9]{1,2}([.,][0-9]{0,2})?$/.test(e.target.value) ||
                                !e.target.value
                            ) {
                                setIsTouched(true);
                                setInput(e.target.value.replace(',', '.'));
                            }
                        }}
                        onFocus={onFocus}
                        onBlur={onBlur}
                        value={input}
                        placeholder="Custom"
                        inputMode="decimal"
                    />
                    <Body2>%</Body2>
                </InputBlockStyled>
            </SlippageOptionsContainer>
            <ButtonsContainer>
                <Button secondary onClick={onClose}>
                    Cancel
                </Button>
                <Button
                    primary
                    disabled={
                        (!isValid && !checkedRadioValue) ||
                        formValue === swapOptions.slippagePercent
                    }
                    onClick={onSave}
                >
                    Save
                </Button>
            </ButtonsContainer>
        </>
    );
};
