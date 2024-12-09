import { test, expect } from '@playwright/test';

//Add regular wallet, go to Preference tab
test.setTimeout(4 * 60 * 1000);

test('Preferences', async ({ page }) => {

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
  await page.getByLabel('Wallet name').fill('test wallet');
  await page.getByLabel('Wallet name').click();
  await page.getByText('👩‍💻').click();
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('heading', { name: 'Congratulations! You’ve set' })).toBeVisible();
  await expect(page.locator('div').filter({ hasText: /^Preferences$/ }).first()).toBeVisible();
  await page.locator('div').filter({ hasText: /^Preferences$/ }).click();
  await expect(page.getByRole('link', { name: 'Manage Wallets' })).toBeVisible();

  //Check links in header
  await expect(page.locator('div').filter({ hasText: 'FAQSupportTonkeeper news' }).nth(3)).toBeVisible();
  await expect(page.getByRole('button', { name: 'FAQ' })).toBeVisible();
  const page1Promise = page.waitForEvent('popup');
  await page.getByRole('button', { name: 'FAQ' }).click();
  const page1 = await page1Promise;
  await expect(page1.getByRole('link', { name: 'Tonkeeper Questions and' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Support' })).toBeVisible();
  await expect(page.locator('#root')).toContainText('Support');
  await page.getByRole('button', { name: 'Support' }).click();
  await page1.locator('div').filter({ hasText: 'Tonkeeper @tonkeeper' }).nth(1).click();
  await page1.locator('div').filter({ hasText: 'Download' }).nth(2).click();
  await expect(page1.locator('div').filter({ hasText: /^Tonkeeper$/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Tonkeeper news' })).toBeVisible();
  await expect(page.locator('#root')).toContainText('Tonkeeper news');
  await page.getByRole('button', { name: 'Tonkeeper news' }).click();
  await expect(page1.locator('div').filter({ hasText: 'Tonkeeper News' }).nth(3)).toBeVisible();

  //check Manage wallets elements
  await expect(page.getByRole('link', { name: 'Manage Wallets' })).toBeVisible();
  await expect(page.locator('#root')).toContainText('Manage Wallets');
  await expect(page.locator('div').filter({ hasText: /^Manage WalletsNew Folder$/ }).locator('span')).toBeVisible();
  await expect(page.getByText('👩‍💻test wallet')).toBeVisible();
  await expect(page.locator('#root')).toContainText('👩‍💻test wallet');
  await expect(page.getByText('UQAG…gyIOv4R2').nth(1)).toBeVisible();
  await expect(page.getByText('UQCk…yXNwv3R1').nth(1)).toBeVisible();
  await expect(page.getByRole('button', { name: 'New Folder' })).toBeVisible();
  await expect(page.locator('#root')).toContainText('New Folder');
  await expect(page.getByRole('button', { name: 'Add wallet' })).toBeVisible();
  await expect(page.locator('#root')).toContainText('Add wallet');

  //check Preferences sidebar elements
  await expect(page.getByRole('link', { name: 'Security' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Tonkeeper Pro' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Language English' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Currency USD' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Country Auto' })).toBeVisible();
  await expect(page.locator('div').filter({ hasText: /^Contact us$/ })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Legal' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Dev Menu' })).toBeVisible();
  await expect(page.locator('div').filter({ hasText: /^Sign Out$/ }).nth(1)).toBeVisible();

  //check links in sidebar
  await page.locator('div').filter({ hasText: /^Contact us$/ }).click();
  await page.getByRole('link', { name: 'Legal' }).click();
  await expect(page.getByRole('heading', { name: 'Legal' })).toBeVisible();
  await expect(page.locator('.sc-jNMdxs').first()).toBeVisible();
  await expect(page.locator('.sc-jNMdxs').first()).toBeVisible();
  await page.getByText('Terms of service').click();
  await expect(page1.getByRole('heading', { name: 'Terms of use' })).toBeVisible();
  await expect(page1.getByText('Terms of useLast updated on')).toBeVisible();
  await expect(page.getByText('Privacy policy')).toBeVisible();
  await page.locator('div').filter({ hasText: /^Privacy policy$/ }).nth(1).click();
  await expect(page1.getByRole('heading', { name: 'Privacy policy', exact: true })).toBeVisible();
  await expect(page1.getByText('Privacy policyEffective as of')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Licenses' })).toBeVisible();
  await expect(page.locator('div').filter({ hasText: /^Montserrat font$/ }).nth(2)).toBeVisible();
  await page.locator('div').filter({ hasText: /^Montserrat font$/ }).nth(2).click();
  await expect(page1.getByText('Privacy policyEffective as of')).toBeVisible();

  //check Security tab + change password
  await page.getByRole('link', { name: 'Security' }).click();
  await expect(page.locator('div').filter({ hasText: /^Security$/ }).nth(1)).toBeVisible();
  await expect(page.locator('div').filter({ hasText: /^Lock screen$/ }).nth(2)).toBeVisible();
  await expect(page.getByText('Change password')).toBeVisible();
  await page.locator('div').filter({ hasText: /^Change password$/ }).nth(2).click();
  await expect(page.locator('#react-portal-modal-container').getByText('Change password')).toBeVisible();
  await page.locator('div').filter({ hasText: /^Current password$/ }).nth(2).click();
  await page.getByLabel('Current password').fill('123456');
  await page.locator('div').filter({ hasText: /^Password$/ }).click();
  await page.getByLabel('Password', { exact: true }).fill('87654321');
  await page.locator('div').filter({ hasText: /^Re-enter password$/ }).nth(1).click();
  await page.getByLabel('Re-enter password').fill('87654321');
  await expect(page.getByText('Must be at least 6 characters.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Change' })).toBeVisible();
  await page.getByRole('button', { name: 'Change' }).click();
  await expect(page.getByText('Password Changed')).toBeVisible();

  //check Language tab 
  await page.getByRole('link', { name: 'Language English' }).click();
  await expect(page.locator('div').filter({ hasText: /^Language$/ })).toBeVisible();
  await expect(page.locator('div').filter({ hasText: /^EnglishEnglish$/ }).nth(1)).toBeVisible();
  await expect(page.locator('div').filter({ hasText: /^繁體中文Traditional Chinese$/ }).nth(1)).toBeVisible();
  await expect(page.locator('div').filter({ hasText: /^简体中文Simplified Chinese$/ }).nth(1)).toBeVisible();
  await expect(page.locator('div').filter({ hasText: /^IndonesiaIndonesian$/ }).nth(1)).toBeVisible();
  await expect(page.locator('div').filter({ hasText: /^РусскийRussian$/ }).nth(1)).toBeVisible();
  await expect(page.locator('div').filter({ hasText: /^ItalianoItalian$/ }).nth(1)).toBeVisible();
  await expect(page.locator('div').filter({ hasText: /^EspañolSpanish$/ }).nth(1)).toBeVisible();
  await expect(page.locator('div').filter({ hasText: /^УкраїнськаUkrainian$/ }).nth(1)).toBeVisible();
  await expect(page.locator('div').filter({ hasText: /^TürkçeTurkish$/ }).nth(1)).toBeVisible();
  await expect(page.locator('div').filter({ hasText: /^БългарскиBulgarian$/ }).nth(1)).toBeVisible();
  await expect(page.locator('div').filter({ hasText: /^O‘zbekUzbek$/ }).nth(1)).toBeVisible();
  await expect(page.locator('div').filter({ hasText: /^বাংলাBangla$/ }).nth(1)).toBeVisible();

  //check Currency tab - all currencies are visible, currence change is applied successfully
  await page.getByRole('link', { name: 'Currency USD' }).click();
  await expect(page.locator('div').filter({ hasText: /^Currency$/ })).toBeVisible();
  await expect(page.locator('div').filter({ hasText: /^USDUS Dollar$/ }).nth(1)).toBeVisible();
  await expect(page.locator('div').filter({ hasText: /^EUREuro$/ }).nth(1)).toBeVisible();
  await expect(page.locator('div').filter({ hasText: /^RUBRussian Ruble$/ }).nth(1)).toBeVisible();
  await expect(page.locator('div').filter({ hasText: /^AEDUnited Arab Emirates Dirham$/ }).nth(1)).toBeVisible();
  await expect(page.locator('div').filter({ hasText: /^KZTKazakhstani Tenge$/ }).nth(1)).toBeVisible();
  await expect(page.locator('div').filter({ hasText: /^UAHUkrainian Hryvnia$/ }).nth(1)).toBeVisible();
  await expect(page.locator('div').filter({ hasText: /^GBPBritish Pound$/ }).nth(1)).toBeVisible();
  await expect(page.locator('div').filter({ hasText: /^GBPBritish Pound$/ }).nth(1)).toBeVisible();
  await expect(page.locator('div').filter({ hasText: /^CHFSwiss Franc$/ }).nth(1)).toBeVisible();
  await expect(page.locator('div').filter({ hasText: /^CNYChinese Yuan$/ }).nth(1)).toBeVisible();
  await expect(page.locator('div').filter({ hasText: /^KRWSouth Korean Won$/ }).nth(1)).toBeVisible();
  await expect(page.locator('div').filter({ hasText: /^IDRIndonesian Rupiah$/ }).nth(1)).toBeVisible();
  await expect(page.locator('div').filter({ hasText: /^INRIndian Rupee$/ }).nth(1)).toBeVisible();
  await expect(page.locator('div').filter({ hasText: /^JPYJapanese Yen$/ }).nth(1)).toBeVisible();
  await expect(page.locator('div').filter({ hasText: /^TONToncoin$/ }).nth(1)).toBeVisible();
  await page.locator('div').filter({ hasText: /^GBPBritish Pound$/ }).nth(1).click();
  await expect(page.getByRole('link', { name: 'Currency GBP' })).toBeVisible();
  await page.locator('div').filter({ hasText: /^AEDUnited Arab Emirates Dirham$/ }).nth(1).click();
  await expect(page.getByRole('link', { name: 'Currency AED' })).toBeVisible();
  await page.locator('div').filter({ hasText: /^CNYChinese Yuan$/ }).nth(1).click();
  await page.getByRole('link', { name: 'Currency CNY' }).click();
  await page.locator('div').filter({ hasText: /^USDUS Dollar$/ }).nth(1).click();
  await expect(page.getByRole('link', { name: 'Currency USD' })).toBeVisible();

  //check Country tab 
  await page.getByRole('link', { name: 'Country Auto' }).click();
  await expect(page.getByRole('heading', { name: 'Country' })).toBeVisible();
  await expect(page.getByLabel('Search')).toBeVisible();
  await expect(page.locator('div').filter({ hasText: /^Auto$/ }).nth(2)).toBeVisible();
  await expect(page.locator('div').filter({ hasText: /^Bangladesh$/ }).nth(1)).toBeVisible();
  await expect(page.locator('div').filter({ hasText: /^Belgium$/ }).nth(1)).toBeVisible();
  await page.getByText('Sign Out').click();
  await page.locator('div').filter({ hasText: /^I have a backup copy of recovery phrase$/ }).locator('div').click();
  await page.getByRole('button', { name: 'Delete wallet data' }).click();
  await expect(page.getByRole('heading', { name: 'Welcome to Tonkeeper' })).toBeVisible();
});