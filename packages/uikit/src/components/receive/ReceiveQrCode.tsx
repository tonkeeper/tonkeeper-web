import { FC, ReactNode, useMemo } from 'react';
import qrcode from 'qrcode-generator';

interface ReceiveQrCodeProps {
    value: string;
    size: number;
    /** Side of the module-free square behind the icon, in px. */
    cutoutSize: number;
    icon: ReactNode;
}

const EYE_OUTER_RADIUS = 16;
const EYE_INNER_RADIUS = 2;
const DOT_SCALE = 0.75;

interface Grid {
    moduleCount: number;
    dark: boolean[][];
}

const buildGrid = (value: string): Grid => {
    const qr = qrcode(0, 'H');
    qr.addData(value);
    qr.make();
    const moduleCount = qr.getModuleCount();
    const dark = Array.from({ length: moduleCount }, (_row, row) =>
        Array.from({ length: moduleCount }, (_col, col) => qr.isDark(row, col))
    );
    return { moduleCount, dark };
};

const isInEye = (row: number, col: number, moduleCount: number) => {
    const inZone = (r0: number, c0: number) =>
        row >= r0 && row < r0 + 7 && col >= c0 && col < c0 + 7;
    return inZone(0, 0) || inZone(0, moduleCount - 7) || inZone(moduleCount - 7, 0);
};

/**
 * Level-H QR drawn as SVG dots with rounded finder patterns. The icon
 * sits on a square that is empty of modules — whole cells are dropped
 * rather than painted over, so no dot is clipped at its edge. The
 * square is snapped to the module grid and given the grid's parity so it
 * stays centred; level H tolerates the resulting loss.
 */
export const ReceiveQrCode: FC<ReceiveQrCodeProps> = ({ value, size, cutoutSize, icon }) => {
    const { moduleCount, dark } = useMemo(() => buildGrid(value), [value]);
    const cell = size / moduleCount;

    let cutoutCells = Math.ceil(cutoutSize / cell);
    if ((moduleCount - cutoutCells) % 2 !== 0) cutoutCells += 1;
    const cutoutStart = (moduleCount - cutoutCells) / 2;
    const cutoutPx = cutoutCells * cell;
    const isInCutout = (row: number, col: number) =>
        row >= cutoutStart &&
        row < cutoutStart + cutoutCells &&
        col >= cutoutStart &&
        col < cutoutStart + cutoutCells;

    const dots: ReactNode[] = [];
    for (let row = 0; row < moduleCount; row++) {
        for (let col = 0; col < moduleCount; col++) {
            if (!dark[row][col]) continue;
            if (isInEye(row, col, moduleCount) || isInCutout(row, col)) continue;
            dots.push(
                <circle
                    key={`${row}-${col}`}
                    cx={(col + 0.5) * cell}
                    cy={(row + 0.5) * cell}
                    r={(cell / 2) * DOT_SCALE}
                />
            );
        }
    }

    const eyeOuterRx = Math.max(EYE_OUTER_RADIUS - cell / 2, 0);
    const eyes = [
        [0, 0],
        [0, moduleCount - 7],
        [moduleCount - 7, 0]
    ].map(([row, col]) => {
        const x = col * cell;
        const y = row * cell;
        return (
            <g key={`${row}-${col}`}>
                <rect
                    x={x + cell / 2}
                    y={y + cell / 2}
                    width={cell * 6}
                    height={cell * 6}
                    rx={eyeOuterRx}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={cell}
                />
                <rect
                    x={x + cell * 2}
                    y={y + cell * 2}
                    width={cell * 3}
                    height={cell * 3}
                    rx={EYE_INNER_RADIUS}
                />
            </g>
        );
    });

    return (
        <div className="relative shrink-0" style={{ width: size, height: size }}>
            <svg
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                shapeRendering="geometricPrecision"
                className="fill-current text-constantBlack"
                aria-hidden
            >
                {eyes}
                {dots}
            </svg>
            <div
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center"
                style={{ width: cutoutPx, height: cutoutPx }}
            >
                {icon}
            </div>
        </div>
    );
};
