import { test as setup, expect, type Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { desktopDataDir, isDesktopTarget, launchDesktop, readDesktopStore } from './desktop';
import {
    appears,
    authFile,
    walletConfigured,
    walletMnemonic,
    walletPassword,
    WALLETS,
    type WalletId
} from './fixtures';

// A saved profile is reused while it exists; delete qa/.auth/<id>.json (web) or
// qa/.desktop/<id> (desktop) to import again.
const MAX_INTERMEDIATE_SCREENS = 4;

const describeScreen = async (page: Page) => {
    const headings = await page
        .getByRole('heading')
        .allInnerTexts()
        .catch(() => []);
    const buttons = await page
        .getByRole('button')
        .allInnerTexts()
        .catch(() => []);
    const names = (texts: string[]) =>
        texts
            .map(t => t.trim().replace(/\s+/g, ' '))
            .filter(Boolean)
            .join(' | ');
    return `\nOn screen: headings [${names(headings)}], buttons [${names(buttons)}]`;
};

/** Imports wallet `id` on a page that shows the start screen; `isStored` says when it is saved. */
async function importWallet(
    page: Page,
    id: WalletId,
    open: () => Promise<void>,
    isStored: () => Promise<boolean>
) {
    const mnemonic = walletMnemonic(id);
    const password = walletPassword();
    let step = 'open start screen';
    let phraseAccepted = false;
    try {
        await open();
        step = 'start import';
        await page.getByRole('button', { name: 'Import Existing Wallet' }).click();
        await page
            .getByRole('dialog')
            .getByRole('button', { name: /^Existing wallet/ })
            .click();
        step = 'enter recovery phrase';
        // The whole phrase in field 1 counts as a paste: the form splits it and follows its length.
        const phraseField = page.getByLabel('1:', { exact: true });
        await phraseField.fill(mnemonic);
        await page.getByRole('button', { name: 'Continue' }).click();
        // A BIP39 phrase derives keys for every chain behind a loading Continue before moving on.
        step = 'wait for the phrase to be accepted';
        await expect(phraseField).toBeHidden({ timeout: 60_000 });
        phraseAccepted = true;

        // Version / network pickers differ between TON and BIP39 phrases; accept their defaults.
        // The desktop app keeps the secret in the OS keychain: it asks for no password and no
        // name, and stores the account right after these screens.
        step = 'pass intermediate screens';
        const passwordField = page.locator('#create-password');
        const pastPickers = async () => (await passwordField.isVisible()) || (await isStored());
        for (let i = 0; i < MAX_INTERMEDIATE_SCREENS && !(await pastPickers()); i++) {
            await page.getByRole('button', { name: 'Continue' }).click({ timeout: 10_000 });
            await expect
                .poll(pastPickers, { timeout: 15_000 })
                .toBe(true)
                .catch(() => undefined);
        }

        if (!(await isStored())) {
            step = 'set password';
            await passwordField.fill(password);
            await page.locator('#create-password-confirm').fill(password);
            await page.getByRole('button', { name: 'Continue' }).click();

            step = 'name wallet';
            const nameField = page.getByRole('dialog').getByRole('textbox').first();
            if (await appears(nameField)) {
                await nameField.fill(WALLETS[id].name);
                await page.getByRole('button', { name: 'Continue' }).click();
            }
        }

        // Legacy TON accounts end on "Wallet Tokens Setup"; multichain accounts go straight home.
        step = 'accept token setup';
        const tokensSetup = page.getByText('Wallet Tokens Setup');
        if (await appears(tokensSetup)) {
            await page.getByRole('button', { name: 'Continue' }).click();
        }

        step = 'wait for the account to be stored';
        await expect.poll(isStored, { timeout: 30_000 }).toBe(true);
    } catch {
        // The original error can quote the typed phrase; never let it reach the report or an agent.
        // Once the phrase screen is gone, the headings and buttons on screen are safe to name.
        const screen = phraseAccepted ? await describeScreen(page) : '';
        throw new Error(
            `Import of QA wallet ${id} failed at step "${step}". Fix the selectors in qa/wallets.setup.ts.${screen}`
        );
    }
}

async function importWebWallet(page: Page, id: WalletId) {
    const file = authFile(id);
    setup.skip(fs.existsSync(file), `Profile for ${id} already saved.`);
    await importWallet(
        page,
        id,
        async () => {
            // An empty profile is sent to the old origin for the domain-migration handoff and never
            // comes back to the build under test; marking the check done keeps it on the start screen.
            await page.addInitScript(() =>
                localStorage.setItem(
                    'tonkeeper_migration_old_origin_checked',
                    JSON.stringify({ payload: true })
                )
            );
            await page.goto('/');
        },
        async () =>
            (await page.evaluate(() => localStorage.getItem('tonkeeper_active_account_id'))) !==
            null
    );
    fs.mkdirSync(path.dirname(file), { recursive: true });
    await page.context().storageState({ path: file });
}

async function importDesktopWallet(id: WalletId) {
    const dataDir = desktopDataDir(id);
    const isStored = async () => readDesktopStore(dataDir).active_account_id != null;
    setup.skip(await isStored(), `Desktop profile for ${id} already saved.`);
    // A half-finished import leaves a profile that would open on a broken step.
    fs.rmSync(dataDir, { recursive: true, force: true });
    const app = await launchDesktop(dataDir);
    try {
        await importWallet(app.page, id, async () => undefined, isStored);
    } finally {
        await app.close();
    }
}

for (const id of Object.keys(WALLETS) as WalletId[]) {
    setup(`import QA wallet ${id} (${WALLETS[id].role})`, async ({ page }) => {
        setup.skip(
            Boolean(WALLETS[id].optional) && !walletConfigured(id),
            `Wallet ${id} is not set.`
        );
        if (isDesktopTarget()) {
            await importDesktopWallet(id);
        } else {
            await importWebWallet(page, id);
        }
    });
}
