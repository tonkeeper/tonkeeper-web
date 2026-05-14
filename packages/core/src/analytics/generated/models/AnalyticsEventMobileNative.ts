/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Base event schema for mobile native apps using Aptabase SDK. SDK prefills all properties except firebase_user_id.
 */
export type AnalyticsEventMobileNative = {
    schema_version?: string;
    /**
     * Firebase user identifier, NOT NULL for iOS & Android, NULL for web-family
     */
    firebase_user_id?: string | null;
    /**
     * persistent user identifier, NOT NULL for web-family, NULL for iOS & android
     */
    uuid_persistent?: string | null;
    /**
     * Platform identifier
     */
    platform?: 'ios-native' | 'android-native' | 'web' | 'desktop' | 'extension' | 'twa';
    /**
     * App Store/Play Store country code in ISO 3166-1 alpha-2 format (2-letter uppercase)
     */
    store_country_code?: string | null;
    /**
     * Device Region country code in ISO 3166-1 alpha-2 format (2-letter uppercase)
     */
    device_country_code?: string | null;
    /**
     * Value from keys['region'] response from backend in ISO 3166-1 alpha-2 format (2-letter uppercase)
     */
    keys_country_code?: string | null;
    /**
     * A nested JSON containing ALL feature flag values in format
     * {"feature_1":"value", "feature_2":"value"}
     *
     */
    feature_flags?: string | null;
};

