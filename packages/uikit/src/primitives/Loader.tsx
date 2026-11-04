import { FC } from 'react';
import { cn } from '../libs/css';

export type LoaderSize = 'xSmall' | 'small' | 'medium';

const SIZE_PX: Record<LoaderSize, number> = { xSmall: 12, small: 16, medium: 24 };
const STROKE_PX: Record<LoaderSize, number> = { xSmall: 1.5, small: 2, medium: 2.5 };

export interface LoaderProps {
    size?: LoaderSize;
    className?: string;
}

export const Loader: FC<LoaderProps> = ({ size = 'medium', className }) => {
    const px = SIZE_PX[size];
    const stroke = STROKE_PX[size];
    const radius = (px - stroke) / 2;
    const circumference = 2 * Math.PI * radius;

    return (
        <span
            role="progressbar"
            aria-label="Loading"
            className={cn('inline-flex shrink-0 items-center justify-center', className)}
            style={{ width: px, height: px }}
        >
            <svg
                className="animate-spin"
                width={px}
                height={px}
                viewBox={`0 0 ${px} ${px}`}
                fill="none"
            >
                <circle
                    cx={px / 2}
                    cy={px / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeOpacity={0.24}
                    strokeWidth={stroke}
                />
                <circle
                    cx={px / 2}
                    cy={px / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference * 0.7}
                />
            </svg>
        </span>
    );
};
