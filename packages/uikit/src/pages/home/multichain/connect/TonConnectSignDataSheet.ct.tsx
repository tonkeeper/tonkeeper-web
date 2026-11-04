import { expect, screenshotEachMode, test } from '../../../../../playwright/test';
import { SignDataPayloadCard } from './TonConnectSignDataSheet';

const CELL = 'te6cckEBAQEACwAAEhI0VnhoZWxsb76ua/E=';

screenshotEachMode(
    'SignDataPayloadCard text',
    () => (
        <div className="w-[358px]">
            <SignDataPayloadCard
                params={{ type: 'text', text: 'Sign in to app.example\nNonce: 7f3a91' }}
            />
        </div>
    ),
    ['desktop', 'mobile']
);

screenshotEachMode(
    'SignDataPayloadCard cell',
    () => (
        <div className="w-[358px]">
            <SignDataPayloadCard
                params={{
                    type: 'cell',
                    schema: 'message#12345678 text:Text = Message;',
                    cell: CELL
                }}
            />
        </div>
    ),
    ['desktop', 'mobile']
);

test('shows a cell payload decoded to its bits', async ({ mount }) => {
    const c = await mount(
        <div className="w-[358px]">
            <SignDataPayloadCard
                params={{
                    type: 'cell',
                    schema: 'message#12345678 text:Text = Message;',
                    cell: CELL
                }}
            />
        </div>
    );
    await expect(c.getByText('x{1234567868656C6C6F}')).toBeVisible();
});

test('warns about blind signing a binary payload', async ({ mount }) => {
    const c = await mount(
        <div className="w-[358px]">
            <SignDataPayloadCard params={{ type: 'binary', bytes: 'AQIDBA==' }} />
        </div>
    );
    await expect(c.getByText('AQIDBA==')).toBeVisible();
    await expect(
        c.getByText('You are signing blindly. Sign only from trusted sources.')
    ).toBeVisible();
});

test('marks hidden characters in a text payload', async ({ mount }) => {
    const c = await mount(
        <div className="w-[358px]">
            <SignDataPayloadCard params={{ type: 'text', text: 'pay‮eht' }} />
        </div>
    );
    await expect(c.getByText('pay[U+202E]eht')).toBeVisible();
});
