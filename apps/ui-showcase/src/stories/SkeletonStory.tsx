import { FC, useState } from 'react';
import {
    ChainBadgeOverlay,
    IconButton,
    SkeletonScope,
    Switch,
    useSkeletonMask
} from '@tonkeeper/ui-kit';
import IcChainEth20 from '@tonkeeper/ui-kit/icons/IcChainEth20';
import IcArrowUp28 from '@tonkeeper/ui-kit/icons/IcArrowUp28';
import IcArrowDown28 from '@tonkeeper/ui-kit/icons/IcArrowDown28';
import { Group, Page, SampleTokenIcon } from '../kit';

const TokenRow: FC = () => {
    const mask = useSkeletonMask();
    return (
        <div className="flex items-center gap-3 px-4 py-2">
            <div {...mask({ w: 44, h: 44, r: 22 })}>
                <ChainBadgeOverlay icon={<IcChainEth20 />}>
                    <SampleTokenIcon />
                </ChainBadgeOverlay>
            </div>
            <div className="flex grow flex-col">
                <span {...mask({ w: 65 })} className="text-label1 text-textPrimary">
                    USDC
                </span>
                <span {...mask({ w: 90 })} className="text-body2 text-textSecondary">
                    $1.00
                </span>
            </div>
            <div className="flex flex-col items-end">
                <span {...mask({ w: 60 })} className="text-label1 text-textPrimary">
                    1,250.00
                </span>
                <span {...mask({ w: 40 })} className="text-body2 text-textSecondary">
                    $1,250
                </span>
            </div>
        </div>
    );
};

export const SkeletonStory = () => {
    const [loading, setLoading] = useState(true);
    return (
        <Page
            title="Skeleton"
            description="Loading states mask the real layout instead of drawing a separate one: inside a loading SkeletonScope, each element marked with useSkeletonMask paints as a bar of the given size."
            importLine="import { SkeletonScope, useSkeletonMask } from '@tonkeeper/ui-kit'"
        >
            <Group title="Masked vs loaded">
                <div className="flex flex-col gap-4">
                    <label className="flex items-center gap-3 text-body2 text-textSecondary">
                        <Switch checked={loading} onChange={setLoading} />
                        loading
                    </label>
                    <SkeletonScope loading={loading}>
                        <div className="flex max-w-[420px] flex-col gap-4 rounded-medium bg-backgroundPage py-4">
                            <div className="flex justify-center gap-2">
                                <IconButton icon={<IcArrowUp28 />} label="Send" />
                                <IconButton icon={<IcArrowDown28 />} label="Receive" />
                            </div>
                            <TokenRow />
                            <TokenRow />
                        </div>
                    </SkeletonScope>
                </div>
            </Group>
        </Page>
    );
};
