import { expect, screenshotEachMode, test } from '../../../../../playwright/test';
import { StakingAmountScreenStory } from './StakingAmountScreenStory';

const MAX = '9999.22';

// Full-screen flow modal — the body is portaled, so screenshot the dialog and
// capture both breakpoints (the modal card sizes to the viewport).
screenshotEachMode(
    'StakingAmount empty',
    () => <StakingAmountScreenStory />,
    ['desktop', 'mobile'],
    { target: 'dialog' }
);

screenshotEachMode(
    'StakingAmount insufficient',
    () => <StakingAmountScreenStory variant="insufficient" />,
    ['desktop', 'mobile'],
    { target: 'dialog' }
);

// A 40-digit amount must stay clipped to the hero card: the input scrolls to
// the caret and the fiat pill truncates instead of spilling past the card.
screenshotEachMode(
    'StakingAmount long amount',
    () => <StakingAmountScreenStory variant="long" />,
    ['desktop', 'mobile'],
    { target: 'dialog' }
);

test('MAX toggles the full amount in and out', async ({ mount, page }) => {
    await mount(<StakingAmountScreenStory />);
    const input = page.getByRole('textbox', { name: 'Stake' });
    await page.getByRole('button', { name: 'MAX' }).click();
    await expect(input).toHaveValue(MAX);
    await page.getByRole('button', { name: 'MAX' }).click();
    await expect(input).toHaveValue('');
});

test('typing resets MAX and continue passes the parsed amount', async ({ mount, page }) => {
    await mount(<StakingAmountScreenStory />);
    const input = page.getByRole('textbox', { name: 'Stake' });
    const continueButton = page.getByRole('button', { name: 'Continue' });

    await expect(continueButton).toBeDisabled();
    await input.fill('4784');
    await expect(continueButton).toBeEnabled();
    await continueButton.click();
    await expect(page.getByTestId('staking-amount-story')).toHaveAttribute(
        'data-result',
        '4784:false'
    );
});

test('rejects non-decimal input and disables continue when over balance', async ({
    mount,
    page
}) => {
    await mount(<StakingAmountScreenStory />);
    const input = page.getByRole('textbox', { name: 'Stake' });

    await input.fill('abc');
    await expect(input).toHaveValue('');

    await input.fill('14788');
    await expect(page.getByText('Insufficient balance')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue' })).toBeDisabled();
});

test('MAX explains the reserve it holds back', async ({ mount, page }) => {
    await mount(<StakingAmountScreenStory withReserveHints />);
    const hint = page.getByText('Max is your balance minus a 1.1 GRAM reserve', { exact: false });
    await expect(hint).toHaveCount(0);
    await page.getByRole('button', { name: 'MAX' }).click();
    await expect(hint).toBeVisible();
    await page.getByRole('textbox', { name: 'Stake' }).fill('100');
    await expect(hint).toHaveCount(0);
});

test('insufficient balance offers the reserve explainer', async ({ mount, page }) => {
    await mount(<StakingAmountScreenStory withReserveHints />);
    await page.getByRole('textbox', { name: 'Stake' }).fill('9999.3');
    await page.getByRole('button', { name: 'Insufficient balance' }).hover();
    await expect(page.getByRole('tooltip')).toHaveText(
        'You need to leave a 1.1 GRAM reserve, which will be returned after staking.'
    );
});
