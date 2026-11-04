/**
 * The origin the wallet moved to. Pinned into the bundle by
 * `vite.config.mts` from `MIGRATION_NEW_ORIGIN`, so a deploy can point a test
 * build at any host without the running page having any say in it.
 */
export const NEW_ORIGIN = __MIGRATION_NEW_ORIGIN__;

/** Where an encrypted handoff payload is allowed to land — the only such route. */
export const MIGRATE_PATH = '/migrate';

/** The destination as people read it on screen — the host, without the scheme. */
export const NEW_HOST = new URL(NEW_ORIGIN).host;
