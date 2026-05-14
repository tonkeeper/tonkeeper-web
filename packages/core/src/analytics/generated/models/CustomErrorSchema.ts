/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * A custom error was captured by the app
 */
export type CustomErrorSchema = {
    eventName: string;
    /**
     * Error severity
     */
    severity: 'warning' | 'error' | 'fatal';
    /**
     * Sanitized human-readable error message without private data
     */
    error_message: string;
    /**
     * Optional error code if available
     */
    error_code?: string | null;
    /**
     * Optional. Additional metadata in JSON format that may be relevant for debugging,
     * following the same pattern as red operation metadata.
     *
     */
    other_metadata?: string;
};

