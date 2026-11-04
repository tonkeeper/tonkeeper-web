/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Base event schema for mobile native apps using Aptabase SDK. SDK prefills all properties except firebase_user_id and device_id.
 */
export type AnalyticsEventMobileNative = {
    schema_version?: string;
    /**
     * Firebase user identifier, NOT NULL for iOS & Android, NULL for web-family
     */
    firebase_user_id?: string | null;
    /**
     * Device identifier (`device_id`) from Total Auth:
     * https://app.notion.com/p/tonapps/Total-Auth-3a14714a32a680489006c933bc64f91b#ec55e8dfc9e14c44a8f9959377a791c0
     * Tonkeeper's new multichain analogue of the legacy
     * `firebase_user_id` that supports authentication and is intended
     * to supersede `firebase_user_id` over time.
     *
     */
    device_id?: string;
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
     * UTM standard `utm_source` — who sent the user: the referrer the link came from, e.g. `telegram`, `x`, `newsletter`, `partner_xyz`, `push`. https://en.wikipedia.org/wiki/UTM_parameters
     * Read from the link the user arrived by — a `tonkeeper://` / `ton://` app link, a universal `https://` one, the link a push carried, or the campaign link an attribution service (Branch, Linkrunner) matched the click or the install to (Android only for now; for a Branch click the tags come from its click data, and when the link has none, its ~channel / ~feature / ~campaign stand in) — and set on the entry event (`deeplink_open`, `push_click`, `install_attribution`) and on the events of the flow that link opened, for as long as that flow lasts: send, swap, staking, battery, deposit / withdraw, dapp and the resulting `transaction_sent`. NULL everywhere else — on an app opened directly or from an untagged link, and on everything the user does after stepping out of that flow. The client reports the entry, not an attribution window: crediting later activity to a campaign (an hour, a day, a session) is a decision made in analysis, over `deeplink_open` / `push_click`, not one baked into the events.
     *
     */
    utm_source?: string | null;
    /**
     * UTM standard `utm_medium` — what kind of channel carried the link: the channel type rather than the individual placement, e.g. `push`, `email`, `social`, `cpc`, `banner`, `referral`, `qr`. Same source and scope as `utm_source`. NULL when the link carried no `utm_medium` (for a Branch click, nor a `~feature`).
     *
     */
    utm_medium?: string | null;
    /**
     * UTM standard `utm_campaign` — which campaign the link belongs to, e.g. `battery_launch`, `summer_2026`, `ton_staking_promo`. This is the field campaign reporting groups by; `utm_source` / `utm_medium` say where the same campaign was placed. Same source and scope as `utm_source`. Marketing pushes set it to the same slug as the `analytics_label` of the push, which is what lets the FCM BigQuery export join to these events at campaign level. NULL when the link carried no `utm_campaign` (for a Branch click, nor a `~campaign`).
     *
     */
    utm_campaign?: string | null;
    /**
     * UTM standard `utm_term` — the paid keyword the click was bought on, e.g. `ton+wallet`. Set by ad platforms on paid search campaigns; NULL for our own links, which carry no keyword. Same source and scope as `utm_source`.
     *
     */
    utm_term?: string | null;
    /**
     * UTM standard `utm_content` — which creative or placement inside one campaign was clicked, e.g. `hero_button` vs `footer_link`. Used to tell A/B variants and several placements of the same campaign apart. Same source and scope as `utm_source`. NULL when the link carried no `utm_content`.
     *
     */
    utm_content?: string | null;
};

