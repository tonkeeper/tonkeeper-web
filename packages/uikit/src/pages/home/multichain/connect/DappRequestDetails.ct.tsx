import { expect, screenshotEachMode, test } from '../../../../../playwright/test';
import { DappRequestDetails } from './DappRequestDetails';

const SIGNER = '0x9858EfFD232B4033E47d90003D41EC34EcaEda94';
const TOKEN = '0xdAC17F958D2ee523a2206206994597C13D831ec7';
const SPENDER = '0x1111111111111111111111111111111111111111';
const word = (hex: string) => hex.replace(/^0x/, '').padStart(64, '0');
const MAX_UINT256 = 'f'.repeat(64);

const base = {
    topic: 'topic-1',
    id: 1,
    network: 'eth',
    caipChain: 'eip155:1',
    address: SIGNER
} as const;

const unlimitedApprove = {
    ...base,
    kind: 'eth_signTransaction',
    transaction: {
        from: SIGNER,
        to: TOKEN,
        data: `0x095ea7b3${word(SPENDER)}${MAX_UINT256}`,
        gas: '0xea60',
        gasPrice: '0x3b9aca00',
        nonce: '0x1'
    }
} as const;

const unknownCall = {
    ...base,
    kind: 'eth_signTransaction',
    transaction: {
        from: SIGNER,
        to: TOKEN,
        value: '0x0',
        data: '0xdeadbeef',
        gas: '0x5208',
        maxFeePerGas: '0x3b9aca00',
        nonce: '0x1'
    }
} as const;

// Unlimited approval: decoded action, full spender, red allowance + notice.
screenshotEachMode(
    'DappRequestDetails unlimited approve',
    () => (
        <div className="w-[358px]">
            <DappRequestDetails
                request={unlimitedApprove}
                account={undefined}
                dappUrl="https://app.example"
            />
        </div>
    ),
    ['desktop', 'mobile']
);

// Undecodable call: blind-signing notice with the calldata in the open, and
// the dApp-set fee for eth_signTransaction.
screenshotEachMode(
    'DappRequestDetails unknown call',
    () => (
        <div className="w-[358px]">
            <DappRequestDetails
                request={unknownCall}
                account={undefined}
                dappUrl="https://app.example"
            />
        </div>
    ),
    ['desktop', 'mobile']
);

test('shows a zero amount, full contract and the decoded unlimited approval', async ({ mount }) => {
    const c = await mount(
        <div className="w-[358px]">
            <DappRequestDetails request={unlimitedApprove} account={undefined} />
        </div>
    );
    await expect(c.getByText('0 ETH')).toBeVisible();
    await expect(c.getByText(TOKEN)).toBeVisible();
    await expect(c.getByText('Approve token spending')).toBeVisible();
    await expect(c.getByText(SPENDER, { exact: true })).toBeVisible();
    await expect(c.getByText('Unlimited')).toBeVisible();
});

test('keeps undecodable calldata visible and shows the fee the dApp set', async ({ mount }) => {
    const c = await mount(
        <div className="w-[358px]">
            <DappRequestDetails request={unknownCall} account={undefined} />
        </div>
    );
    await expect(c.getByText('0xdeadbeef')).toBeVisible();
    await expect(c.getByText('Provided by dApp')).toBeVisible();
    await expect(c.getByText(/0\.000021 ETH/)).toBeVisible();
});

test('marks hidden characters in a personal_sign message', async ({ mount }) => {
    const c = await mount(
        <div className="w-[358px]">
            <DappRequestDetails
                request={{ ...base, kind: 'personal_sign', message: 'pay‮eht' }}
                account={undefined}
            />
        </div>
    );
    await expect(c.getByText('pay[U+202E]eht')).toBeVisible();
});

test('labels a request without a recipient as a contract deployment', async ({ mount }) => {
    const c = await mount(
        <div className="w-[358px]">
            <DappRequestDetails
                request={{
                    ...base,
                    kind: 'eth_signTransaction',
                    transaction: { from: SIGNER, data: '0x6080', gas: '0x1', gasPrice: '0x1' }
                }}
                account={undefined}
            />
        </div>
    );
    await expect(c.getByText('Contract deployment')).toBeVisible();
    await expect(c.getByText('0x6080')).toBeVisible();
});

test('shows the contract, recipient and amount of a TRC-20 transfer', async ({ mount }) => {
    const c = await mount(
        <div className="w-[358px]">
            <DappRequestDetails
                request={{
                    ...base,
                    network: 'tron',
                    caipChain: 'tron:0x2b6653dc',
                    address: 'TUEZSdKsoDHQMeZwihtdoBiN46zxhGWYdH',
                    kind: 'tron_signTransaction',
                    transaction: {
                        txID: 'b48cceda787daced82d2ba552054bb6970749e4804f2132fee4ec74a3bcdc7cf',
                        raw_data_hex:
                            '0a02abcd2208010203040506070840c09fbaffbc315aae01081f12a9010a31747970652e676f6f676c65617069732e636f6d2f70726f746f636f6c2e54726967676572536d617274436f6e747261637412740a1541c8599111f29c1e1e061265b4af93ea1f274ad78a121541a614f803b6fd780986a42c78ec9c7f77e6ded13c2244a9059cbb000000000000000000000000859009fd225692b11237a6ffd8fdba2eb7140cca00000000000000000000000000000000000000000000000000000000004c4b407080d095ffbc31900180a3c347'
                    }
                }}
                account={undefined}
            />
        </div>
    );
    await expect(c.getByText('TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t')).toBeVisible();
    await expect(c.getByText('Token transfer')).toBeVisible();
    await expect(c.getByText('TN9RRaXkCFtTXRso2GdTZxSxxwufzxLQPP', { exact: true })).toBeVisible();
    await expect(c.getByText('5,000,000')).toBeVisible();
});

test('names a TRON contract it does not decode and warns before signing it', async ({ mount }) => {
    const c = await mount(
        <div className="w-[358px]">
            <DappRequestDetails
                request={{
                    ...base,
                    network: 'tron',
                    caipChain: 'tron:0x2b6653dc',
                    address: 'TUEZSdKsoDHQMeZwihtdoBiN46zxhGWYdH',
                    kind: 'tron_signTransaction',
                    transaction: {
                        txID: '147ea6896f841a4afc870b6b4dc213f3c7dd67919f970e4e42d54d2e2ee3340c',
                        raw_data_hex:
                            '0a02abcd2208010203040506070840c09fbaffbc315a59083612550a34747970652e676f6f676c65617069732e636f6d2f70726f746f636f6c2e467265657a6542616c616e63655632436f6e7472616374121d0a1541c8599111f29c1e1e061265b4af93ea1f274ad78a10c0843d18017080d095ffbc31'
                    }
                }}
                account={undefined}
            />
        </div>
    );
    await expect(c.getByText('FreezeBalanceV2Contract')).toBeVisible();
    await expect(c.getByText(/can't fully decode what this transaction does/)).toBeVisible();
});
