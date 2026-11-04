/**
 * Builds the `localStorage` a legacy TON wallet occupies, for exercising the
 * domain handoff without setting a wallet up by hand on the old origin.
 *
 * It writes nothing itself: `localStorage` belongs to an origin, and the only
 * way in is to run JS there. So it prints a paste-ready snippet on stdout and
 * the throwaway credentials on stderr —
 *
 *     node packages/core/scripts/seedLegacyStorage.mjs | pbcopy
 *
 * — then paste that into the devtools console on the old origin, whether that
 * is a local dev server or a deployed preview, and the page reloads seeded.
 *
 * Plain `.mjs` on purpose: it runs under bare `node` with no build step and no
 * bundler, which is what makes it usable against a deployed origin from any
 * machine. The price is that the vault format and the stored account shape are
 * restated here rather than imported from `src` — `seedLegacyStorage.test.ts`
 * pins both against the real `cryptoService` and `contractService`, so a drift
 * fails CI rather than producing a wallet the app can't open.
 *
 * The mnemonic it prints is throwaway by construction: generated fresh unless
 * one is passed in, and never written anywhere but your terminal. Do not pass
 * it a phrase that holds real funds.
 */
import { pathToFileURL } from 'node:url';

import { mnemonicNew, mnemonicToPrivateKey, mnemonicValidate } from '@ton/crypto';
import {
    WalletContractV3R1,
    WalletContractV3R2,
    WalletContractV4,
    WalletContractV5Beta,
    WalletContractV5R1
} from '@ton/ton';

/** Mirrors `BrowserStorage.prefix` in `apps/web/src/libs/storage.ts`. */
const STORAGE_PREFIX = 'tonkeeper';

/** Mirrors `AppKey.ACCOUNTS` / `AppKey.ACTIVE_ACCOUNT_ID` in `src/Keys.ts`. */
const ACCOUNTS_KEY = 'accounts';
const ACTIVE_ACCOUNT_ID_KEY = 'active_account_id';

/** Mirrors `Network` in `src/entries/network.ts`. */
const MAINNET = -239;

/** Mirrors `WalletVersion` in `src/entries/wallet.ts`. */
const WalletVersion = {
    V3R1: 0,
    V3R2: 1,
    V4R1: 2,
    V5_BETA: 4,
    V4R2: 3,
    V5R1: 5
};

const VERSIONS_BY_NAME = {
    v3R1: WalletVersion.V3R1,
    v3R2: WalletVersion.V3R2,
    v4R2: WalletVersion.V4R2,
    v5beta: WalletVersion.V5_BETA,
    v5R1: WalletVersion.V5R1
};

const VERSION_LABELS = {
    [WalletVersion.V3R1]: 'v3R1',
    [WalletVersion.V3R2]: 'v3R2',
    [WalletVersion.V4R2]: 'v4R2',
    [WalletVersion.V5_BETA]: 'W5 beta',
    [WalletVersion.V5R1]: 'W5'
};

/** Mirrors `tonWalletContractStrategy` in `src/service/wallet/contracts/ton-strategy.ts`. */
const walletAddress = (publicKey, version, networkGlobalId) => {
    const workchain = 0;

    switch (version) {
        case WalletVersion.V3R1:
            return WalletContractV3R1.create({ workchain, publicKey }).address;
        case WalletVersion.V3R2:
            return WalletContractV3R2.create({ workchain, publicKey }).address;
        case WalletVersion.V4R2:
            return WalletContractV4.create({ workchain, publicKey }).address;
        case WalletVersion.V5_BETA:
            return WalletContractV5Beta.create({ walletId: { networkGlobalId }, publicKey })
                .address;
        case WalletVersion.V5R1:
            return WalletContractV5R1.create({
                workchain,
                walletId: { networkGlobalId },
                publicKey
            }).address;
        default:
            throw new Error(`Unsupported wallet contract version: ${version}`);
    }
};

/**
 * Mirrors the v2 branch of `encrypt` in `src/service/cryptoService.ts`, down to
 * the iteration count and the `v2:<salt>:<iterations>:<iv>:<ct>` layout — the
 * decrypt side rejects any other iteration count outright.
 */
const PBKDF2_ITERATIONS = 600_000;

export const encryptSecret = async (plaintext, password) => {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const baseKey = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(password),
        'PBKDF2',
        false,
        ['deriveKey']
    );
    const key = await crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
        baseKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt']
    );

    const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        new TextEncoder().encode(plaintext)
    );

    const hex = bytes => Buffer.from(bytes).toString('hex');

    return [
        'v2',
        hex(salt),
        String(PBKDF2_ITERATIONS),
        hex(iv),
        Buffer.from(ciphertext).toString('base64')
    ].join(':');
};

/**
 * Mirrors what `createStandardTonAccountByMnemonic` stores: on mainnet an
 * account id is the TON public key and a wallet id is its raw address, and the
 * active wallet is the highest version present.
 */
export const buildLegacyAccount = async ({
    mnemonic,
    password,
    versions,
    name = 'Old Wallet',
    emoji = 'custom:wallet'
}) => {
    const keyPair = await mnemonicToPrivateKey(mnemonic);
    const publicKey = keyPair.publicKey.toString('hex');

    const tonWallets = versions.map(version => {
        const rawAddress = walletAddress(keyPair.publicKey, version, MAINNET).toRawString();

        return { id: rawAddress, publicKey, version, rawAddress, network: MAINNET };
    });

    return {
        type: 'mnemonic',
        id: publicKey,
        name,
        emoji,
        auth: {
            kind: 'password',
            encryptedSecret: await encryptSecret(mnemonic.join(' '), password)
        },
        activeTonWalletId: tonWallets.slice().sort((a, b) => b.version - a.version)[0].id,
        tonWallets,
        mnemonicType: 'ton'
    };
};

export const buildStorage = account => ({
    [`${STORAGE_PREFIX}_${ACCOUNTS_KEY}`]: JSON.stringify({ payload: [account] }),
    [`${STORAGE_PREFIX}_${ACTIVE_ACCOUNT_ID_KEY}`]: JSON.stringify({ payload: account.id })
});

const usage = `Usage: node packages/core/scripts/seedLegacyStorage.mjs [options]

  --mnemonic "<24 words>"  Use this phrase instead of generating one.
  --password <string>      Password the vault is encrypted with. Default: password.
  --versions <list>        Comma-separated wallet versions. Default: v4R2,v5R1.
                           One of: ${Object.keys(VERSIONS_BY_NAME).join(', ')}.
  --name <string>          Account name. Default: Old Wallet.
  --emoji <string>         Account emoji. Default: custom:wallet.
  --json                   Emit the storage map as JSON instead of a console
                           snippet, for Playwright's addInitScript and friends.
`;

const parseOptions = argv => {
    const options = {
        password: 'password',
        versions: [WalletVersion.V4R2, WalletVersion.V5R1],
        json: false
    };

    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        const value = () => {
            const next = argv[++i];
            if (next === undefined) {
                throw new Error(`${arg} needs a value`);
            }
            return next;
        };

        if (arg === '--mnemonic') {
            options.mnemonic = value().trim().split(/\s+/);
        } else if (arg === '--password') {
            options.password = value();
        } else if (arg === '--versions') {
            options.versions = value()
                .split(',')
                .map(part => {
                    const version = VERSIONS_BY_NAME[part.trim()];
                    if (version === undefined) {
                        throw new Error(`Unknown wallet version "${part.trim()}"`);
                    }
                    return version;
                });
        } else if (arg === '--name') {
            options.name = value();
        } else if (arg === '--emoji') {
            options.emoji = value();
        } else if (arg === '--json') {
            options.json = true;
        } else if (arg === '--help' || arg === '-h') {
            process.stdout.write(usage);
            process.exit(0);
        } else {
            throw new Error(`Unknown argument "${arg}"\n\n${usage}`);
        }
    }

    if (options.versions.length === 0) {
        throw new Error('--versions needs at least one version');
    }

    return options;
};

const main = async () => {
    const options = parseOptions(process.argv.slice(2));
    const mnemonic = options.mnemonic ?? (await mnemonicNew(24));

    if (!(await mnemonicValidate(mnemonic))) {
        throw new Error('That phrase is not a valid TON mnemonic');
    }

    const account = await buildLegacyAccount({ ...options, mnemonic });
    const storage = buildStorage(account);

    process.stderr.write(
        [
            '',
            '  Throwaway wallet — never fund this.',
            '',
            `  mnemonic  ${mnemonic.join(' ')}`,
            `  password  ${options.password}`,
            `  publicKey ${account.id}`,
            ...account.tonWallets.map(
                w => `  ${VERSION_LABELS[w.version].padEnd(9)} ${w.rawAddress}`
            ),
            '',
            options.json
                ? '  JSON on stdout — load it into a browser context before first paint.'
                : '  Snippet on stdout — paste into the devtools console on the old origin.',
            ''
        ].join('\n')
    );

    if (options.json) {
        process.stdout.write(`${JSON.stringify(storage, null, 2)}\n`);
        return;
    }

    const assignments = Object.entries(storage)
        .map(
            ([key, value]) =>
                `localStorage.setItem(${JSON.stringify(key)}, ${JSON.stringify(value)});`
        )
        .join('\n');

    process.stdout.write(`${assignments}\nlocation.reload();\n`);
};

// Only run the CLI when invoked directly, so the test can import the builders.
if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
    main().catch(e => {
        process.stderr.write(`${e instanceof Error ? e.message : String(e)}\n`);
        process.exit(1);
    });
}
