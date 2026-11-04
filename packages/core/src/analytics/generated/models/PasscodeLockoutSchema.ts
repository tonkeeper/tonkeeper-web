/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Fired when repeated failed passcode attempts trigger a brute-force lockout that temporarily disables passcode input. The failure counter is global to the single app passcode, so a lockout closes every passcode prompt at once (app unlock, in-app confirmations, change-passcode). One event per lockout, emitted the moment the lockout starts.
 *
 */
export type PasscodeLockoutSchema = {
    eventName: string;
    /**
     * Which passcode prompt the failing attempt came from:
     * - `unlock` - app-unlock screen - `confirmation` - in-app action confirmation - `change` - the "enter current passcode" step of change-passcode
     *
     */
    from: 'unlock' | 'confirmation' | 'change';
    /**
     * Duration of the triggered lockout, in seconds. Escalates with each successive lockout.
     */
    lockout_seconds: number;
    /**
     * Cumulative failed attempts that triggered this lockout.
     */
    failed_attempts: number;
};

