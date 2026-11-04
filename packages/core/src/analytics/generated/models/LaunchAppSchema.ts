/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Sent every time the user opens the app.
 */
export type LaunchAppSchema = {
    eventName: string;
    /**
     * The app theme selected by the user at launch.
     */
    theme?: 'dark' | 'light' | 'deep_blue' | 'system_light' | 'system_dark';
    /**
     * The app icon selected by the user at launch.
     */
    app_icon?: 'default' | 'accent' | 'dark' | 'light';
    /**
     * Number of wallets currently added in the app.
     */
    wallets_count?: number;
    /**
     * Push opt-in status at launch, read before anything can prompt for it: `granted` — a notification can be delivered, `denied` — refused or switched off, `not_requested` — the user has not been asked yet, `unsupported` — the surface cannot receive push at all.
     *
     */
    push_permission?: 'granted' | 'denied' | 'not_requested' | 'unsupported';
};

