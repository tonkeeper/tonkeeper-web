/**
 * The two origins the domain migration runs between, pinned into the bundle by
 * `vite.config.mts` from `MIGRATION_OLD_ORIGIN` / `MIGRATION_NEW_ORIGIN`. Build
 * time, not run time: a handoff can only ever involve the pair this build was
 * compiled for.
 */
export const OLD_ORIGIN = __MIGRATION_OLD_ORIGIN__;
export const NEW_ORIGIN = __MIGRATION_NEW_ORIGIN__;

/**
 * The only route an encrypted handoff payload is allowed to land on. Keeping it
 * fixed — no `?return`, no redirect off it — is what stops a crafted link from
 * carrying a payload anywhere else.
 */
export const MIGRATE_ROUTE = '/migrate';

/** The previous origin as people read it on screen — the host, without the scheme. */
export const OLD_HOST = new URL(OLD_ORIGIN).host;

/** Mirrors `MANUAL_RECOVERY_PATH` in the old origin's routing. */
export const OLD_ORIGIN_RECOVERY_URL = `${OLD_ORIGIN}/recover`;
