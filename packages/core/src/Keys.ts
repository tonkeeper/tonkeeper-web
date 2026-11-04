export enum AppKey {
    /**
     * @deprecated
     */
    DEPRECATED_ACCOUNT = 'account',
    /**
     * @deprecated
     */
    DEPRECATED_WALLET = 'wallet',
    /**
     * @deprecated
     */
    DEPRECATED_MNEMONIC = 'mnemonic',

    ACCOUNTS = 'accounts',
    ACTIVE_ACCOUNT_ID = 'active_account_id',
    WALLET_CONFIG = 'wallet_config',
    ACCOUNT_CONFIG = 'account_config',
    GLOBAL_PREFERENCES_CONFIG = 'global_preferences_config',
    MULTISIG_VIEWED_ORDERS = 'viewed_multisig_orders',
    META_ENCRYPTION_MAP = 'meta_encryption_map',

    // Per-account chain-level preferences for multichain accounts
    // (visible-chains, hide-lists, etc.). Reserved here; schema lands
    // when the chain-preferences UI ships.
    MULTICHAIN_CHAIN_CONFIG = 'multichain_chain_config',

    // Legacy-to-multichain asset migration: which multichain accounts
    // have opened the flow (drives the settings-row dot).
    MULTICHAIN_MIGRATION_STATE = 'multichain_migration_state',

    // Multichain accounts whose owner pressed "Skip" on the home
    // "Finish setting up" section, so it stays hidden for them.
    MULTICHAIN_FINISH_SETUP_STATE = 'multichain_finish_setup_state',

    // Show budget of the "Add a wallet for new blockchains" tooltip
    // offered to installs without a multichain account: total shows so
    // far and the day of the last one (at most once a day, three in all).
    MULTICHAIN_ADD_WALLET_TOOLTIP_STATE = 'multichain_add_wallet_tooltip_state',

    // One-shot flag: the "multichain wallets are here" promo has been shown
    // to this install, which held only legacy TON wallets at the time.
    MULTICHAIN_PROMO_SHOWN = 'multichain_promo_shown',

    // Per-wallet asset-visibility choices the backend hasn't acknowledged
    // yet, as a `{[walletId]: {[assetId]: visible}}` map so a single key
    // serves every multichain wallet on the device. The backend's
    // `is_hidden` is the source of truth; entries live here only between
    // the user's toggle and a successful POST /assets, which keeps the UI
    // instant without shadowing the server's own defaults.
    MULTICHAIN_ASSET_VISIBILITY = 'multichain_asset_visibility',

    // Per-wallet ordered list of favorite trading assets, stored as a
    // `{[walletId]: stub[]}` map (stub = id + display fields captured at
    // add-time so the Trade tab renders instantly; live prices hydrate
    // from the trading API). Local-only, matching iOS and Android.
    MULTICHAIN_FAVORITE_ASSETS = 'multichain_favorite_assets',

    // One-shot flag: the "NEW — Add to favorites" tooltip on the asset
    // page has been shown and dismissed on this device.
    MULTICHAIN_FAVORITES_HINT_DISMISSED = 'multichain_favorites_hint_dismissed',

    // Per-account saved send-flow recipients of a multichain account,
    // suffixed with the account id. Deliberately not `FAVOURITES`: a
    // mainnet account id *is* its TON public key, so that key is already
    // taken by the legacy per-publicKey `FavoriteSuggestion[]`, which has
    // an incompatible shape.
    MULTICHAIN_FAVORITE_RECIPIENTS = 'multichain_favorite_recipients',

    // Per-install ECDSA P-256 device certificate for the multichain
    // backend's device-auth scheme: `{privateKey: pkcs8 base64,
    // publicKey: compressed point hex}`. Proves ownership of the
    // device_id; losing it means re-registering.
    MULTICHAIN_DEVICE_CERTIFICATE = 'multichain_device_certificate',

    // The device-auth session's durable half: `{deviceId, refreshToken}`.
    // The refresh token is single-use and rotates on every renewal; the
    // short-lived device JWT itself is memory-only by contract.
    MULTICHAIN_DEVICE_TOKENS = 'multichain_device_tokens',

    // Per-wallet registration state against the multichain backend:
    // `{[walletId]: {accounts, registered}}`. The accounts list is kept
    // so a failed registration can be retried without the mnemonic —
    // the proof re-signs with the account's stored wallet auth key.
    MULTICHAIN_WALLET_REGISTRATION = 'multichain_wallet_registration',

    // Last fetched `GET /api/v1/nodes` manifest with its ETag, so boot
    // can serve node origins without waiting on the network and the next
    // refresh can answer 304.
    MULTICHAIN_NODES_MANIFEST = 'multichain_nodes_manifest',

    // Per-account safe-mode choice as a `{[accountId]: stored state}` map.
    // An account with no entry follows the server's `safe_mode_enabled`
    // config flag, mirroring Android's per-wallet safe-mode keys.
    MULTICHAIN_SAFE_MODE = 'multichain_safe_mode',

    // Per-install dust-filter toggles ("hide tiny transfers" / "hide assets
    // with no cost"), both default off. Global rather than per-account,
    // mirroring both natives' app-level settings.
    MULTICHAIN_DUST_FILTERS = 'multichain_dust_filters',

    // Set once this origin has asked the origin the wallet moved from
    // whether it still holds wallets. Only the "there is nothing here"
    // answer sets it, so an interrupted handoff stays retryable.
    MIGRATION_OLD_ORIGIN_CHECKED = 'migration_old_origin_checked',

    THEME = 'theme',
    UI_PREFERENCES = 'ui_preferences',
    MULTI_SEND_LISTS = 'multi_send_lists',
    FIAT = 'fiat',
    FIAT_SYMBOL = 'fiat_symbol',
    LANGUAGE = 'language',
    DEV_SETTINGS = 'dev_settings',

    DEPRECATED_GLOBAL_AUTH_STATE = 'password',
    LOCK = 'lock',
    TOUCH_ID = 'touch_id',
    COUNTRY = 'country',

    FAVOURITES = 'favourites',
    CONNECTIONS = 'connections',

    // The WalletConnect SDK's whole key/value store as one JSON map
    // (sessions, pairings, relay bookkeeping) — see WalletConnectStorage.
    WALLET_CONNECT = 'wallet_connect',

    // Per-session metadata the SDK doesn't track: `{[topic]: {accountId,
    // connectedAt, source}}`, written when a session is approved.
    WALLET_CONNECT_META = 'wallet_connect_meta',

    // Injected EVM (window.ethereum) connections in the extension, keyed by
    // dApp origin: `{[origin]: {accountId, address, chainId}}`.
    EVM_INJECTED_CONNECTIONS = 'evm_injected_connections',
    SUBSCRIPTION = 'subscription',
    HIDDEN_SUGGESTIONS = 'hidden_suggestions',
    SYNC_DATE = 'sync_date',

    LAST_HTTP_EVENT_ID = 'last_event_id',
    USER_ID = 'user_id',

    PRO_BACKUP = 'pro_backup',
    PRO_USED_TRIAL = 'pro_used_trial',
    PRO_AUTH_TOKEN = 'pro_auth_token',
    PRO_PENDING_SUBSCRIPTION = 'pro_pending_subscription',
    PRO_CANCELLING_SUBSCRIPTION = 'pro_cancelling_subscription',
    PRO_ENDING_NOTIFICATION_STATE = 'pro_ending_notification_state',
    PRO_BALANCE_NOTIFICATION_STATE = 'pro_balance_notification_state',

    IS_DEV_MENU_VISIBLE = 'is_dev_menu_visible',
    IS_DEV_ENVIRONMENT_ALLOWED = 'is_dev_environment_allowed',

    SIGNER_MESSAGE = 'signer_message',
    SWAP_CUSTOM_ASSETS = 'swap_custom_assets',
    SWAP_OPTIONS = 'swap_options',

    BATTERY_AUTH_TOKEN = 'battery_auth_token',

    TWO_FA_WALLET_CONFIG = 'two_fa_wallet_config',

    NOTIFICATIONS = 'notifications',

    KEYCHAIN_SETTINGS = 'keychain_settings',

    // Per-prefix index of keys written through IKeychainService.setValue.
    // Lets `deletePrefix(prefix)` enumerate without needing a platform-
    // specific listAllKeys() API on the secure store.
    KEYCHAIN_PREFIX_INDEX = 'keychain_prefix_index',

    ENABLE_REVIEWER_MODE = 'ENABLE_REVIEWER_MODE',

    BROWSER_TABS = 'browser_tabs',

    EXTENSION_POPUP_ID = 'extension_popup_id'
}
