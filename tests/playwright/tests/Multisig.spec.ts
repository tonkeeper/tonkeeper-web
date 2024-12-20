import { test, expect } from '@playwright/test';


test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Get started' }).click();
  await page.getByRole('button', { name: 'Existing Wallet Import wallet' }).click();
  await page.getByLabel('1:', { exact: true }).click();
  await page.getByLabel('1:', { exact: true }).fill(process.env.TON_MNEMONIC_ANANAS);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.locator('#create-password').fill('a]HmC.;MAcQJ[+Y@&r!-3h');
  await page.locator('#create-password-confirm').fill('a]HmC.;MAcQJ[+Y@&r!-3h');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Save' }).click();
});

test.afterEach(async ({ page }) => {
  await page.getByRole('link', { name: 'Settings' }).click();
  await page.getByText('Delete Account').click();
  await page
    .locator('div')
    .filter({ hasText: /^I have a backup copy of recovery phrase$/ })
    .locator('div')
    .click();
  await page.getByRole('button', { name: 'Delete wallet data' }).click();
});

//Multisig creation (up to payment step)
test('Create new multisig', async ({ page }) => {

  //multisig page view
  await page.getByRole('button', { name: 'Account 1 UQBA…OP8V W5 UQDH…' }).click();
  await expect(page.getByRole('link', { name: 'Multisig Wallets' })).toBeVisible();
  await page.getByRole('link', { name: 'Multisig Wallets' }).click();
  await expect(page.getByText('Multisig WalletsNew Multisig')).toBeVisible();
  await expect(page.getByText('Multisig UQBL…v_')).toBeVisible();
  await page.getByText('👩‍💼Multisig UQBL…v_kAUQBL…').click();
  await expect(page.getByText('👩‍💼Multisig UQBL…v_kAUQBL…')).toBeVisible();

  await page.locator('.sc-kLKjoy > .sc-bXDltw').first().click();
  await expect(page.locator('#root')).toContainText('👩‍💼Multisig UQBL…v_kAMultisig');
  await expect(page.locator('div').filter({ hasText: /^Tokens$/ }).nth(1)).toBeVisible();
  await expect(page.getByText('TON')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Requests' })).toBeVisible();
  await expect(page.getByText('SendReceiveBuy')).toBeVisible();

  //Requests tab
  await page.getByRole('link', { name: 'Requests' }).click();
  await expect(page.locator('div').filter({ hasText: /^Requests$/ }).nth(1)).toBeVisible();
  await expect(page.getByText('Created')).toBeVisible();
  await expect(page.getByText('Status')).toBeVisible();
  await expect(page.getByText('Signatures')).toBeVisible();
  await expect(page.locator('span').filter({ hasText: 'Send' })).toBeVisible();
  await page.getByRole('button', { name: 'Account 1 UQBA…OP8V W5 UQDH…' }).click();

  //change name/emoji to existing multisig
  await page.getByRole('link', { name: 'Multisig Wallets' }).click();
  await page.locator('.sc-kLKjoy > button').first().click();
  await page.getByLabel('Wallet name').click();
  await page.getByLabel('Wallet name').fill('Random multisig name');
  await page.getByText('❄️').click();
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('❄️Random multisig name')).toBeVisible();
  await page.locator('.sc-kLKjoy > button:nth-child(2)').first().click();
  await expect(page.getByRole('button', { name: '🍍 Account 1 UQBA…OP8V W5' })).toBeVisible();
  await page.getByRole('button', { name: 'New Multisig Wallet' }).click();
  //can create new multisig with Pro subscription only
  await expect(page.getByText('Tonkeeper Pro', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Buy Pro' }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Buy Pro' }).first().click();
  await expect(page.getByText('Select Wallet for')).toBeVisible();
  await page.locator('div:nth-child(2) > .sc-gGmKOd > .sc-jgHCeW > .sc-eJMOVy > .sc-fbkieD > .overflow-hidden > div > .sc-dwfTHb > .sc-jUElsq > .sc-Gqece > .sc-laRQQM').click();
  await page.locator('#react-portal-modal-container').getByRole('button').first().click();
});



test('Send request', async ({ page }) => {
  //multisig request creation by clicking Send button
  await page.getByRole('button', { name: 'Account 1 UQBA…OP8V W5 UQDH…' }).click();
  await expect(page.getByRole('link', { name: 'Multisig Wallets' })).toBeVisible();
  await page.getByRole('link', { name: 'Multisig Wallets' }).click();
  await page.getByText('👩‍💼Multisig UQBL…v_kAUQBL…').click();
  await page.locator('.sc-kLKjoy > .sc-bXDltw').first().click();
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await page.locator('#react-portal-modal-container').getByRole('button').first().click();
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'New Multi Signature Request' })).toBeVisible();
  await expect(page.getByText('Select time for quorum to')).toBeVisible();
  await expect(page.locator('div').filter({ hasText: /^Time to sign a transaction12 hours$/ }).nth(3)).toBeVisible();
  await page.locator('form').getByRole('img').click();
  await page.locator('div').filter({ hasText: /^30 minutes$/ }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('textbox').first().click();
  await page.getByRole('textbox').first().fill('UQD2NmD_lH5f5u1Kj3KfGyTvhZSX0Eg6qp2a5IQUKXxOGzCi');
  await page.getByRole('textbox').nth(1).click();
  await page.getByRole('textbox').nth(1).fill('test comment for multisig autotest!');
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.locator('div').filter({ hasText: /^AmountTo: UQD2…GzCi$/ }).nth(2)).toBeVisible();
  await expect(page.locator('div').filter({ hasText: /^TON$/ }).nth(3)).toBeVisible();
  await page.getByTestId('amount-input').click();
  await page.getByText('TON').nth(2).click();
  await page.getByTestId('amount-input').fill('0.01');
  await page.getByRole('button', { name: 'Continue' }).click();

  //Modal window for transaction confirmation
  await expect(page.getByText('Confirm sending')).toBeVisible();
  await expect(page.getByText('RecipientUQD2…GzCi')).toBeVisible();
  await expect(page.getByText('Amount0.01 TON≈ $')).toBeVisible();
  await expect(page.getByText('Fee')).toBeVisible();
  await expect(page.getByText('Commenttest comment')).toBeVisible();
  await expect(page.getByText('StatusIn Progress')).toBeVisible();
  await expect(page.getByText('Signers0 of 2 signers')).toBeVisible();
  await expect(page.getByText('Time Left30:00')).toBeVisible();
  await expect(page.getByText('Pending SignaturesYou: UQD2…')).toBeVisible();
  await expect(page.locator('div').filter({ hasText: /^UQDN…1rIt$/ })).toBeVisible();
  await expect(page.locator('div').filter({ hasText: /^UQDH…TkZ5$/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign' })).toBeVisible();
  await page.locator('#react-portal-modal-container').getByRole('button').first().click();
  await page.getByRole('link', { name: 'Requests' }).click();
  await page.getByRole('button', { name: 'Account 1 UQBA…OP8V W5 UQDH…' }).click();
});