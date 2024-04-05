import React, { FC } from 'react';
import { TonRecipient } from '@tonkeeper/core/dist/entries/send';
import styled from 'styled-components';
import { Controller, FormProvider, useFieldArray, useForm, useFormContext } from 'react-hook-form';
import { AmountInput } from './AmountInput';
import { CommentInput } from './CommentInput';
import { ReceiverInput } from './ReceiverInput';

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
    const methods = useForm<{
        row: { receiver: TonRecipient | undefined; value: string; comment?: string }[];
    }>({
        defaultValues: {
            row: [
                {
                    receiver: undefined,
                    value: '',
                    comment: ''
                },
                {
                    receiver: undefined,
                    value: '',
                    comment: ''
                },
                {
                    receiver: undefined,
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
            <Controller
                render={({ field, fieldState }) => (
                    <ReceiverInput field={field} fieldState={fieldState} />
                )}
                name={`row.${rowID}.receiver`}
                control={control}
            />
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
