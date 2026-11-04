import { FC } from 'react';
import { cn } from '../libs/css';

export type PasscodeDotsState = 'typing' | 'correct' | 'wrong';

/**
 * Passcode progress row: one 12px dot per digit. While typing, entered dots
 * fill with the accent and the latest one is enlarged to 16px; a correct
 * code turns every dot green at 16px, a wrong one red with a shake. The
 * enlargement is a transform so the row never changes size.
 */
export const PasscodeDots: FC<{
    length: number;
    filled: number;
    state?: PasscodeDotsState;
    className?: string;
}> = ({ length, filled, state = 'typing', className }) => (
    <div className={cn('flex items-center gap-4', state === 'wrong' && 'animate-shake', className)}>
        {Array.from({ length }, (_, index) => {
            const isFilled = index < filled;
            const isEnlarged = state === 'correct' || (state === 'typing' && index === filled - 1);
            return (
                <span
                    key={index}
                    className={cn(
                        'size-3 rounded-full transition-[transform,background-color,opacity] duration-200',
                        isEnlarged && 'scale-[1.3333]',
                        state === 'correct'
                            ? 'bg-accentGreen'
                            : state === 'wrong'
                            ? 'bg-accentRed'
                            : isFilled
                            ? 'bg-accentBlue'
                            : 'bg-iconSecondary opacity-[0.24]'
                    )}
                />
            );
        })}
    </div>
);
