/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type DappSharingCopySchema = {
    eventName: string;
    /**
     * URL domain only, without private information
     */
    url: string;
    /**
     * Source of the sharing action
     */
    from: 'Share' | 'Copy link';
};

