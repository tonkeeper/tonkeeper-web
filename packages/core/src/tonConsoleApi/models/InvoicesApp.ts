/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { InvoicesAppWebhooks } from './InvoicesAppWebhooks';
export type InvoicesApp = {
    id: number;
    project_id: number;
    name: string;
    description: string;
    recipient_address: string;
    webhooks?: InvoicesAppWebhooks;
    date_create: number;
};

