/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * A single page / slide within a Story was viewed. Fires once per page, so a single story_open is typically followed by several story_page_view events. NOTE: only story_id is carried — the page index / position within the story is NOT recorded, so individual pages cannot be distinguished from this event today (a candidate for adding a page_index property).
 *
 */
export type StoryPageViewSchema = {
    eventName: string;
    /**
     * Backend-defined identifier of the story (same open vocabulary as story_open).
     *
     */
    story_id: string;
};

