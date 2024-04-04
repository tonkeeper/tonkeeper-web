import React, { FC, useId, useRef, useState } from 'react';
import { TonRecipient } from '@tonkeeper/core/dist/entries/send';
import styled, { css } from 'styled-components';
import { InputBlock, InputField } from '../../fields/Input';
import {
    Controller,
    FieldValues,
    FormProvider,
    useFieldArray,
    useForm,
    useFormContext
} from 'react-hook-form';
import { ControllerFieldState, ControllerRenderProps } from 'react-hook-form/dist/types/controller';
import { useRate } from '../../../state/rates';
import { Body2 } from '../../Text';
import {
    replaceTypedDecimalSeparator,
    seeIfValueValid
} from '../../transfer/amountView/AmountViewUI';
import { formatSendValue, isNumeric, removeGroupSeparator } from '@tonkeeper/core/dist/utils/send';
import { useAppContext } from '../../../hooks/appContext';
import BigNumber from 'bignumber.js';
import { formatter } from '../../../hooks/balance';
import { getDecimalSeparator } from '@tonkeeper/core/dist/utils/formatting';
import { useAsyncValidator } from '../../../hooks/useAsyncValidator';

export type MultiSendForm = {
    recipient: TonRecipient;
    value: string;
    comment: string;
}[];

const MultiSendTableGrid = styled.div`
    display: grid;
    grid-template-columns: 284px 1fr 296px 1fr 160px 1fr;
    gap: 0.25rem;

    > *:nth-child(3n + 1) {
        grid-column: 1 / 3;
    }

    > *:nth-child(3n + 2) {
        grid-column: 3 / 5;
    }

    > *:nth-child(3n) {
        grid-column: 5 / 7;
    }
`;

export const MultiSendTable: FC = () => {
    const methods = useForm({
        defaultValues: {
            row: [
                {
                    recipient: '',
                    value: '',
                    comment: ''
                },
                {
                    recipient: '',
                    value: '',
                    comment: ''
                },
                {
                    recipient: '',
                    value: '',
                    comment: ''
                }
            ]
        }
    });

    const { fields, append, remove } = useFieldArray({
        control: methods.control,
        name: 'row'
    });

    return (
        <FormProvider {...methods}>
            <MultiSendTableGrid>
                {fields.map((item, index) => (
                    <FormRow key={item.id} rowID={item.id} />
                ))}
            </MultiSendTableGrid>
        </FormProvider>
    );
};

const FormRow: FC<{ rowID: string }> = ({ rowID }) => {
    const { control } = useFormContext();
    return (
        <>
            <ReceiverInput rowID={rowID} />
            <Controller
                render={({ field, fieldState }) => (
                    <AmountInput
                        fieldState={fieldState}
                        field={field}
                        token={{ symbol: 'TON', address: 'TON', decimals: 9 }}
                    />
                )}
                name={`row.${rowID}.value`}
                control={control}
            />
            <CommentInput rowID={rowID} />
        </>
    );
};

const InputFieldStyled = styled(InputField)<{ color?: string }>`
    padding: 8px 0;
    height: 36px;
    box-sizing: content-box;
    font-family: ${p => p.theme.fontMono};

    transition: color 0.1s ease-in-out;

    ${p =>
        p.color &&
        css`
            color: ${p.theme[p.color]};
        `};
`;

const InputBlockStyled = styled(InputBlock)`
    min-height: unset;
    height: fit-content;
    padding: 0 12px;
    border-radius: ${p => p.theme.corner2xSmall};
`;
const ReceiverInput: FC<{ rowID: string }> = ({ rowID }) => {
    const methods = useFormContext();
    const [focus, setFocus] = useState(false);
    // const [validationState, validationProduct] = useAsyncValidator(
    //     methods,
    //     `row.${rowID}.recipient`,
    //     validator
    // );
    // const isValidating = selectedInput === 'manifest' && validationState !== 'succeed';

    return (
        <Controller
            render={({ field, fieldState }) => (
                <InputBlockStyled valid={!fieldState.invalid} focus={focus}>
                    <InputFieldStyled
                        {...field}
                        onFocus={() => setFocus(true)}
                        onBlur={() => setFocus(false)}
                        placeholder="Recipient"
                    />
                </InputBlockStyled>
            )}
            name={`row.${rowID}.recipient`}
            control={methods.control}
        ></Controller>
    );
};

const AmountInputFieldStyled = styled(InputFieldStyled)`
    text-align: right;
`;

const AmountInputFieldRight = styled(Body2)<{ color?: string }>`
    height: fit-content;
    align-self: center;

    transition: color 0.1s ease-in-out;

    ${p =>
        p.color &&
        css`
            color: ${p.theme[p.color]};
        `};
`;

const AmountInput: FC<{
    field: ControllerRenderProps<FieldValues, `row.${string}.value`>;
    token: {
        symbol: string;
        address: string;
        decimals: number;
    };
    fieldState: ControllerFieldState;
}> = ({ token, fieldState, field }) => {
    const { fiat } = useAppContext();
    const [focus, setFocus] = useState(false);
    const [currencyAmount, setCurrencyAmount] = useState({
        inFiat: false,
        tokenValue: '',
        fiatValue: '',
        inputValue: ''
    });
    const { data } = useRate(token.address);
    const price = data?.prices || 1;

    const onInput = (inFiat: boolean, newValue: string) => {
        const decimals = currencyAmount.inFiat ? 2 : token.decimals;

        let inputValue = replaceTypedDecimalSeparator(newValue);

        if (!inputValue) {
            setCurrencyAmount(s => ({
                ...s,
                inputValue,
                tokenValue: '',
                fiatValue: ''
            }));
            return;
        }

        if (!seeIfValueValid(inputValue, decimals)) {
            return;
        }

        let tokenValue = currencyAmount.tokenValue;
        let fiatValue = currencyAmount.fiatValue;

        if (isNumeric(inputValue) && !inputValue.endsWith(getDecimalSeparator())) {
            const formattedInput = formatSendValue(inputValue);
            const bnInput = new BigNumber(
                removeGroupSeparator(inputValue).replace(getDecimalSeparator(), '.')
            );
            if (inFiat) {
                tokenValue = formatter.format(bnInput.div(price), { decimals: token.decimals });

                fiatValue = formattedInput;
            } else {
                fiatValue = formatter.format(bnInput.multipliedBy(price), { decimals: 2 });

                tokenValue = formattedInput;
            }

            inputValue = formatSendValue(inputValue);
        }

        setCurrencyAmount({
            inFiat,
            inputValue,
            tokenValue,
            fiatValue
        });
    };

    const tokenId = useId();
    const fiatId = useId();
    const tokenRef = useRef<HTMLInputElement | null>(null);
    const fiatRef = useRef<HTMLInputElement | null>(null);

    const onFocus = (inFiat: boolean) => {
        setFocus(true);
        if (inFiat !== currencyAmount.inFiat) {
            setCurrencyAmount(s => ({
                ...s,
                inFiat,
                inputValue: inFiat ? s.fiatValue : s.tokenValue
            }));
        }
    };

    const onBlur = () => {
        const activeId = document.activeElement?.id;
        if (activeId !== tokenId && activeId !== fiatId) {
            setFocus(false);
            field.onBlur();
        }
    };

    return (
        <InputBlockStyled valid={!fieldState.invalid} focus={focus}>
            <AmountInputFieldStyled
                id={tokenId}
                onFocus={() => onFocus(false)}
                onBlur={onBlur}
                placeholder="0"
                onChange={e => onInput(false, e.target.value)}
                value={
                    currencyAmount.inFiat ? currencyAmount.tokenValue : currencyAmount.inputValue
                }
                color={currencyAmount.inFiat ? 'textTertiary' : 'textPrimary'}
                type="text"
                ref={tokenRef}
            />
            <AmountInputFieldRight
                color={
                    currencyAmount.inFiat || (!currencyAmount.inputValue && !focus)
                        ? 'textTertiary'
                        : 'textPrimary'
                }
                onClick={() => {
                    tokenRef.current?.focus();
                    onFocus(false);
                }}
            >
                {token.symbol}
            </AmountInputFieldRight>
            <AmountInputFieldStyled
                id={fiatId}
                onFocus={() => onFocus(true)}
                onBlur={onBlur}
                placeholder="0"
                onChange={e => onInput(true, e.target.value)}
                value={currencyAmount.inFiat ? currencyAmount.inputValue : currencyAmount.fiatValue}
                color={currencyAmount.inFiat ? 'textPrimary' : 'textTertiary'}
                type="text"
                autoComplete="off"
                ref={fiatRef}
            />
            <AmountInputFieldRight
                color={currencyAmount.inFiat ? 'textPrimary' : 'textTertiary'}
                onClick={() => {
                    fiatRef.current?.focus();
                    onFocus(true);
                }}
            >
                {fiat}
            </AmountInputFieldRight>
        </InputBlockStyled>
    );
};

const CommentInput: FC<{ rowID: string }> = ({ rowID }) => {
    const { control } = useFormContext();
    const [focus, setFocus] = useState(false);

    return (
        <Controller
            render={({ field, fieldState }) => (
                <InputBlockStyled valid={!fieldState.invalid} focus={focus}>
                    <InputFieldStyled
                        {...field}
                        onFocus={() => setFocus(true)}
                        onBlur={() => setFocus(false)}
                        placeholder="Comment"
                    />
                </InputBlockStyled>
            )}
            name={`row.${rowID}.comment`}
            control={control}
        />
    );
};
