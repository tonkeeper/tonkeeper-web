/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CryptoCurrency } from './CryptoCurrency';
import type { InvoiceStatus } from './InvoiceStatus';
export type InvoicesInvoice = {
    id: string;
    amount: string;
    overpayment?: string;
    description: string;
    status: InvoiceStatus;
    pay_to_address: string;
    paid_by_address?: string;
    payment_link: string;
    info?: any;
    date_change: number;
    date_expire: number;
    date_create: number;
    currency: CryptoCurrency;
};

