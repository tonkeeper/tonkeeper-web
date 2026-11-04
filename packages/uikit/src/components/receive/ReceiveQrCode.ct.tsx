import { expect, screenshotEachMode, test } from '../../../playwright/test';
import { ReceiveQrCode } from './ReceiveQrCode';
import IcChainTon20 from '../../icons/components/IcChainTon20';

const address = 'UQBHyu-oZVDHRYQ1-rKlGqpHy5yAqanPBirEQNMNOmfHLtaT';
const icon = (
    <div className="h-14 w-14 overflow-hidden rounded-full [&>svg]:h-14 [&>svg]:w-14">
        <IcChainTon20 />
    </div>
);

// The icon sits in a module-free square, so no dot is clipped at its edge;
// the square is one screenshot away from regressing back to an overlay.
screenshotEachMode(
    'ReceiveQrCode',
    () => (
        <div className="bg-constantWhite p-4">
            <ReceiveQrCode value={address} size={248} cutoutSize={80} icon={icon} />
        </div>
    ),
    ['desktop']
);

test('ReceiveQrCode leaves the centre free of modules', async ({ mount, page }) => {
    await mount(<ReceiveQrCode value={address} size={248} cutoutSize={80} icon={icon} />);
    const centred = await page.locator('circle').evaluateAll(nodes =>
        nodes.some(node => {
            const cx = Number(node.getAttribute('cx'));
            const cy = Number(node.getAttribute('cy'));
            return Math.abs(cx - 124) < 40 && Math.abs(cy - 124) < 40;
        })
    );
    expect(centred).toBe(false);
});
