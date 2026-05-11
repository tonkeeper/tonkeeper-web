/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RampSourceSchema } from './RampSourceSchema';
/**
 * User entered the Withdraw screen
 */
export type WithdrawStartedSchema = {
    eventName: string;
    from: RampSourceSchema;
    /**
     * Slugs of the options shown to the user on this screen. Use standard identifier slugs from the backend response.
     *
     */
    available_options: Array<string>;
};

