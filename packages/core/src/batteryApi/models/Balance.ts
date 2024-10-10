/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type Balance = {
    balance: string;
    /**
     * reserved amount in units (TON/USD)
     */
    reserved: string;
    units: Balance.units;
};
export namespace Balance {
    export enum units {
        USD = 'usd',
        TON = 'ton',
    }
}

