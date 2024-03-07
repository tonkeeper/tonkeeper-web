/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { InvoiceStatus } from './InvoiceStatus';
export type ProServiceInvoiceWebhook = {
    id: string;
    amount: string;
    description: string;
    status: InvoiceStatus;
    pay_to_address: string;
    paid_by_address?: string;
    date_change: number;
    date_expire: number;
    date_create: number;
};

