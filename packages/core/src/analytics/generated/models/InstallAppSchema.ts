/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Sent once on the very first app launch after installation. Implemented by storing a firstLaunchTS flag in local storage. Android fills referrer, deeplink and installerStore; iOS sends the event without them.
 */
export type InstallAppSchema = {
    eventName: string;
    /**
     * Android only. The raw Google Play install referrer string of the store link that brought the user (e.g., 'utm_source=google-play&utm_medium=organic'). An attribution service link puts its own click id here instead of the campaign tags; the campaign of such an install is install_attribution.
     */
    referrer?: string;
    /**
     * Android only. The link the first launch came with, if the app was first opened by a link (e.g., 'tonkeeper://wallet').
     */
    deeplink?: string;
    /**
     * Android only. The package name of the app store from which our application was installed. (e.g., 'com.android.vending')
     */
    installerStore?: string;
};

