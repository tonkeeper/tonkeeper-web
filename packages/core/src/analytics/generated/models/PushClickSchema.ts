/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * User tapped a push notification to open the app (deep link). Mobile native clients merge `schema_version`, `firebase_user_id`, `platform`, and optional `store_country_code` / `device_country_code` from `AnalyticsEventMobileNative`. Android usually includes `push_id` and/or `deep_link`; iOS may omit them.
 */
export type PushClickSchema = {
    eventName: string;
    /**
     * Push template identifier when present. Observed values include
     * transaction-flow IDs such as `incoming_ton`,
     * `in_progress_send_ton_push_type`, `success_sent_ton_push_type`, and
     * campaign-style IDs such as `deposit_open`, `2025_trx_battery`. Other
     * values may appear.
     *
     */
    push_id?: string;
    /**
     * Deep link URL opened from the notification (e.g. tonkeeper://...).
     */
    deep_link?: string;
};

