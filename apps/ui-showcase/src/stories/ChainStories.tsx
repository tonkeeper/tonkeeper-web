import { ChainBadgeOverlay, ChainChip, TokenSwitch } from '@tonkeeper/ui-kit';
import IcChainTon20 from '@tonkeeper/ui-kit/icons/IcChainTon20';
import IcChainEth20 from '@tonkeeper/ui-kit/icons/IcChainEth20';
import IcChainBtc20 from '@tonkeeper/ui-kit/icons/IcChainBtc20';
import IcChainBase20 from '@tonkeeper/ui-kit/icons/IcChainBase20';
import IcChainArb20 from '@tonkeeper/ui-kit/icons/IcChainArb20';
import IcChainBsc20 from '@tonkeeper/ui-kit/icons/IcChainBsc20';
import IcChainTron20 from '@tonkeeper/ui-kit/icons/IcChainTron20';
import { Cell, Cells, Group, Page, SampleTokenIcon, noop } from '../kit';

const CHAINS = [
    { name: 'TON', icon: <IcChainTon20 /> },
    { name: 'Ethereum', icon: <IcChainEth20 /> },
    { name: 'Bitcoin', icon: <IcChainBtc20 /> },
    { name: 'Base', icon: <IcChainBase20 /> },
    { name: 'Arbitrum', icon: <IcChainArb20 /> },
    { name: 'BNB Smart Chain', icon: <IcChainBsc20 /> },
    { name: 'Tron', icon: <IcChainTron20 /> }
];

export const ChainChipStory = () => (
    <Page
        title="ChainChip"
        description="Small caps tag naming the network next to a token."
        importLine="import { ChainChip } from '@tonkeeper/ui-kit'"
    >
        <Group title="Networks">
            <Cells>
                {CHAINS.map(c => (
                    <Cell key={c.name} label={c.name}>
                        <ChainChip label={c.name} />
                    </Cell>
                ))}
            </Cells>
        </Group>
        <Group title="In a row">
            <div className="flex items-center gap-1.5">
                <span className="text-label1 text-textPrimary">USDT</span>
                <ChainChip label="Tron" />
            </div>
        </Group>
    </Page>
);

export const ChainBadgeOverlayStory = () => (
    <Page
        title="ChainBadgeOverlay"
        description="Overlays a 20px network badge at the bottom-right of a 44px token icon, with a transparent 2px cutout. Native coins render without a badge."
        importLine="import { ChainBadgeOverlay } from '@tonkeeper/ui-kit'"
    >
        <Group title="Networks">
            <Cells>
                <Cell label="no badge (native)">
                    <ChainBadgeOverlay>
                        <SampleTokenIcon />
                    </ChainBadgeOverlay>
                </Cell>
                {CHAINS.map(c => (
                    <Cell key={c.name} label={c.name}>
                        <ChainBadgeOverlay icon={c.icon}>
                            <SampleTokenIcon />
                        </ChainBadgeOverlay>
                    </Cell>
                ))}
            </Cells>
        </Group>
    </Page>
);

export const TokenSwitchStory = () => (
    <Page
        title="TokenSwitch"
        description="Pill showing the selected asset; opens the asset picker. Tokens carry a 12px network badge."
        importLine="import { TokenSwitch } from '@tonkeeper/ui-kit'"
    >
        <Group title="Variants">
            <Cells>
                <Cell label="native (no badge)">
                    <TokenSwitch icon={<IcChainTon20 />} symbol="GRAM" onClick={noop} />
                </Cell>
                <Cell label="chainBadge">
                    <TokenSwitch
                        icon={<SampleTokenIcon size={24} />}
                        chainBadge={<IcChainEth20 />}
                        symbol="USDC"
                        onClick={noop}
                    />
                </Cell>
                <Cell label="disabled">
                    <TokenSwitch
                        icon={<SampleTokenIcon size={24} />}
                        chainBadge={<IcChainTron20 />}
                        symbol="USDT"
                        disabled
                    />
                </Cell>
            </Cells>
        </Group>
    </Page>
);
