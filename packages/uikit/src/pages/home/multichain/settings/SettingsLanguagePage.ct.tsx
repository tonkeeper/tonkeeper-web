import { expect, screenshotEachMode, test } from '../../../../../playwright/test';
import { SettingsLanguagePage, SettingsLanguagePageView } from './SettingsLanguagePage';

const noop = () => {};

screenshotEachMode('SettingsLanguagePage', () => (
    <SettingsLanguagePageView
        languages={['en', 'ru', 'it', 'es']}
        selected="en"
        onSelect={noop}
        onBack={noop}
    />
));

test('clicking a language row reports the selection', async ({ mount }) => {
    const selected: string[] = [];
    const c = await mount(
        <SettingsLanguagePageView
            languages={['en', 'ru']}
            selected="en"
            onSelect={language => selected.push(language)}
            onBack={noop}
        />
    );
    const english = c.getByRole('button', { name: /English/ });
    const russian = c.getByRole('button', { name: /Russian/ });

    await expect(english.locator('svg')).toBeVisible();
    await expect(russian.locator('svg')).toHaveCount(0);

    await russian.click();
    expect(selected).toEqual(['ru']);
});

test('page marks the current i18n language as selected', async ({ mount }) => {
    const c = await mount(<SettingsLanguagePage />);
    await expect(c.getByRole('button', { name: /English/ }).locator('svg')).toBeVisible();
});
