/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Sent when user prompted for mobile store review
 */
export type InAppReviewSchema = {
    eventName: string;
    /**
     * Positive action triggered mobile store review request
     */
    action?: 'manual' | 'sent_transaction';
};

