import { expect, test } from '../../playwright/test';

test('hosted brand font loads in component tests', async ({ mount, page }) => {
    await mount(<span style={{ fontFamily: 'TT Firs Neue', fontWeight: 450 }}>Keeper</span>);

    const loaded = await page.evaluate(async () => {
        const faces = await document.fonts.load('450 16px "TT Firs Neue"');
        return faces.some(face => face.family === 'TT Firs Neue' && face.status === 'loaded');
    });

    expect(loaded).toBe(true);
});
