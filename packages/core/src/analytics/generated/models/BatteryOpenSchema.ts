/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * User opens the Battery purchase screen
 */
export type BatteryOpenSchema = {
    eventName: string;
    /**
     * Entry point where user came from
     */
    from: 'wallet' | 'settings' | 'tron_fees' | 'insufficient_funds' | 'deeplink' | 'send' | 'battery_banner';
};

