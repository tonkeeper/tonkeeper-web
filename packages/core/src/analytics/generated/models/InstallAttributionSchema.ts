/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Sent at most once per install, when an attribution service (Branch or Linkrunner) matched the install to a click on its campaign link: on the first launch, or on the next one if the app closed before the service answered. When both services match the same install, only the first answer is sent. It tells a new user who came from a Branch or Linkrunner campaign link from one who did not: an install no service matched sends none (a store link with its own referrer tags shows up only in install_app.referrer), and a campaign click that opens an app already installed is deeplink_open, not this event. Not sent for an install older than seven days, which is a user updating into the first version with the attribution SDKs rather than a new install. Android only for now; iOS does not send it yet.
 * The campaign travels in the shared utm_* fields and in campaign_id / campaign_name. Branch keeps the utm_* of the clicked link in its click data, and when the link has none, its own ~channel / ~feature / ~campaign stand in for utm_source / utm_medium / utm_campaign. Linkrunner's install attribution carries no click utm_*: they are set only when the campaign deep link it resolves the install to has them, and the Linkrunner campaign is always in campaign_id / campaign_name. Group by utm_campaign and fall back to campaign_name for a campaign link created without utm.
 *
 */
export type InstallAttributionSchema = {
    eventName: string;
    /**
     * The attribution service that matched the install.
     */
    provider: 'branch' | 'linkrunner';
    /**
     * The service's id of what the user clicked — the Linkrunner campaign id, or the Branch link id (~id). NULL when the service did not return one.
     */
    campaign_id?: string | null;
    /**
     * The service's name of the campaign — the Linkrunner campaign name, or the Branch ~campaign. NULL when the service did not return one.
     */
    campaign_name?: string | null;
};

