/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MigrationSourceSchema } from './MigrationSourceSchema';
/**
 * User entered the migration flow
 */
export type MigrationStartSchema = {
    eventName: string;
    from: MigrationSourceSchema;
};

