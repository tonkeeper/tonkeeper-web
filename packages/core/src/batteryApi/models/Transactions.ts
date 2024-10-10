/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type Transactions = {
    total_transactions: number;
    /**
     * if set, then there are more transactions to be loaded. Use this value as offset parameter in the next request.
     */
    next_offset?: number;
    transactions: Array<{
        id: string;
        /**
         * represents the amount of money paid by the user for this transaction.
         */
        paid_amount: string;
        status: 'pending' | 'completed' | 'failed';
        created_at: string;
    }>;
};

