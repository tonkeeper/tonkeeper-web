/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * A call-to-action button on a Story page was tapped. Only fires for stories that have CTA buttons (a subset of all stories).
 *
 */
export type StoryClickSchema = {
    eventName: string;
    /**
     * Backend-defined identifier of the story (same open vocabulary as story_open).
     *
     */
    story_id: string;
    /**
     * What kind of target the button opens:
     *
     * - deeplink: an in-app tonkeeper:// deep link (dominant)
     * - link: an external https:// web link
     *
     */
    button_type: 'deeplink' | 'link';
    /**
     * The target the button points to. A tonkeeper:// deep link when button_type=deeplink (e.g. tonkeeper://deposit, tonkeeper://staking, tonkeeper://swap, tonkeeper://withdraw, tonkeeper://backup, tonkeeper://battery, tonkeeper://browser), or an https:// URL when button_type=link (e.g. a t.me or help-docs link).
     *
     */
    button_payload: string;
    /**
     * The button's display label as shown to the user. Localized free text that varies by language (e.g. "Stake TON" / "Стейкать TON", "Add Funds" / "Пополнить баланс") — not a stable identifier; analyse on button_payload / button_type instead.
     *
     */
    button_title: string;
};

