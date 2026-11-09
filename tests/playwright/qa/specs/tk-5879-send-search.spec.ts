import { expect, test } from '../fixtures';

/** Read-only: opens Send on wallet A and searches the asset picker. Nothing is signed. */
test('send picker: usdt finds USD₮ through the backend search', async ({ walletA }, testInfo) => {
    const page = walletA;
    const searches: string[] = [];
    page.on('request', request => {
        const url = new URL(request.url());
        if (/\/api\/v1\/wallets\/[^/]+\/assets$/.test(url.pathname)) {
            searches.push(url.search);
        }
    });

    await page.getByRole('button', { name: 'Send', exact: true }).click();
    const dialog = page.getByRole('dialog');
    const search = page.getByPlaceholder('Search by ticker or name');
    await expect(search).toBeVisible({ timeout: 30_000 });
    await expect(dialog.getByRole('button', { name: /USD₮/ }).first()).toBeVisible({
        timeout: 30_000
    });
    await page.waitForTimeout(1_000);
    await testInfo.attach('1-picker-open', {
        body: await page.screenshot(),
        contentType: 'image/png'
    });

    await search.pressSequentially('usdt', { delay: 120 });
    await expect.poll(() => searches.some(q => q.includes('search=usdt'))).toBe(true);
    const rows = dialog.getByRole('button', { name: /USD₮/ });
    await expect(rows.first()).toBeVisible({ timeout: 30_000 });
    await expect(dialog.getByText('No assets found')).toHaveCount(0);
    await page.waitForTimeout(1_000);
    await testInfo.attach('2-search-usdt', {
        body: await page.screenshot(),
        contentType: 'image/png'
    });

    const rowTexts = await rows.allInnerTexts();
    await testInfo.attach('summary', {
        body: [
            `USD₮ rows for "usdt": ${rowTexts.length}`,
            ...rowTexts.map(t => `- ${t.replace(/\s+/g, ' ').trim()}`),
            '',
            'wallet assets requests:',
            ...searches
        ].join('\n'),
        contentType: 'text/plain'
    });
});
