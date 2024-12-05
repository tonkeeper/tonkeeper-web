import { test, expect } from '@playwright/test';
test.setTimeout(4 * 60 * 1000);

//Send TON flow - TON is preselected + Filter USDT in drop-down list of modal window to send

test('Filter usdt', async ({ page }) => {

  await page.goto('/');
  await page.getByRole('button', { name: 'Get started' }).click();
  await page.getByRole('button', { name: 'Existing Wallet Import wallet' }).click();
  await page.getByLabel('1:', { exact: true }).click();
  await page.getByLabel('1:', { exact: true }).fill(process.env.TON_MNEMONIC_24);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page
    .locator('div')
    .filter({ hasText: /^Password$/ })
    .getByRole('textbox')
    .fill('123456');
  await page.getByRole('textbox').nth(1).click();
  await page.getByRole('textbox').nth(1).fill('123456');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Wallet name').fill('Account ');
  await page.getByLabel('Wallet name').click();
  await page.getByLabel('Wallet name').fill('Тестовый кошелёк');
  await page.getByLabel('Wallet name').click();
  await page.locator('div:nth-child(1664)').click();
  await page.getByText('❣️').click();
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.locator('#root')).toContainText('TON');
  await expect(page.locator('#root')).toContainText('USD₮');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Recipient' })).toBeVisible();
  await expect(page.locator('#react-portal-modal-container').getByRole('button').first()).toBeVisible();
  await expect(page.getByRole('textbox').first()).toBeVisible();
  await expect(page.locator('.sc-ksPlvC > svg')).toBeVisible();
  await expect(page.getByRole('textbox').nth(1)).toBeVisible();
  await page.getByRole('textbox').first().click();
  await page.getByRole('textbox').first().fill('UQDj5NvQK1Hh6cct5PAX8Xcb6IKo1Hmjoc2LM1Nag_1fpOuv');
  await page.getByText('UQDj5NvQK1Hh6cct5PAX8Xcb6IKo1Hmjoc2LM1Nag_1fpOuv').click();
  await page.getByRole('textbox').nth(1).click();
  await page.getByRole('textbox').nth(1).fill('Тестовый комментарий');
  await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('textbox').first().click();
  await expect(page.getByRole('heading', { name: 'Amount' })).toBeVisible();
  await expect(page.locator('.sc-iJuWdM')).toBeVisible();
  await expect(page.locator('#react-portal-modal-container').getByRole('button').first()).toBeVisible();
  await expect(page.locator('div').filter({ hasText: /^TON$/ }).nth(3)).toBeVisible();
  await expect(page.getByTestId('amount-input')).toBeVisible();
  await expect(page.getByText('TON', { exact: true }).nth(3)).toBeVisible();
  await expect(page.getByText('MAX')).toBeVisible();
  await expect(page.locator('div').filter({ hasText: /^Continue$/ }).nth(1)).toBeVisible();
  await page.locator('div').filter({ hasText: /^TON$/ }).nth(3).click();
  await page.locator('label').click();
  await page.locator('label span').nth(1).click();
  await page.locator('label').click();
  await expect(page.locator('div').filter({ hasText: /^AmountTo: UQDj…pOuv$/ }).nth(2)).toBeVisible();
  await expect(page.getByText('USD₮USD₮0.00 USD')).toBeVisible();
  await page.locator('div').filter({ hasText: /^USD₮$/ }).nth(3).click();
  await page.locator('#react-portal-modal-container').getByRole('button').first().click();
});

//Send TON flow - check modal windows elements + ensure password is required +cancel transaction when you enter password

test('Send Ton but cancel', async ({ page }) => {

  await page.goto('/');
  await page.getByRole('button', { name: 'Get started' }).click();
  await page.getByRole('button', { name: 'Existing Wallet Import wallet' }).click();
  await page.getByLabel('1:', { exact: true }).click();
  await page.getByLabel('1:', { exact: true }).fill(process.env.TON_MNEMONIC_24);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page
    .locator('div')
    .filter({ hasText: /^Password$/ })
    .getByRole('textbox')
    .fill('123456');
  await page.getByRole('textbox').nth(1).click();
  await page.getByRole('textbox').nth(1).fill('123456');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Wallet name').fill('Account ');
  await page.getByLabel('Wallet name').click();
  await page.getByLabel('Wallet name').fill('Тестовый кошелёк');
  await page.getByLabel('Wallet name').click();
  await page.locator('div:nth-child(1664)').click();
  await page.getByText('❣️').click();
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.locator('#root')).toContainText('TON');
  await expect(page.locator('#root')).toContainText('USD₮');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Recipient' })).toBeVisible();
  await expect(page.locator('#react-portal-modal-container').getByRole('button').first()).toBeVisible();
  await expect(page.getByRole('textbox').first()).toBeVisible();
  await expect(page.locator('.sc-ksPlvC > svg')).toBeVisible();
  await expect(page.getByRole('textbox').nth(1)).toBeVisible();
  await page.getByRole('textbox').first().click();
  await page.getByRole('textbox').first().fill('UQDj5NvQK1Hh6cct5PAX8Xcb6IKo1Hmjoc2LM1Nag_1fpOuv');
  await page.getByText('UQDj5NvQK1Hh6cct5PAX8Xcb6IKo1Hmjoc2LM1Nag_1fpOuv').click();
  await page.getByRole('textbox').nth(1).click();
  await page.getByRole('textbox').nth(1).fill('Тестовый комментарий');
  await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByText('TONTON0.00 USD')).toBeVisible();
  await page.getByTestId('amount-input').fill('0.01');
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.locator('.sc-iJuWdM')).toBeVisible();
  await expect(page.locator('#react-portal-modal-container').getByRole('button').first()).toBeVisible();
  await expect(page.locator('#react-portal-modal-container img')).toBeVisible();
  await expect(page.getByText('Confirm sending')).toBeVisible();
  await expect(page.getByText('RecipientUQDj…pOuv')).toBeVisible();
  await expect(page.getByText('Amount0.01 TON≈ $')).toBeVisible();
  await expect(page.getByText('Amount')).toBeVisible();
  await expect(page.getByText('Fee')).toBeVisible();
  await expect(page.getByText('CommentТестовый комментарий')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Confirm and Send' })).toBeVisible();
  await page.getByRole('button', { name: 'Confirm and Send' }).click();
  await expect(page.getByText('Enter password')).toBeVisible();
  await expect(page.getByLabel('Password')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
  await expect(page.getByLabel('Password')).toBeVisible();
  await page.getByLabel('Password').click();
  await page.getByLabel('Password').fill('123');
  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(page.getByText('Failed to send transaction')).toBeVisible();
  await page.locator('#react-portal-modal-container').getByRole('button').click();
  await expect(page.getByText('Тестовый кошелёкUQAG…gyIOv4R2❣️')).toBeVisible();
});

//Input incorrect password to confirm sending TON

test('Wrong password when sending TON', async ({ page }) => {

  await page.goto('/');
  await page.getByRole('button', { name: 'Get started' }).click();
  await page.getByRole('button', { name: 'Existing Wallet Import wallet' }).click();
  await page.getByLabel('1:', { exact: true }).click();
  await page.getByLabel('1:', { exact: true }).fill(process.env.TON_MNEMONIC_24);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page
    .locator('div')
    .filter({ hasText: /^Password$/ })
    .getByRole('textbox')
    .fill('123456');
  await page.getByRole('textbox').nth(1).click();
  await page.getByRole('textbox').nth(1).fill('123456');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Wallet name').fill('Account ');
  await page.getByLabel('Wallet name').click();
  await page.getByLabel('Wallet name').fill('Тестовый кошелёк');
  await page.getByLabel('Wallet name').click();
  await page.locator('div:nth-child(1664)').click();
  await page.getByText('❣️').click();
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.locator('#root')).toContainText('TON');
  await expect(page.locator('#root')).toContainText('USD₮');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await page.getByRole('textbox').first().click();
  await page.getByRole('textbox').first().fill('UQDj5NvQK1Hh6cct5PAX8Xcb6IKo1Hmjoc2LM1Nag_1fpOuv');
  await page.getByText('UQDj5NvQK1Hh6cct5PAX8Xcb6IKo1Hmjoc2LM1Nag_1fpOuv').click();
  await page.getByRole('textbox').nth(1).click();
  await page.getByRole('textbox').nth(1).fill('Тестовый комментарий');
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByText('TONTON0.00 USD')).toBeVisible();
  await page.getByTestId('amount-input').fill('0.01');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Confirm and Send' }).click();
  await page.getByLabel('Password').click();
  await page.getByLabel('Password').fill('123465');
  await page.getByRole('button', { name: 'Confirm' }).click();
  await page.locator('div:nth-child(2) > .sc-gGmKOd > .sc-jgHCeW > .sc-eJMOVy').click();
  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(page.getByText('Failed to send transaction')).toBeVisible();
  await page.locator('#react-portal-modal-container').getByRole('button').click();
  await expect(page.getByText('Тестовый кошелёкUQAG…gyIOv4R2❣️')).toBeVisible();
});

//Input dns as a recipient address
test('Recipient by dns', async ({ page }) => {

  await page.goto('/');
  await page.getByRole('button', { name: 'Get started' }).click();
  await page.getByRole('button', { name: 'Existing Wallet Import wallet' }).click();
  await page.getByLabel('1:', { exact: true }).click();
  await page.getByLabel('1:', { exact: true }).fill(process.env.TON_MNEMONIC_24);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page
    .locator('div')
    .filter({ hasText: /^Password$/ })
    .getByRole('textbox')
    .fill('123456');
  await page.getByRole('textbox').nth(1).click();
  await page.getByRole('textbox').nth(1).fill('123456');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Wallet name').fill('Account ');
  await page.getByLabel('Wallet name').click();
  await page.getByLabel('Wallet name').fill('Тестовый кошелёк');
  await page.getByLabel('Wallet name').click();
  await page.locator('div:nth-child(1664)').click();
  await page.getByText('❣️').click();
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.locator('#root')).toContainText('TON');
  await expect(page.locator('#root')).toContainText('USD₮');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await page.getByRole('textbox').first().click();
  await page.getByRole('textbox').first().fill('oleganza.ton');
  await page.getByText('oleganza.ton').click();
  await page.getByRole('textbox').nth(1).click();
  await page.getByRole('textbox').nth(1).fill('Тестовый комментарий');
  await expect(page.getByText('UQBb…z6Pz')).toBeVisible();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByText('TONTON0.00 USD')).toBeVisible();
  await page.getByTestId('amount-input').fill('0.01');
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.locator('#react-portal-modal-container').getByRole('button').first()).toBeVisible();
  await page.getByRole('button', { name: 'Confirm and Send' }).click();
  await expect(page.getByText('Enter password')).toBeVisible();
  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(page.getByText('Failed to send transaction')).toBeVisible();
  await page.locator('#react-portal-modal-container').getByRole('button').click();
  await expect(page.getByText('Тестовый кошелёкUQAG…gyIOv4R2❣️')).toBeVisible();
});


//Input t.me username as a recipient address
test('Recipient by username', async ({ page }) => {

  await page.goto('/');
  await page.getByRole('button', { name: 'Get started' }).click();
  await page.getByRole('button', { name: 'Existing Wallet Import wallet' }).click();
  await page.getByLabel('1:', { exact: true }).click();
  await page.getByLabel('1:', { exact: true }).fill(process.env.TON_MNEMONIC_24);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page
    .locator('div')
    .filter({ hasText: /^Password$/ })
    .getByRole('textbox')
    .fill('123456');
  await page.getByRole('textbox').nth(1).click();
  await page.getByRole('textbox').nth(1).fill('123456');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Wallet name').fill('Account ');
  await page.getByLabel('Wallet name').click();
  await page.getByLabel('Wallet name').fill('Тестовый кошелёк');
  await page.getByLabel('Wallet name').click();
  await page.locator('div:nth-child(1664)').click();
  await page.getByText('❣️').click();
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.locator('#root')).toContainText('TON');
  await expect(page.locator('#root')).toContainText('USD₮');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await page.getByRole('textbox').first().click();
  await page.getByRole('textbox').first().fill('maincrypt0.t.me');
  await page.getByText('maincrypt0.t.me', { exact: true }).click();
  await page.getByRole('textbox').nth(1).click();
  await expect(page.locator('div').filter({ hasText: /^maincrypt0\.t\.meRecipient addressUQD2…GzCi$/ }).locator('span')).toBeVisible();
  await page.getByRole('textbox').nth(1).click();
  await page.getByRole('textbox').nth(1).fill('Enter any comment here!');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByTestId('amount-input').fill('0.01');
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.locator('#react-portal-modal-container').getByRole('button').first()).toBeVisible();
  await page.getByRole('button', { name: 'Confirm and Send' }).click();
  await expect(page.getByText('Enter password')).toBeVisible();
  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(page.getByText('Failed to send transaction')).toBeVisible();
  await page.locator('#react-portal-modal-container').getByRole('button').click();
  await expect(page.getByText('Тестовый кошелёкUQAG…gyIOv4R2❣️')).toBeVisible();
});

//Input up to 9 decimals as amount
test('9 decimals amount', async ({ page }) => {

  await page.goto('/');
  await page.getByRole('button', { name: 'Get started' }).click();
  await page.getByRole('button', { name: 'Existing Wallet Import wallet' }).click();
  await page.getByLabel('1:', { exact: true }).click();
  await page.getByLabel('1:', { exact: true }).fill(process.env.TON_MNEMONIC_24);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page
    .locator('div')
    .filter({ hasText: /^Password$/ })
    .getByRole('textbox')
    .fill('123456');
  await page.getByRole('textbox').nth(1).click();
  await page.getByRole('textbox').nth(1).fill('123456');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Wallet name').fill('Account ');
  await page.getByLabel('Wallet name').click();
  await page.getByLabel('Wallet name').fill('Тестовый кошелёк');
  await page.getByLabel('Wallet name').click();
  await page.locator('div:nth-child(1664)').click();
  await page.getByText('❣️').click();
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.locator('#root')).toContainText('TON');
  await expect(page.locator('#root')).toContainText('USD₮');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await page.getByRole('textbox').first().click();
  await page.getByRole('textbox').first().fill('oleganza.ton');
  await page.getByText('oleganza.ton').click();
  await page.getByRole('textbox').nth(1).click();
  await page.getByRole('textbox').nth(1).fill('Тестовый комментарий');
  await expect(page.getByText('UQBb…z6Pz')).toBeVisible();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByText('TONTON0.00 USD')).toBeVisible();
  await page.getByTestId('amount-input').fill('0.000000011');
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.locator('#react-portal-modal-container').getByRole('button').first()).toBeVisible();
  await page.getByRole('button', { name: 'Confirm and Send' }).click();
  await expect(page.getByText('Enter password')).toBeVisible();
  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(page.getByText('Failed to send transaction')).toBeVisible();
  await page.locator('#react-portal-modal-container').getByRole('button').click();
  await expect(page.getByText('Тестовый кошелёкUQAG…gyIOv4R2❣️')).toBeVisible();
});

//Input MAX amount
test('Max amount', async ({ page }) => {

  await page.goto('/');
  await page.getByRole('button', { name: 'Get started' }).click();
  await page.getByRole('button', { name: 'Existing Wallet Import wallet' }).click();
  await page.getByLabel('1:', { exact: true }).click();
  await page.getByLabel('1:', { exact: true }).fill(process.env.TON_MNEMONIC_24);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page
    .locator('div')
    .filter({ hasText: /^Password$/ })
    .getByRole('textbox')
    .fill('123456');
  await page.getByRole('textbox').nth(1).click();
  await page.getByRole('textbox').nth(1).fill('123456');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Wallet name').fill('Account ');
  await page.getByLabel('Wallet name').click();
  await page.getByLabel('Wallet name').fill('Тестовый кошелёк');
  await page.getByLabel('Wallet name').click();
  await page.locator('div:nth-child(1664)').click();
  await page.getByText('❣️').click();
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.locator('#root')).toContainText('TON');
  await expect(page.locator('#root')).toContainText('USD₮');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await page.getByRole('textbox').first().click();
  await page.getByRole('textbox').first().fill('oleganza.ton');
  await page.getByText('oleganza.ton').click();
  await page.getByRole('textbox').nth(1).click();
  await page.getByRole('textbox').nth(1).fill('Тестовый комментарий');
  await expect(page.getByText('UQBb…z6Pz')).toBeVisible();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByText('TONTON0.00 USD')).toBeVisible();
  await page.getByText('MAX').click();
  await expect(page.getByTestId('amount-input')).toBeVisible();
  await expect(page.getByText('TON', { exact: true }).nth(3)).toBeVisible();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.locator('#react-portal-modal-container').getByRole('button').first()).toBeVisible();
  await page.getByRole('button', { name: 'Confirm and Send' }).click();
  await expect(page.getByText('Enter password')).toBeVisible();
  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(page.getByText('Failed to send transaction')).toBeVisible();
  await page.locator('#react-portal-modal-container').getByRole('button').click();
  await expect(page.getByText('Тестовый кошелёкUQAG…gyIOv4R2❣️')).toBeVisible();
});

//Input fiat amount
test('Fiat amount', async ({ page }) => {

  await page.goto('/');
  await page.getByRole('button', { name: 'Get started' }).click();
  await page.getByRole('button', { name: 'Existing Wallet Import wallet' }).click();
  await page.getByLabel('1:', { exact: true }).click();
  await page.getByLabel('1:', { exact: true }).fill(process.env.TON_MNEMONIC_24);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page
    .locator('div')
    .filter({ hasText: /^Password$/ })
    .getByRole('textbox')
    .fill('123456');
  await page.getByRole('textbox').nth(1).click();
  await page.getByRole('textbox').nth(1).fill('123456');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Wallet name').fill('Account ');
  await page.getByLabel('Wallet name').click();
  await page.getByLabel('Wallet name').fill('Тестовый кошелёк');
  await page.getByLabel('Wallet name').click();
  await page.locator('div:nth-child(1664)').click();
  await page.getByText('❣️').click();
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.locator('#root')).toContainText('TON');
  await expect(page.locator('#root')).toContainText('USD₮');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await page.getByRole('textbox').first().click();
  await page.getByRole('textbox').first().fill('oleganza.ton');
  await page.getByText('oleganza.ton').click();
  await page.getByRole('textbox').nth(1).click();
  await page.getByRole('textbox').nth(1).fill('Тестовый комментарий');
  await expect(page.getByText('UQBb…z6Pz')).toBeVisible();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByText('TONTON0.00 USD')).toBeVisible();
  await page.getByText('0.00 USD').click();
  await expect(page.getByText('TONUSD0 TON')).toBeVisible();
  await page.getByTestId('amount-input').click();
  await page.getByTestId('amount-input').fill('0.12');
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByText('Recipientoleganza.ton')).toBeVisible();
  await expect(page.getByText('Recipient addressUQBb…z6Pz')).toBeVisible();
  await expect(page.getByText('CommentТестовый комментарий')).toBeVisible();
  await expect(page.locator('#react-portal-modal-container').getByRole('button').first()).toBeVisible();
  await page.getByRole('button', { name: 'Confirm and Send' }).click();
  await expect(page.getByText('Enter password')).toBeVisible();
  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(page.getByText('Failed to send transaction')).toBeVisible();
  await page.locator('#react-portal-modal-container').getByRole('button').click();
  await expect(page.getByText('Тестовый кошелёкUQAG…gyIOv4R2❣️')).toBeVisible();
});



test('Insufficient balance', async ({ page }) => {

  await page.goto('/');
  await page.getByRole('button', { name: 'Get started' }).click();
  await page.getByRole('button', { name: 'Existing Wallet Import wallet' }).click();
  await page.getByLabel('1:', { exact: true }).click();
  await page.getByLabel('1:', { exact: true }).fill(process.env.TON_MNEMONIC_24);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page
    .locator('div')
    .filter({ hasText: /^Password$/ })
    .getByRole('textbox')
    .fill('#$%^&^*^%*(&(');
  await page.getByRole('textbox').nth(1).click();
  await page.getByRole('textbox').nth(1).fill('#$%^&^*^%*(&(');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Wallet name').fill('Account ');
  await page.getByLabel('Wallet name').click();
  await page.getByLabel('Wallet name').fill('Тестовый кошелёк');
  await page.getByLabel('Wallet name').click();
  await page.locator('div:nth-child(1664)').click();
  await page.getByText('❣️').click();
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.locator('#root')).toContainText('TON');
  await expect(page.locator('#root')).toContainText('USD₮');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await page.getByRole('textbox').first().click();
  await page.getByRole('textbox').first().fill('oleganza.ton');
  await page.getByText('oleganza.ton').click();
  await page.getByRole('textbox').nth(1).click();
  await page.getByRole('textbox').nth(1).fill('Тестовый комментарий');
  await expect(page.getByText('UQBb…z6Pz')).toBeVisible();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByText('TONTON0.00 USD')).toBeVisible();
  await page.getByTestId('amount-input').fill('5');
  await expect(page.getByText('Insufficient balance')).toBeVisible();
  await page.locator('#react-portal-modal-container').getByRole('button').first().click();
  await expect(page.getByText('Тестовый кошелёкUQAG…gyIOv4R2❣️')).toBeVisible();

});

