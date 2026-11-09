import type { Locator, Page } from '@playwright/test';
import {
    alreadySigned,
    appears,
    expect,
    loadPlan,
    requireFunds,
    signPlanned,
    test,
    walletEnv,
    walletPassword,
    type PlannedTransaction
} from '../fixtures';

/**
 * Round trip of small transfers between the QA wallets, all within the pair:
 * A swaps USDT to GRAM, sends GRAM and USDT to B, B sends both back.
 * Every signing tap goes through `signPlanned`, so a run signs only what the approved
 * plan (`qa/out/<QA_TICKET>/plan.json`) lists.
 */
const plan = loadPlan(process.env.QA_TICKET ?? 'staging-smoke');

test.describe.configure({ mode: 'serial' });

const tx = (id: string): PlannedTransaction => {
    const found = plan.transactions.find(t => t.id === id);
    if (!found) throw new Error(`${id} is not in plan ${plan.ticket}.`);
    test.skip(alreadySigned(plan.ticket, id), `${id} was signed in an earlier run.`);
    return found;
};

const shortAddress = (address: string) => address.slice(-4);

const passwordPrompt = (page: Page) =>
    page.getByRole('dialog').filter({ hasText: 'Enter password' });

async function enterPassword(page: Page) {
    const dialog = passwordPrompt(page);
    await dialog.getByRole('textbox').fill(walletPassword());
    await dialog.getByRole('button', { name: 'Confirm', exact: true }).click();
}

/** After Confirm: the password is asked again unless the app still holds it from an earlier prompt. */
async function enterPasswordIfAsked(page: Page) {
    const prompt = passwordPrompt(page);
    await expect(prompt.or(page.getByText('Done'))).toBeVisible({ timeout: 60_000 });
    if (await prompt.isVisible()) await enterPassword(page);
}

/**
 * Waits until the confirm screen can sign. A profile without a Battery token asks for the password
 * here first, to sign the TonProof login behind the Battery fee; the transfer itself stays unsigned
 * until Confirm is pressed.
 */
async function waitUntilConfirmable(page: Page, confirm: Locator) {
    const button = confirm.getByRole('button', { name: 'Confirm', exact: true });
    await expect
        .poll(
            async () => {
                if (await passwordPrompt(page).isVisible()) await enterPassword(page);
                return button.isEnabled();
            },
            { timeout: 60_000, intervals: [1_000] }
        )
        .toBe(true);
}

/** A press right after boot can land before the flow is ready and open nothing. */
async function pressUntilVisible(button: Locator, opened: Locator) {
    await expect(async () => {
        await button.click({ timeout: 5_000 });
        await expect(opened).toBeVisible({ timeout: 5_000 });
    }).toPass({ timeout: 60_000 });
}

/** Opens the multichain send flow and stops on the confirm screen. */
async function multichainSendToConfirm(
    page: Page,
    asset: { search: string; row: RegExp },
    recipient: string,
    amount: string
): Promise<Locator> {
    const search = page.getByPlaceholder('Search by ticker or name');
    await pressUntilVisible(page.getByRole('button', { name: 'Send', exact: true }), search);
    await search.fill(asset.search);
    await page.getByRole('dialog').getByRole('button', { name: asset.row }).first().click();
    await page.getByPlaceholder('Address or name').fill(recipient);
    await page.getByRole('textbox', { name: 'Amount' }).fill(amount);
    await page.getByRole('button', { name: 'Continue' }).click();

    const confirm = page.getByRole('dialog').filter({ hasText: 'Confirm Action' });
    await expect(confirm).toContainText(shortAddress(recipient));
    await waitUntilConfirmable(page, confirm);
    return confirm;
}

async function multichainSend(
    page: Page,
    t: PlannedTransaction,
    asset: { search: string; row: RegExp }
) {
    const recipient = walletEnv(t.to as 'A' | 'B').tonAddress;
    const confirm = await multichainSendToConfirm(page, asset, recipient, t.amount);
    await expect(confirm).toContainText(t.amount);

    await signPlanned(plan, t.id, async () => {
        await confirm.getByRole('button', { name: 'Confirm', exact: true }).click();
        await enterPasswordIfAsked(page);
    });
    await expect(page.getByText('Done')).toBeVisible({ timeout: 60_000 });
}

/** Legacy TON send: from the token page for a jetton, from the header for GRAM. */
async function legacySend(page: Page, t: PlannedTransaction, jettonLabel?: string) {
    const recipient = walletEnv(t.to as 'A' | 'B').tonAddress;
    // A legacy-only install gets the one-time multichain promo over its home screen.
    const promo = page.getByRole('button', { name: 'Later', exact: true });
    if (await appears(promo)) await promo.click();
    const recipientField = page
        .locator('#react-portal-modal-container')
        .getByRole('textbox')
        .first();
    if (jettonLabel) {
        await page.getByText(jettonLabel, { exact: true }).first().click();
        await pressUntilVisible(page.getByRole('button', { name: 'Send' }).last(), recipientField);
    } else {
        await pressUntilVisible(
            page.getByRole('button', { name: 'Send', exact: true }).first(),
            recipientField
        );
    }
    await recipientField.fill(recipient);
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByTestId('amount-input').fill(t.amount);
    await page.getByRole('button', { name: 'Continue' }).click();

    const modal = page.locator('#react-portal-modal-container');
    await expect(modal).toContainText(shortAddress(recipient));
    // The legacy screen pads amounts to two decimals ("0.10 USD₮").
    const amount = t.amount.replace('.', '\\.');
    await expect(modal).toContainText(
        new RegExp(`(?<![\\d.])${amount}0*\\s*${jettonLabel ?? 'GRAM'}`)
    );

    await signPlanned(plan, t.id, async () => {
        await page.getByRole('button', { name: 'Confirm and Send' }).click();
        // The desktop app signs with the OS keychain and asks for no password.
        const passwordField = modal.getByRole('textbox');
        await expect(passwordField.or(page.getByText('Done'))).toBeVisible({ timeout: 60_000 });
        if (await passwordField.isVisible()) {
            await passwordField.fill(walletPassword());
            await page.getByRole('button', { name: 'Confirm', exact: true }).click();
        }
    });
    await expect(page.getByText('Done')).toBeVisible({ timeout: 60_000 });
}

test('A swaps USDT to GRAM', async ({ walletA }) => {
    await requireFunds(['A']);
    const t = tx('swap-a-usdt-gram');

    const swap = walletA.getByRole('dialog');
    const switchAssets = swap.getByRole('button', { name: 'Switch assets' });
    await pressUntilVisible(
        walletA.getByRole('button', { name: 'Swap', exact: true }),
        switchAssets
    );
    // The form opens as GRAM → USDT.
    await switchAssets.click();
    await swap.getByRole('textbox', { name: 'Send' }).fill(t.amount);
    await expect(swap.getByRole('button', { name: 'Continue' })).toBeEnabled({ timeout: 30_000 });
    await swap.getByRole('button', { name: 'Continue' }).click();

    const confirm = walletA.getByRole('dialog').filter({ hasText: 'Confirm swap' });
    await expect(confirm).toContainText(`${t.amount} USDT`);
    await waitUntilConfirmable(walletA, confirm);

    await signPlanned(plan, t.id, async () => {
        await confirm.getByRole('button', { name: 'Confirm', exact: true }).click();
        await enterPasswordIfAsked(walletA);
    });
    await expect(walletA.getByText('Done')).toBeVisible({ timeout: 60_000 });
});

test('A sends GRAM to B', async ({ walletA }) => {
    await requireFunds(['A']);
    await multichainSend(walletA, tx('send-a-b-gram'), { search: 'GRAM', row: /^GRAM/ });
});

test('A sends USDT to B', async ({ walletA }) => {
    await requireFunds(['A']);
    await multichainSend(walletA, tx('send-a-b-usdt'), { search: 'USD₮', row: /^USD₮.*TON/ });
});

test('B sends USDT back to A', async ({ walletB }) => {
    await legacySend(walletB, tx('send-b-a-usdt'), 'USD₮');
});

test('B sends GRAM back to A', async ({ walletB }) => {
    await legacySend(walletB, tx('send-b-a-gram'));
});
