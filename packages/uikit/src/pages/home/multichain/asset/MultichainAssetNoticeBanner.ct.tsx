import { expect, screenshot, test } from '../../../../../playwright/test';
import { MultichainAssetNoticeBanner } from './MultichainAssetNoticeBanner';

// Edge cases the screenshot suite targets:
//   - warning (orange) vs info (blue) variants tint both the strip and the
//     text from the same accent token.
//   - compact (desktop) renders a centered pill instead of the full-width
//     strip; the host is a flex column so `self-center` has effect.

screenshot('MultichainAssetNoticeBanner warning', () => (
    <div className="w-[390px] bg-backgroundPage">
        <MultichainAssetNoticeBanner
            variant="warning"
            text="This asset is an Unverified Token"
            onClick={() => {}}
        />
    </div>
));

screenshot('MultichainAssetNoticeBanner info', () => (
    <div className="w-[390px] bg-backgroundPage">
        <MultichainAssetNoticeBanner
            variant="info"
            text="This asset is a Tokenized Stock"
            onClick={() => {}}
        />
    </div>
));

screenshot('MultichainAssetNoticeBanner compact info pill', () => (
    <div className="flex w-[520px] flex-col bg-backgroundPage py-2">
        <MultichainAssetNoticeBanner
            variant="info"
            text="This asset is a Tokenized Stock"
            onClick={() => {}}
            compact
        />
    </div>
));

screenshot('MultichainAssetNoticeBanner compact warning pill', () => (
    <div className="flex w-[520px] flex-col bg-backgroundPage py-2">
        <MultichainAssetNoticeBanner
            variant="warning"
            text="This asset is an Unverified Token"
            onClick={() => {}}
            compact
        />
    </div>
));

test('MultichainAssetNoticeBanner fires onClick', async ({ mount }) => {
    let clicks = 0;
    const c = await mount(
        <div className="w-[390px] bg-backgroundPage">
            <MultichainAssetNoticeBanner variant="warning" text="Banner" onClick={() => clicks++} />
        </div>
    );
    await c.getByRole('button').click();
    expect(clicks).toBe(1);
});
