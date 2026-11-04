import BigNumber from 'bignumber.js';

import { MultichainWalletAsset } from '@tonkeeper/core/dist/service/multichainWalletService';

import { expect, screenshot, test } from '../../../../playwright/test';
import { SendConfirmScreen } from './SendConfirmScreen';
import { ConfirmButtonStub } from './SendConfirmScreenHarness';
import { SendConfirmView } from './SendConfirmView';
import { NetworkFeeValue } from './NetworkFeeValue';
import { MultichainSendState } from './multichainSendShared';

const noop = () => {};

const TON: MultichainWalletAsset = {
    assetId: 'ton/mainnet/coin',
    chain: 'ton',
    name: 'Toncoin',
    symbol: 'TON',
    decimals: 9,
    image: '',
    balance: '33510000000',
    verification: 'whitelist',
    isHidden: false,
    price: new BigNumber('1.57')
};

const USDT: MultichainWalletAsset = {
    assetId: 'ton/mainnet/jetton/EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs',
    chain: 'ton',
    name: 'Tether USD',
    symbol: 'USD₮',
    decimals: 6,
    image: '',
    balance: '25000000',
    verification: 'whitelist',
    isHidden: false,
    price: new BigNumber('1')
};

const STATE: MultichainSendState = {
    asset: TON,
    toAddress: 'EQDtR_gykQ0K0W11a0I51m8G_aIC_epBTaLMO7L9aQPfOwzo',
    amount: 1_500_000_000n,
    amountDisplay: '1.5',
    from: 'wallet_screen',
    isMax: false,
    comment: 'Thanks!'
};

const FRAME = 'w-[390px] bg-backgroundPage p-4';

// The confirm screen is screenshotted via its pure body (`SendConfirmView`):
// the container's network fee is an async chain-kit estimate that can't resolve
// deterministically in a component test, so the view lets us pin a resolved fee
// and a stable action. One screenshot per state (no breakpoint-dependent layout
// of its own).
screenshot('SendConfirm full', () => (
    <div className={FRAME}>
        <SendConfirmView
            asset={TON}
            accountName="Account 1"
            toAddress={STATE.toAddress}
            amountDisplay="1.5"
            amountFiat="$2.36"
            comment="Thanks!"
            feeLabel="Fee"
            fee={<NetworkFeeValue value="0.000262 TON" />}
            feeSub="$0.000262"
            action={<ConfirmButtonStub />}
        />
    </div>
));

screenshot('SendConfirm resolved domain', () => (
    <div className={FRAME}>
        <SendConfirmView
            asset={TON}
            accountName="Account 1"
            toAddress={STATE.toAddress}
            toDomain="foundation.ton"
            amountDisplay="1.5"
            amountFiat="$2.36"
            feeLabel="Fee"
            fee={<NetworkFeeValue value="0.000262 TON" />}
            feeSub="$0.000262"
            action={<ConfirmButtonStub />}
        />
    </div>
));

screenshot('SendConfirm fee error', () => (
    <div className={FRAME}>
        <SendConfirmView
            asset={TON}
            accountName="Account 1"
            toAddress={STATE.toAddress}
            amountDisplay="1.5"
            amountFiat="$2.36"
            feeLabel="Fee"
            fee={<NetworkFeeValue error onRetry={noop} />}
            feeError
            action={<ConfirmButtonStub disabled />}
        />
    </div>
));

screenshot('SendConfirm fee method picker', () => (
    <div className={FRAME}>
        <SendConfirmView
            asset={USDT}
            accountName="Account 1"
            toAddress={STATE.toAddress}
            amountDisplay="10"
            amountFiat="$10.00"
            feeLabel="Network fee"
            fee={<NetworkFeeValue value="$0.00154" unit="TON" onChange={noop} />}
            action={<ConfirmButtonStub />}
        />
    </div>
));

// The screenshots above cover the visuals via the pure `SendConfirmView`. These
// mount the full `SendConfirmScreen` container (hooks + Modal) and assert only
// the summary built synchronously from `state` — the network fee is an async
// estimate that isn't resolvable in a component test.
test('SendConfirm renders the transfer summary from the send state', async ({ mount, page }) => {
    await mount(<SendConfirmScreen isOpen state={STATE} onClose={noop} onBack={noop} />);
    await expect(page.getByText('Confirm Action')).toBeVisible();
    await expect(page.getByText('1.5 TON')).toBeVisible();
    await expect(page.getByText('Thanks!')).toBeVisible();
    // Recipient is shown truncated (head 6 … tail 4).
    await expect(page.getByText('EQDtR_…Owzo')).toBeVisible();
});

test('SendConfirm shows the typed domain above the resolved address', async ({ mount, page }) => {
    await mount(
        <SendConfirmScreen
            isOpen
            state={{ ...STATE, toDomain: 'foundation.ton' }}
            onClose={noop}
            onBack={noop}
        />
    );
    await expect(page.getByText('foundation.ton')).toBeVisible();
    await expect(page.getByText('EQDtR_…Owzo')).toBeVisible();
    await expect(page.getByText('Recipient')).toHaveCount(2);
});

test('SendConfirm omits the comment row when there is no comment', async ({ mount, page }) => {
    await mount(
        <SendConfirmScreen
            isOpen
            state={{ ...STATE, comment: undefined }}
            onClose={noop}
            onBack={noop}
        />
    );
    await expect(page.getByText('1.5 TON')).toBeVisible();
    await expect(page.getByText('Thanks!')).toHaveCount(0);
});
