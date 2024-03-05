/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type Deposit = {
    type: Deposit.type;
    deposit_address?: string;
    source_address?: string;
    income_date: number;
    amount: number;
};
export namespace Deposit {
    export enum type {
        PROMO_CODE = 'promo_code',
        DEPOSIT = 'deposit',
    }
}

