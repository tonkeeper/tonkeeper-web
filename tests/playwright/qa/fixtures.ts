import {
    test as base,
    expect,
    type Browser,
    type BrowserContext,
    type Locator,
    type Page,
    type TestInfo
} from '@playwright/test';
import { randomBytes } from 'crypto';
import fs from 'fs';
import path from 'path';
import { desktopDataDir, isDesktopTarget, launchDesktop } from './desktop';
import { qaHome } from './home';

export { expect };

export const OUT_DIR = path.join(qaHome(), 'out');
const AUTH_DIR = path.join(qaHome(), '.auth');

export type WalletId = 'A' | 'B' | 'C';

/** C is optional: imported only when its phrase is set. Its battery must stay empty forever. */
export const WALLETS: Record<WalletId, { role: string; name: string; optional?: true }> = {
    A: { role: 'multichain', name: 'QA A' },
    B: { role: 'legacy TON', name: 'QA B' },
    C: { role: 'empty battery', name: 'QA C', optional: true }
};

export const walletConfigured = (id: WalletId) => Boolean(process.env[`QA_WALLET_${id}_MNEMONIC`]);

export const authFile = (id: WalletId) => path.join(AUTH_DIR, `${id}.json`);

function savedWalletStorage(id: WalletId): { name: string; value: string }[] {
    const file = authFile(id);
    if (!fs.existsSync(file)) {
        throw new Error(`No saved profile for wallet ${id}. Run: yarn qa:setup --headed`);
    }
    const { origins = [] } = JSON.parse(fs.readFileSync(file, 'utf8')) as {
        origins?: { localStorage: { name: string; value: string }[] }[];
    };
    const entries = origins.flatMap(o => o.localStorage);
    if (!entries.length) {
        throw new Error(
            `Saved profile for wallet ${id} is empty. Delete it and run qa:setup again.`
        );
    }
    return entries;
}

export const walletEnv = (id: WalletId) => ({
    mnemonic: requireEnv(`QA_WALLET_${id}_MNEMONIC`),
    tonAddress: requireEnv(`QA_WALLET_${id}_TON_ADDRESS`)
});

/** Import needs only the phrase; the optional wallet C may have no address set. */
export const walletMnemonic = (id: WalletId) => requireEnv(`QA_WALLET_${id}_MNEMONIC`);

const passwordFile = () => path.join(AUTH_DIR, 'password');

/**
 * QA_WALLET_PASSWORD when set. Otherwise a random password made on the first import and kept next
 * to the saved profiles, which are encrypted with it: delete `qa/.auth` to reset both together.
 */
export function walletPassword(): string {
    if (process.env.QA_WALLET_PASSWORD) return process.env.QA_WALLET_PASSWORD;
    const file = passwordFile();
    if (fs.existsSync(file)) return fs.readFileSync(file, 'utf8').trim();
    if (fs.existsSync(AUTH_DIR) && fs.readdirSync(AUTH_DIR).some(f => f.endsWith('.json'))) {
        throw new Error('Saved profiles exist without their password. Delete qa/.auth and rerun.');
    }
    fs.mkdirSync(AUTH_DIR, { recursive: true });
    const password = randomBytes(18).toString('base64url');
    fs.writeFileSync(file, password, { mode: 0o600 });
    return password;
}

function requireEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`${name} is not set. Fill tests/playwright/.env from .env.example.`);
    }
    return value;
}

export interface PlannedTransaction {
    id: string;
    kind: 'transfer' | 'swap' | 'deposit' | 'withdraw' | 'battery-charge' | 'other';
    chain: string;
    asset: string;
    amount: string;
    from: WalletId;
    to: WalletId | 'self' | string;
}

export interface QaPlan {
    ticket: string;
    approvedAt?: string;
    transactions: PlannedTransaction[];
}

const spendLog = () => path.join(OUT_DIR, 'spend.log');

export function loadPlan(ticket: string): QaPlan {
    const file = path.join(OUT_DIR, ticket, 'plan.json');
    if (!fs.existsSync(file)) {
        throw new Error(`No plan for ${ticket} at ${file}.`);
    }
    return JSON.parse(fs.readFileSync(file, 'utf8')) as QaPlan;
}

function monthlyCaps(): Record<string, number> {
    return Object.fromEntries(
        (process.env.QA_MONTHLY_CAPS ?? '')
            .split(',')
            .map(pair => pair.split(':').map(s => s.trim()))
            .filter(([asset, cap]) => asset && cap)
            .map(([asset, cap]) => [asset.toUpperCase(), Number(cap)])
    );
}

const leavesQaWallets = (tx: PlannedTransaction) =>
    !(tx.to === 'A' || tx.to === 'B' || tx.to === 'C' || tx.to === 'self');

/** A plan transaction is signed once: a rerun after a failure must not repeat the ones that went through. */
export function alreadySigned(ticket: string, txId: string): boolean {
    if (!fs.existsSync(spendLog())) return false;
    return fs
        .readFileSync(spendLog(), 'utf8')
        .split('\n')
        .filter(Boolean)
        .map(line => JSON.parse(line) as { id: string; ticket: string })
        .some(e => e.ticket === ticket && e.id === txId);
}

function spentThisMonth(asset: string): number {
    if (!fs.existsSync(spendLog())) return 0;
    const month = new Date().toISOString().slice(0, 7);
    return fs
        .readFileSync(spendLog(), 'utf8')
        .split('\n')
        .filter(Boolean)
        .map(line => JSON.parse(line) as PlannedTransaction & { at: string; countsToCap: boolean })
        .filter(e => e.at.startsWith(month) && e.countsToCap && e.asset.toUpperCase() === asset)
        .reduce((sum, e) => sum + Number(e.amount), 0);
}

/**
 * Runs `confirm` (the tap that signs and sends) only for a transaction listed in the approved plan
 * and within the monthly cap. Every signing tap in a QA spec goes through this.
 *
 * The spend is logged before the tap: a step that fails after it may already have sent the
 * transaction, and a rerun must not send it twice. Retrying needs a look at the chain first.
 */
export async function signPlanned(
    plan: QaPlan,
    txId: string,
    confirm: () => Promise<void>
): Promise<PlannedTransaction> {
    if (!plan.approvedAt) {
        throw new Error(`Plan ${plan.ticket} is not approved. Signing is blocked.`);
    }
    if (alreadySigned(plan.ticket, txId)) {
        throw new Error(
            `${txId} is already in the spend log for ${plan.ticket}. Signing is blocked.`
        );
    }
    const tx = plan.transactions.find(t => t.id === txId);
    if (!tx) {
        throw new Error(`Transaction ${txId} is not in the approved plan ${plan.ticket}.`);
    }
    if (tx.kind === 'battery-charge' && (tx.from === 'C' || tx.to === 'C')) {
        throw new Error(`${txId} charges the battery of wallet C, which must stay empty.`);
    }
    const asset = tx.asset.toUpperCase();
    const countsToCap = leavesQaWallets(tx);
    if (countsToCap) {
        const cap = monthlyCaps()[asset];
        if (cap === undefined) {
            throw new Error(`No monthly cap for ${asset} in QA_MONTHLY_CAPS. Signing is blocked.`);
        }
        const after = spentThisMonth(asset) + Number(tx.amount);
        if (after > cap) {
            throw new Error(`${txId} would bring ${asset} outflow to ${after} of cap ${cap}.`);
        }
    }
    fs.mkdirSync(OUT_DIR, { recursive: true });
    fs.appendFileSync(
        spendLog(),
        JSON.stringify({ ...tx, ticket: plan.ticket, at: new Date().toISOString(), countsToCap }) +
            '\n'
    );
    try {
        await confirm();
    } catch (e) {
        throw new Error(
            `${txId} failed after its signing step started and stays in the spend log. Check the chain; ` +
                `if it was not sent, remove its line from qa/out/spend.log to retry. Cause: ${
                    (e as Error).message
                }`
        );
    }
    return tx;
}

export async function tonBalance(address: string): Promise<number> {
    const response = await fetch(`https://tonapi.io/v2/accounts/${address}`);
    if (!response.ok) {
        throw new Error(`tonapi returned ${response.status} for the QA wallet balance.`);
    }
    const { balance } = (await response.json()) as { balance: number };
    return balance / 1e9;
}

/** True when `locator` shows up within `timeout`; `isVisible()` alone does not wait. */
export const appears = (locator: Locator, timeout = 5_000): Promise<boolean> =>
    locator
        .waitFor({ timeout })
        .then(() => true)
        .catch(() => false);

/** Skips the calling test when one of `ids` holds less TON than QA_MIN_TON_BALANCE. */
export async function requireFunds(ids: WalletId[] = ['A', 'B']): Promise<void> {
    const min = Number(process.env.QA_MIN_TON_BALANCE ?? '1');
    for (const id of ids) {
        const balance = await tonBalance(walletEnv(id).tonAddress);
        base.skip(balance < min, `Wallet ${id} holds ${balance} TON, below ${min}. Top it up.`);
    }
}

type Fixtures = {
    walletA: Page;
    walletB: Page;
    walletC: Page;
};

const collectErrors = (page: Page) => {
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
    page.on('crash', () => errors.push('page crashed'));
    page.on('console', m => m.type() === 'error' && errors.push(`console: ${m.text()}`));
    // Query strings can carry tokens; origin and path are enough to find the failing call.
    page.on('response', async r => {
        if (r.status() < 400) return;
        const url = new URL(r.url());
        const body = await r.text().catch(() => '');
        errors.push(
            `http ${r.status()}: ${r.request().method()} ${url.origin}${url.pathname} ${body.slice(
                0,
                300
            )}`
        );
    });
    return errors;
};

const attachErrors = async (testInfo: TestInfo, id: WalletId, errors: string[]) => {
    if (errors.length) {
        await testInfo.attach(`errors-wallet-${id}`, {
            body: errors.join('\n'),
            contentType: 'text/plain'
        });
    }
};

/** A CDP-attached window cannot record video; a screenshot at the end of the test stands in. */
async function withDesktopWallet(
    testInfo: TestInfo,
    id: WalletId,
    use: (page: Page) => Promise<void>
) {
    const dataDir = desktopDataDir(id);
    if (!fs.existsSync(path.join(dataDir, 'config.json'))) {
        throw new Error(
            `No desktop profile for wallet ${id}. Run qa:setup with QA_DESKTOP_APP set.`
        );
    }
    const app = await launchDesktop(dataDir);
    const errors = collectErrors(app.page);
    try {
        await use(app.page);
        await testInfo.attach(`end-wallet-${id}`, {
            body: await app.page.screenshot(),
            contentType: 'image/png'
        });
    } finally {
        await app.close();
        await attachErrors(testInfo, id, errors);
    }
}

async function withWallet(
    browser: Browser,
    testInfo: TestInfo,
    id: WalletId,
    use: (page: Page) => Promise<void>
) {
    // Hand-made contexts get neither the config's baseURL/viewport nor its video recording.
    const { baseURL, viewport, userAgent, deviceScaleFactor } = testInfo.project.use;
    const context: BrowserContext = await browser.newContext({
        baseURL,
        viewport,
        userAgent,
        deviceScaleFactor,
        recordVideo: { dir: testInfo.outputPath(`video-${id}`) }
    });
    // Every PR preview is its own origin, so a saved storageState would not apply to it. The wallet
    // lives entirely in localStorage: copy it into the origin under test before the app boots, but
    // only into an empty storage, so state the test creates survives reloads.
    await context.addInitScript(
        ({ entries, marker }) => {
            if (localStorage.getItem(marker) !== null) return;
            for (const { name, value } of entries) localStorage.setItem(name, value);
        },
        { entries: savedWalletStorage(id), marker: 'tonkeeper_active_account_id' }
    );
    const page = await context.newPage();
    const errors = collectErrors(page);
    await page.goto('/');
    await use(page);
    await context.close();
    const video = await page.video()?.path();
    if (video) {
        await testInfo.attach(`video-wallet-${id}`, { path: video, contentType: 'video/webm' });
    }
    await attachErrors(testInfo, id, errors);
}

const openWallet = (
    browser: Browser,
    testInfo: TestInfo,
    id: WalletId,
    use: (page: Page) => Promise<void>
) =>
    isDesktopTarget()
        ? withDesktopWallet(testInfo, id, use)
        : withWallet(browser, testInfo, id, use);

/**
 * `walletA` / `walletB` / `walletC` open the app on that wallet (saved by wallets.setup.ts), each in its own
 * browser context, so a round trip can sign on both sides in one test.
 */
export const test = base.extend<Fixtures>({
    walletA: async ({ browser }, use, testInfo) => openWallet(browser, testInfo, 'A', use),
    walletB: async ({ browser }, use, testInfo) => openWallet(browser, testInfo, 'B', use),
    walletC: async ({ browser }, use, testInfo) => {
        base.skip(!walletConfigured('C'), 'Wallet C (empty battery) is not set in .env.');
        await openWallet(browser, testInfo, 'C', use);
    }
});
