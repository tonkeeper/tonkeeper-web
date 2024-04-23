import React, { FC } from 'react';
import { TonRecipient } from '@tonkeeper/core/dist/entries/send';
import styled, { css } from 'styled-components';
import { Controller, FormProvider, useFieldArray, useForm, useFormContext } from 'react-hook-form';
import { AmountInput } from './AmountInput';
import { CommentInput } from './CommentInput';
import { ReceiverInput } from './ReceiverInput';
import { Button } from '../../fields/Button';
import { Body3 } from '../../Text';
import { IconButton } from '../../fields/IconButton';
import { CloseIcon } from '../../Icon';
import { BLOCKCHAIN_NAME } from '@tonkeeper/core/dist/entries/crypto';
import { ControllerRenderProps } from 'react-hook-form/dist/types/controller';
import BigNumber from 'bignumber.js';
import { formatter } from '../../../hooks/balance';
import { TonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { useRate } from '../../../state/rates';
import { useAppContext } from '../../../hooks/appContext';
import { useWalletTotalBalance } from '../../../state/wallet';
import { SkeletonText } from '../../shared/Skeleton';

export type MultiSendForm = {
    row: {
        receiver: TonRecipient | undefined;
        amount: { inFiat?: boolean; value?: string } | undefined;
        comment?: string;
    }[];
};

const MultiSendTableGrid = styled.div`
    display: grid;
    grid-template-columns: 284px 1fr 296px 1fr 160px 1fr 28px;
    gap: 0.25rem;
    align-items: center;
    margin-bottom: 0.25rem;

    > *:nth-child(4n + 1) {
        grid-column: 1 / 3;
    }

    > *:nth-child(4n + 2) {
        grid-column: 3 / 5;
    }

    > *:nth-child(4n + 3) {
        grid-column: 5 / 7;
    }
`;

const TableFormWrapper = styled.form`
    display: flex;
    flex-direction: column;
    height: 100%;
`;

const MultiSendFooter = styled.div`
    padding: 1rem;
    position: sticky;
    bottom: 0;
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    align-items: center;
    background-color: ${p => p.theme.backgroundPage};
`;

const MultiSendFooterTextWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
    > ${Body3} {
        text-align: right;
        display: flex;
        font-family: ${p => p.theme.fontMono};
        color: ${p => p.theme.textSecondary};
    }
`;

const Body3Error = styled(Body3)`
    color: ${p => p.theme.accentRed} !important;
`;

const Shadow = styled.div`
    top: -1rem;
    background: ${props => props.theme.gradientBackgroundBottom};
    position: absolute;
    height: 1rem;
    margin: 0 -1rem;
    width: calc(100% + 2rem);
`;

const Spacer = styled.div`
    flex: 1;
`;

const IconButtonStyled = styled(IconButton)<{ hide?: boolean }>`
    padding: 10px 12px;
    ${props =>
        props.hide &&
        css`
            display: none;
        `}
`;

const ListActionsButtons = styled.div`
    display: flex;
    gap: 0.5rem;
    margin-right: auto;
`;

export const MultiSendTable: FC<{ className?: string; asset: TonAsset }> = ({
    className,
    asset
}) => {
    const methods = useForm<MultiSendForm>({
        defaultValues: {
            row: [
                {
                    receiver: {
                        blockchain: BLOCKCHAIN_NAME.TON,
                        dns: {
                            address: 'subbotin.ton'
                        }
                    },
                    amount: { inFiat: true, value: '10' },
                    comment: ''
                },
                {
                    receiver: undefined,
                    amount: { inFiat: false, value: '2' },
                    comment: ''
                },
                {
                    receiver: undefined,
                    amount: undefined,
                    comment: ''
                }
            ]
        }
    });

    const { fields, append, remove } = useFieldArray({
        control: methods.control,
        name: 'row'
    });

    const onSubmit = (d: unknown) => {
        console.log(d);
    };

    const rowsValue = methods.watch('row');
    const { data: rate } = useRate(
        typeof asset.address === 'string' ? asset.address : asset.address.toRawString()
    );
    const willBeSentBN = rowsValue.reduce((acc, item) => {
        if (!item.amount?.value) {
            return acc;
        }

        let inToken = new BigNumber(item.amount.value);
        if (item.amount.inFiat) {
            inToken = rate?.prices
                ? new BigNumber(item.amount.value).div(rate.prices)
                : new BigNumber(0);
        }

        return acc?.plus(new BigNumber(inToken));
    }, new BigNumber(0));

    const willBeSent =
        formatter.format(willBeSentBN, {
            decimals: asset.decimals
        }) +
        ' ' +
        asset.symbol;
    const { fiat } = useAppContext();
    const { data: balance } = useWalletTotalBalance(fiat);
    const remainingBalanceBN = balance?.minus(willBeSentBN);
    const remainingBalance =
        formatter.format(remainingBalanceBN || new BigNumber(0), {
            decimals: asset.decimals
        }) +
        ' ' +
        asset.symbol;
    const balancesLoading = !balance || !rate;

    return (
        <FormProvider {...methods}>
            <TableFormWrapper onSubmit={methods.handleSubmit(onSubmit)} className={className}>
                <MultiSendTableGrid>
                    {fields.map((item, index) => (
                        <>
                            <FormRow key={item.id} index={index} />
                            <IconButtonStyled
                                type="button"
                                transparent
                                onClick={() => remove(index)}
                                hide={fields.length === 1}
                            >
                                <CloseIcon />
                            </IconButtonStyled>
                        </>
                    ))}
                </MultiSendTableGrid>
                <Button
                    fitContent
                    secondary
                    type="button"
                    onClick={() =>
                        append({
                            receiver: undefined,
                            amount: undefined,
                            comment: ''
                        })
                    }
                >
                    Add More
                </Button>
                <Spacer />
                <MultiSendFooter>
                    <Shadow />
                    <ListActionsButtons>
                        <Button secondary type="button">
                            Edit Name
                        </Button>
                        <Button secondary type="button">
                            Delete List
                        </Button>
                    </ListActionsButtons>
                    <MultiSendFooterTextWrapper>
                        <Body3>
                            Will be sent:&nbsp;
                            {balancesLoading ? <SkeletonText width="75px" /> : willBeSent}
                        </Body3>
                        {balancesLoading || remainingBalanceBN?.gt(0) ? (
                            <Body3>
                                Remaining:&nbsp;
                                {balancesLoading ? <SkeletonText width="75px" /> : remainingBalance}
                            </Body3>
                        ) : (
                            <Body3Error>Insufficient balance</Body3Error>
                        )}
                    </MultiSendFooterTextWrapper>
                    <Button type="submit" primary disabled={remainingBalanceBN?.lt(0)}>
                        Continue
                    </Button>
                </MultiSendFooter>
            </TableFormWrapper>
        </FormProvider>
    );
};

const FormRow: FC<{ index: number }> = ({ index }) => {
    const { control } = useFormContext();
    return (
        <>
            <Controller
                rules={{
                    required: 'Required'
                }}
                render={({ field, fieldState }) => (
                    <ReceiverInput
                        field={
                            field as unknown as ControllerRenderProps<
                                {
                                    row: {
                                        receiver: TonRecipient | undefined;
                                    }[];
                                },
                                `row.${number}.receiver`
                            >
                        }
                        fieldState={fieldState}
                    />
                )}
                name={`row.${index}.receiver`}
                control={control}
            />
            <Controller
                rules={{
                    required: 'Required'
                }}
                render={({ field, fieldState }) => (
                    <AmountInput
                        fieldState={fieldState}
                        field={
                            field as unknown as ControllerRenderProps<
                                {
                                    row: {
                                        amount: { inFiat: boolean; value: string } | undefined;
                                    }[];
                                },
                                `row.${number}.amount`
                            >
                        }
                        token={{ symbol: 'TON', address: 'TON', decimals: 9 }}
                    />
                )}
                name={`row.${index}.amount`}
                control={control}
            />
            <CommentInput index={index} />
        </>
    );
};
