import { FC, SVGProps } from 'react';
import { BatteryLevel } from '@tonkeeper/core/dist/utils/battery';

import { cn } from '../../../../libs/css';
import IcBattery1034 from '../../../../icons/components/IcBattery1034';
import IcBattery2534 from '../../../../icons/components/IcBattery2534';
import IcBattery5034 from '../../../../icons/components/IcBattery5034';
import IcBattery7534 from '../../../../icons/components/IcBattery7534';
import IcBattery10034 from '../../../../icons/components/IcBattery10034';
import IcEmptyBatteryAccentFlash34 from '../../../../icons/components/IcEmptyBatteryAccentFlash34';
import IcBattery044 from '../../../../icons/components/IcBattery044';
import IcBattery1044 from '../../../../icons/components/IcBattery1044';
import IcBattery2544 from '../../../../icons/components/IcBattery2544';
import IcBattery5044 from '../../../../icons/components/IcBattery5044';
import IcBattery7544 from '../../../../icons/components/IcBattery7544';
import IcBattery10044 from '../../../../icons/components/IcBattery10044';
import IcBattery10128 from '../../../../icons/components/IcBattery10128';
import IcBattery25128 from '../../../../icons/components/IcBattery25128';
import IcBattery50128 from '../../../../icons/components/IcBattery50128';
import IcBattery75128 from '../../../../icons/components/IcBattery75128';
import IcBattery100128 from '../../../../icons/components/IcBattery100128';
import IcEmptyBatteryAccentFlash128 from '../../../../icons/components/IcEmptyBatteryAccentFlash128';

export type BatteryIconSize = 34 | 44 | 128;

type Glyph = FC<SVGProps<SVGSVGElement>>;

const GLYPHS: Record<BatteryIconSize, Record<BatteryLevel, Glyph>> = {
    34: {
        negative: IcEmptyBatteryAccentFlash34,
        empty: IcEmptyBatteryAccentFlash34,
        10: IcBattery1034,
        25: IcBattery2534,
        50: IcBattery5034,
        75: IcBattery7534,
        100: IcBattery10034
    },
    44: {
        negative: IcBattery044,
        empty: IcBattery044,
        10: IcBattery1044,
        25: IcBattery2544,
        50: IcBattery5044,
        75: IcBattery7544,
        100: IcBattery10044
    },
    128: {
        negative: IcEmptyBatteryAccentFlash128,
        empty: IcEmptyBatteryAccentFlash128,
        10: IcBattery10128,
        25: IcBattery25128,
        50: IcBattery50128,
        75: IcBattery75128,
        100: IcBattery100128
    }
};

const SIZE_CLASSES: Record<BatteryIconSize, string> = {
    34: 'h-[34px] w-5',
    44: 'h-11 w-[26px]',
    128: 'size-32'
};

/**
 * Battery glyph from the design library at one of its three drawn sizes. The
 * body inherits the text colour (icon tertiary by default); the charge level is
 * painted with the accent tokens baked into the glyph, and the negative state
 * re-tints the flash red through the `--tk-battery-charge` hook the glyphs read.
 */
export const BatteryLevelIcon: FC<{
    level: BatteryLevel;
    size: BatteryIconSize;
    className?: string;
}> = ({ level, size, className }) => {
    const Glyph = GLYPHS[size][level];
    return (
        <Glyph
            aria-hidden
            className={cn(
                'shrink-0 text-iconTertiary',
                SIZE_CLASSES[size],
                level === 'negative' && '[--tk-battery-charge:var(--tk-accent-red)]',
                className
            )}
        />
    );
};
