import { test, expect } from '@playwright/test';

test.setTimeout(4 * 60 * 1000);
//Receive button from main screen header - receive TON
test('Receive for regular wallet', async ({ page }) => {
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
    .fill('dsbFbват^%*(&(');
  await page.getByRole('textbox').nth(1).click();
  await page.getByRole('textbox').nth(1).fill('dsbFbват^%*(&(');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Wallet name').fill('Тестовый wallet!008');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('heading', { name: 'Congratulations! You’ve set' })).toBeVisible();
  await expect(page.locator('#root')).toContainText('TON');
  await expect(page.locator('#root')).toContainText('USD₮');
  await page.getByRole('button', { name: 'Receive' }).click();
  await expect(page.getByRole('heading', { name: 'Receive Toncoin' })).toBeVisible();
  await expect(page.locator('#react-portal-modal-container').getByRole('button').first()).toBeVisible();
  await expect(page.getByText('Send only Toncoin TON and')).toBeVisible();
  await expect(page.locator('#react-portal-modal-container')).toContainText('Send only Toncoin TON and tokens in TON network to this address, or you might lose your funds.');
  await expect(page.locator('div').filter({ hasText: /^UQAGQbH3JD7nHMfe2LNIX9m35YHA6SnSF3BWqbz32vNcgyIO$/ })).toBeVisible();
  await expect(page.locator('#react-qrcode-logo')).toBeVisible();
  await expect(page.locator('#react-portal-modal-container')).toContainText('UQAGQbH3JD7nHMfe2LNIX9m35YHA6SnSF3BWqbz32vNcgyIO');
  await expect(page.getByRole('button', { name: 'Copy address' })).toBeVisible();
  await page.getByRole('button', { name: 'Copy address' }).click();
  await expect(page.getByText('Address copied')).toBeVisible();
  await page.locator('#react-portal-modal-container').getByRole('button').first().click();

  //Receive usdt from token screen
  await page.getByText('USD₮').nth(1).click();
  await expect(page.locator('div').filter({ hasText: /^USD₮$/ })).toBeVisible();
  await expect(page.getByText('SendReceiveSwap')).toBeVisible();
  await page.getByRole('button', { name: 'Receive' }).nth(1).click();
  await expect(page.getByRole('heading', { name: 'Receive Toncoin' })).toBeVisible();
  await expect(page.getByText('Send only Toncoin TON and')).toBeVisible();
  await expect(page.locator('div').filter({ hasText: /^UQAGQbH3JD7nHMfe2LNIX9m35YHA6SnSF3BWqbz32vNcgyIO$/ })).toBeVisible();
  await expect(page.getByText('UQAGQbH3JD7nHMfe2LNIX9m35YHA6SnSF3BWqbz32vNcgyIO')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Copy address' })).toBeVisible();
  await page.getByRole('button', { name: 'Copy address' }).click();
  await expect(page.getByText('Address copied')).toBeVisible();
  await page.locator('#react-portal-modal-container').getByRole('button').first().click();
  await expect(page.getByText('Тестовый wallet!008UQAG…gyIOv4R2👳‍♂️')).toBeVisible();

  //Receive TON from TON screen
  await page.getByRole('link', { name: 'Tokens' }).click();
  await page.getByText('TON').nth(2).click();
  await expect(page.getByText('SendReceiveSwapBuy')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Receive' }).nth(1)).toBeVisible();
  await expect(page.getByText('Toncoin')).toBeVisible();
  await page.getByRole('button', { name: 'Receive' }).nth(1).click();
  await expect(page.getByText('Receive ToncoinSend only')).toBeVisible();
  await expect(page.locator('div').filter({ hasText: /^UQAGQbH3JD7nHMfe2LNIX9m35YHA6SnSF3BWqbz32vNcgyIO$/ })).toBeVisible();
  await page.getByRole('button', { name: 'Copy address' }).click();
  await expect(page.getByText('Address copied')).toBeVisible();
  await page.locator('#react-portal-modal-container').getByRole('button').first().click();
  await expect(page.getByText('Тестовый wallet!008UQAG…gyIOv4R2👳‍♂️')).toBeVisible();
});



//Receive for multiwallet

test('Receive for multiwallet', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Get started' }).click();
  await page.getByRole('button', { name: 'Existing Wallet Import wallet' }).click();
  await page.getByLabel('1:', { exact: true }).click();
  await page.getByLabel('1:', { exact: true }).fill(process.env.TON_MNEMONIC_24_3);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.locator('#create-password').fill('tmY6V +# > ');
  await page.locator('#create-password-confirm').fill('tmY6V +# > ');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('heading', { name: 'Congratulations! You’ve set' })).toBeVisible();
  await page.getByRole('button', { name: 'Receive' }).click();
  await expect(page.getByText('Receive ToncoinSend only')).toBeVisible();
  await expect(page.locator('#react-portal-modal-container')).toContainText('Send only Toncoin TON and tokens in TON network to this address, or you might lose your funds.');
  await expect(page.locator('div').filter({ hasText: /^UQBjnlfd5OH9_w0AwXUddWM3zLVMdzh7d2JbUoJXrAtjEBRg$/ })).toBeVisible();
  await expect(page.locator('#react-portal-modal-container')).toContainText('UQBjnlfd5OH9_w0AwXUddWM3zLVMdzh7d2JbUoJXrAtjEBRg');
  await expect(page.getByRole('button', { name: 'Copy address' })).toBeVisible();
  await page.getByRole('button', { name: 'Copy address' }).click();
  await expect(page.getByText('Address copied')).toBeVisible();
  await page.locator('#react-portal-modal-container').getByRole('button').first().click();
  await page.getByText('USD₮').click();
  await expect(page.getByText('SendReceiveSwap')).toBeVisible();
  await expect(page.locator('div').filter({ hasText: /^USD₮$/ })).toBeVisible();
  await page.getByRole('button', { name: 'Receive' }).nth(1).click();
  await expect(page.locator('div').filter({ hasText: /^UQBjnlfd5OH9_w0AwXUddWM3zLVMdzh7d2JbUoJXrAtjEBRg$/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Copy address' })).toBeVisible();
  await page.getByRole('button', { name: 'Copy address' }).click();
  await expect(page.getByText('Address copied')).toBeVisible();
  await page.locator('#react-portal-modal-container').getByRole('button').first().click();
});