import type { Page, TestInfo } from '@playwright/test';
import { spawn } from 'child_process';
import { randomBytes } from 'crypto';
import {
    desktopDataDir,
    isDesktopTarget,
    launchDesktop,
    readDesktopStore,
    setDesktopViewport,
    type DesktopApp
} from '../desktop';
import { appears, expect, test, walletEnv, type WalletId } from '../fixtures';

/**
 * Desktop-only checks on a packaged build (QA_DESKTOP_APP). Nothing here signs: flows that open a
 * confirm screen are closed again. Screens are attached as screenshots for review against web.
 */
test.skip(!isDesktopTarget(), 'Set QA_DESKTOP_APP to run the desktop checks.');

// The window's minimum is 1100×760 including the title bar; the page gets the rest.
const WINDOW_SIZES = [
    { name: 'min', width: 1100, height: 732 },
    { name: 'large', width: 1600, height: 1000 }
];

const SETTLE_MS = 2_500;

async function capture(page: Page, testInfo: TestInfo, name: string) {
    await page.waitForTimeout(SETTLE_MS);
    await testInfo.attach(name, { body: await page.screenshot(), contentType: 'image/png' });
}

const STEP_TIMEOUT = 15_000;

interface Screen {
    name: string;
    open: () => Promise<void>;
    /** Text only the opened screen shows; without it the screenshot is the only check. */
    shows?: string;
}

/**
 * Some screens have no way back that a locator can name (legacy sheets close with an unlabeled
 * cross, asset pages hide the tab bar), so every screen starts from a reload: the app's
 * MemoryRouter always boots on the home screen.
 */
async function walkScreens(
    page: Page,
    testInfo: TestInfo,
    screens: Screen[],
    home: () => Promise<void>
) {
    // Every screen at every size costs a reload and a settle pause.
    test.setTimeout(15 * 60_000);
    const reloadHome = async () => {
        await page.reload();
        await home();
    };
    for (const size of WINDOW_SIZES) {
        await setDesktopViewport(page, size.width, size.height);
        await reloadHome();
        await capture(page, testInfo, `${size.name}-home`);
        for (const screen of screens) {
            await test.step(`${size.name}: ${screen.name}`, async () => {
                if (screen.shows) {
                    // A press right after a reload can land before the screen is wired and open
                    // nothing; press again until it shows.
                    const marker = page.getByText(screen.shows, { exact: true }).first();
                    await expect(async () => {
                        if (!(await marker.isVisible())) await screen.open();
                        await expect(marker).toBeVisible({ timeout: 5_000 });
                    }).toPass({ timeout: 60_000 });
                } else {
                    await screen.open();
                }
                await capture(page, testInfo, `${size.name}-${screen.name}`);
                await reloadHome();
            });
        }
    }
}

const errorsOf = (page: Page) => {
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    return errors;
};

test('multichain screens fit the window at min and large size', async ({ walletA }, testInfo) => {
    const page = walletA;
    const errors = errorsOf(page);
    const nav = (name: string) => () =>
        page.getByRole('button', { name, exact: true }).last().click({ timeout: STEP_TIMEOUT });
    const home = () =>
        expect(page.getByRole('button', { name: 'Send', exact: true })).toBeVisible({
            timeout: 60_000
        });

    await walkScreens(
        page,
        testInfo,
        [
            { name: 'send', shows: 'Choose asset', open: nav('Send') },
            { name: 'add-funds', shows: 'Receive tokens', open: nav('Add Funds') },
            { name: 'swap', shows: 'Receive', open: nav('Swap') },
            { name: 'stake', shows: 'Tonstakers', open: nav('Stake') },
            {
                name: 'asset-gram',
                shows: 'Your balance',
                open: () =>
                    page
                        .getByRole('button', { name: /^GRAM Verified/ })
                        .click({ timeout: STEP_TIMEOUT })
            },
            { name: 'battery', shows: 'Battery Settings', open: nav('Keeper Battery') },
            { name: 'dashboard', shows: 'Total balance', open: nav('Dashboard') },
            { name: 'manage-wallets', shows: 'New Folder', open: nav('Manage Wallets') },
            { name: 'trade', shows: 'Core tokens', open: nav('Trade') },
            { name: 'discover', shows: 'Connected', open: nav('Discover') },
            { name: 'history', shows: 'All Types', open: nav('History') },
            { name: 'settings', shows: 'Backup', open: nav('Settings') }
        ],
        home
    );
    expect(errors, 'uncaught errors in the renderer').toEqual([]);
});

test('legacy TON screens fit the window at min and large size', async ({ walletB }, testInfo) => {
    const page = walletB;
    const errors = errorsOf(page);
    const link = (name: string) => () =>
        page.getByRole('link', { name, exact: true }).click({ timeout: STEP_TIMEOUT });
    const button = (name: string) => () =>
        page.getByRole('button', { name, exact: true }).first().click({ timeout: STEP_TIMEOUT });
    const home = async () => {
        await expect(page.getByRole('link', { name: 'Tokens', exact: true })).toBeVisible({
            timeout: 60_000
        });
        // A legacy profile offers multichain and a password on start; both can wait.
        for (const later of ['Later', 'Remind Later']) {
            const dismiss = page.getByRole('button', { name: later, exact: true });
            if (await appears(dismiss, 3_000)) await dismiss.click();
        }
    };

    await walkScreens(
        page,
        testInfo,
        [
            { name: 'send', shows: 'Recipient address', open: button('Send') },
            { name: 'receive', shows: 'Copy address', open: button('Receive') },
            { name: 'buy', shows: 'Other ways to buy', open: button('Buy') },
            { name: 'multi-send', shows: 'Import CSV', open: link('Multi Send') },
            { name: 'history', open: link('History') },
            { name: 'collectibles', open: link('Collectibles') },
            { name: 'domains', open: link('Domains') },
            { name: 'swap', open: link('Swap') },
            { name: 'staking', shows: 'Expected annual earning', open: link('Staking') },
            {
                name: 'multisig',
                shows: 'Learn more about multisig',
                open: link('Multisig Wallets')
            },
            { name: 'battery', shows: 'Charges History and Refunds', open: link('Keeper Battery') },
            { name: 'settings', shows: 'Connected Apps', open: link('Settings') }
        ],
        home
    );
    expect(errors, 'uncaught errors in the renderer').toEqual([]);
});

const accountsOf = (id: WalletId) =>
    JSON.stringify(readDesktopStore(desktopDataDir(id)).accounts ?? null);

test('wallets and settings survive a restart', async () => {
    const dataDir = desktopDataDir('A');
    const before = accountsOf('A');
    expect(before).not.toBe('null');

    for (let start = 1; start <= 2; start++) {
        const app = await launchDesktop(dataDir);
        try {
            await expect(app.page.getByRole('button', { name: /^Wallet Multichain/ })).toBeVisible({
                timeout: 60_000
            });
        } finally {
            await app.close();
        }
        expect(accountsOf('A'), `accounts after start ${start}`).toBe(before);
    }
});

test('a second start on the same data folder hands over to the running app', async () => {
    const dataDir = desktopDataDir('A');
    const app = await launchDesktop(dataDir);
    try {
        await expect(app.page.getByRole('button', { name: /^Wallet Multichain/ })).toBeVisible({
            timeout: 60_000
        });
        const executable = app.process.spawnfile;
        const second = spawn(executable, [`--user-data-dir=${dataDir}`], { stdio: 'ignore' });
        const exitCode = await new Promise<number | null>((resolve, reject) => {
            const timer = setTimeout(
                () => reject(new Error('The second start kept running for 20 s.')),
                20_000
            );
            second.once('exit', code => {
                clearTimeout(timer);
                resolve(code);
            });
        }).finally(() => second.exitCode === null && second.kill('SIGKILL'));
        expect(exitCode).toBe(0);
        expect(app.process.exitCode, 'the first copy is still running').toBeNull();
        await expect(app.page.getByRole('button', { name: /^Wallet Multichain/ })).toBeVisible();
    } finally {
        await app.close();
    }
});

const tonConnectLink = (scheme: string) => {
    const request = encodeURIComponent(
        JSON.stringify({
            manifestUrl:
                'https://ton-connect.github.io/demo-dapp-with-react-ui/tonconnect-manifest.json',
            items: [{ name: 'ton_addr' }]
        })
    );
    return `${scheme}://?v=2&id=${randomBytes(32).toString('hex')}&r=${request}&ret=none`;
};

/**
 * The app reads a link passed as its last argument the way Windows and Linux deliver it; macOS
 * delivers browser links through `open-url`, which reaches the same renderer handler. Whether the
 * OS sends the link to this app at all is a manual check.
 */
const LINKS: {
    name: string;
    url: () => string;
    shows: (page: Page) => ReturnType<Page['getByText']>;
}[] = [
    {
        name: 'transfer',
        url: () => `tonkeeper://transfer/${walletEnv('B').tonAddress}?amount=10000000`,
        shows: page => page.getByRole('dialog').getByText('Confirm Action')
    },
    {
        name: 'swap',
        url: () => 'tonkeeper://swap',
        shows: page => page.getByRole('dialog').getByText('Swap', { exact: true }).first()
    },
    {
        name: 'staking',
        url: () => 'tonkeeper://staking',
        shows: page => page.getByRole('dialog').getByText('Stake', { exact: true }).first()
    },
    {
        name: 'receive',
        url: () => 'tonkeeper://receive',
        shows: page => page.getByRole('heading', { name: 'Receiving address' })
    },
    {
        name: 'battery',
        url: () => 'tonkeeper://battery',
        shows: page => page.getByRole('heading', { name: 'Keeper Battery' })
    },
    {
        name: 'tc',
        url: () => tonConnectLink('tc'),
        shows: page => page.getByRole('heading', { name: /^Connect to ton-connect\.github\.io/ })
    },
    {
        name: 'tonkeeper-tc',
        url: () => tonConnectLink('tonkeeper-tc'),
        shows: page => page.getByRole('heading', { name: /^Connect to ton-connect\.github\.io/ })
    }
];

for (const link of LINKS) {
    test(`a ${link.name} link opened on a cold start shows its screen`, async ({}, testInfo) => {
        let app: DesktopApp | undefined;
        try {
            app = await launchDesktop(desktopDataDir('A'), [link.url()]);
            await expect(link.shows(app.page)).toBeVisible({ timeout: 30_000 });
            await capture(app.page, testInfo, `link-${link.name}`);
        } finally {
            // Closing the app without a tap rejects nothing on-chain: no confirm or connect is sent.
            await app?.close();
        }
    });
}
