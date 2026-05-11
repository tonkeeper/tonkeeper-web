/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Sent once on the very first app launch after installation. Implemented by storing a firstLaunchTS flag in local storage. iOS only - Android uses legacy 'firstOpen' event instead of install_app.
 */
export type InstallAppSchema = {
    eventName: string;
    /**
     * iOS only. The referring app or URL that brought the user to the app store (e.g., 'utm_source=newsletter').
     */
    referrer?: string;
    /**
     * iOS only. The deep link URL that was used to open the app (e.g., 'tonkeeper://wallet').
     */
    deeplink?: string;
    /**
     * Android only. The package name of the app store from which our application was installed. (e.g., 'com.android.vending')
     */
    installerStore?: string;
};

