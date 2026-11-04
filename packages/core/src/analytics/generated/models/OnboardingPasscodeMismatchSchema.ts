/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * While setting up a passcode during onboarding, the user's confirmation entry did not match the first entry, so the passcode was not created and the user is asked to try again. This is a data-entry error inside the create-passcode step — unrelated to passcode_lockout, which is a brute-force lockout after repeated failed attempts on an existing passcode.
 *
 */
export type OnboardingPasscodeMismatchSchema = {
    eventName: string;
};

