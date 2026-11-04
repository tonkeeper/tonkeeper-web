import { FC, MouseEvent as ReactMouseEvent, useEffect, useRef, useState } from 'react';

import IcInformationCircle16 from '../../../icons/components/IcInformationCircle16';
import { cn } from '../../../libs/css';

/**
 * A quick mouse sweep across the row shouldn't flash the bubble — hover
 * opens it only after the pointer lingers this long. Hiding and the
 * touch / keyboard toggle are instant.
 */
const HOVER_INTENT_MS = 150;

/**
 * Info affordance on a metric row label: the design-library information
 * glyph opening a small explainer bubble above it. Mouse users get it on
 * hover; touch / keyboard users toggle it (click events that originate
 * from a mouse are ignored so a click doesn't cancel the hover-opened
 * bubble). Any outside press dismisses a toggled bubble. Copy mirrors the
 * native apps' local hint strings.
 *
 * `align` picks which side of the glyph the bubble grows towards: `start`
 * for glyphs at the left of their row, `end` for glyphs near the right
 * edge of the modal so the bubble isn't clipped by it.
 */
export const MultichainHint: FC<{ label: string; text: string; align?: 'start' | 'end' }> = ({
    label,
    text,
    align = 'start'
}) => {
    const [open, setOpen] = useState(false);
    const wrapperRef = useRef<HTMLSpanElement>(null);
    const hoverTimerRef = useRef<ReturnType<typeof setTimeout>>();

    useEffect(() => {
        if (!open) return;
        const onPress = (e: MouseEvent) => {
            if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', onPress);
        return () => document.removeEventListener('mousedown', onPress);
    }, [open]);

    useEffect(() => () => clearTimeout(hoverTimerRef.current), []);

    const handleClick = (e: ReactMouseEvent) => {
        const pointerType = (e.nativeEvent as PointerEvent).pointerType;
        if (pointerType === 'mouse') return;
        setOpen(o => !o);
    };

    const handleEnter = () => {
        clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = setTimeout(() => setOpen(true), HOVER_INTENT_MS);
    };

    const handleLeave = () => {
        clearTimeout(hoverTimerRef.current);
        setOpen(false);
    };

    return (
        <span ref={wrapperRef} className="relative inline-flex">
            <button
                type="button"
                aria-label={label}
                aria-expanded={open}
                onClick={handleClick}
                onPointerEnter={e => e.pointerType === 'mouse' && handleEnter()}
                onPointerLeave={e => e.pointerType === 'mouse' && handleLeave()}
                className="flex items-center text-iconTertiary"
            >
                <IcInformationCircle16 className="size-4" />
            </button>
            {open && (
                <span
                    role="tooltip"
                    className={cn(
                        'absolute bottom-full z-30 mb-2 w-max max-w-[248px] rounded-xl bg-backgroundContentTint px-3 py-2 shadow-[0_4px_16px_rgba(0,0,0,0.16),0_16px_64px_rgba(0,0,0,0.16)]',
                        align === 'start' ? 'left-1/2 -translate-x-5' : 'right-1/2 translate-x-5'
                    )}
                >
                    <span
                        className={cn(
                            'absolute -bottom-1 size-2 rotate-45 bg-backgroundContentTint',
                            align === 'start' ? 'left-4' : 'right-4'
                        )}
                    />
                    <span className="block text-body3 text-textPrimary">{text}</span>
                </span>
            )}
        </span>
    );
};
