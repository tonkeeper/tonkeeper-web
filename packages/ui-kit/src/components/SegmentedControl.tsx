import { cn } from '../utils/cn';

export interface SegmentedControlOption<V extends string = string> {
    value: V;
    label: string;
}

export interface SegmentedControlProps<V extends string = string> {
    options: SegmentedControlOption<V>[];
    value: V;
    onChange: (value: V) => void;
    className?: string;
}

/**
 * Equal-width segmented toggle on a dimmed track. Figma "Tab_bar"
 * (e.g. 3341:120987): overlay-extra-light track with 4px inset, the active
 * segment lifts on the tertiary-button surface.
 */
export function SegmentedControl<V extends string = string>({
    options,
    value,
    onChange,
    className
}: SegmentedControlProps<V>) {
    return (
        <div
            role="tablist"
            className={cn(
                'flex w-full rounded-[20px] bg-backgroundOverlayExtraLight p-1',
                className
            )}
        >
            {options.map(option => {
                const active = option.value === value;
                return (
                    <button
                        key={option.value}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => onChange(option.value)}
                        className={cn(
                            'min-w-[48px] flex-1 cursor-pointer rounded-2xl px-3 py-1.5 text-center text-label2 pressable',
                            active
                                ? 'bg-buttonSecondaryBackground text-buttonSecondaryForeground'
                                : // Translucent lift: on the dimmed track it has to
                                  // read as hovered without competing with the
                                  // active segment's solid surface.
                                  'text-buttonSecondaryForeground hover:bg-backgroundHighlighted'
                        )}
                    >
                        {option.label}
                    </button>
                );
            })}
        </div>
    );
}
