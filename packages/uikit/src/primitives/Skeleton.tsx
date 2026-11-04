import { CSSProperties, FC, ReactNode, createContext, useCallback, useContext } from 'react';

/**
 * Loading states mask the real component tree rather than rendering a parallel
 * skeleton layout: the page renders its normal children against a stub fixture,
 * and every element that would show a value paints as a bar instead. Paddings,
 * row heights, gaps and ordering therefore come from the production layout and
 * cannot drift out of sync with it.
 *
 * Bar dimensions are the one thing the layout cannot supply — the loading
 * mockups specify them per field, deliberately uniform where real content would
 * be ragged — so they are passed explicitly at each call site.
 */
const SkeletonContext = createContext(false);

export const useIsSkeleton = (): boolean => useContext(SkeletonContext);

export interface SkeletonBar {
    /** Bar width. Defaults to the element's own width. */
    w?: number | string;
    /** Bar height. Defaults to 12px. */
    h?: number | string;
    /** Corner radius. Defaults to 8px. */
    r?: number | string;
}

export interface SkeletonMaskProps {
    'data-skeleton'?: true;
    style?: CSSProperties;
}

export type SkeletonMask = (bar?: SkeletonBar) => SkeletonMaskProps;

const length = (value: number | string): string =>
    typeof value === 'number' ? `${value}px` : value;

/**
 * Returns a function producing the props that turn one element into a mask bar.
 * Spread it onto the element that renders the value — not onto a wrapper — so
 * the real line box keeps driving the vertical rhythm:
 *
 * ```tsx
 * const mask = useSkeletonMask();
 * <span {...mask({ w: 65 })} className="text-label2">{asset.symbol}</span>
 * ```
 *
 * Outside a loading {@link SkeletonScope} it returns no props at all, so the
 * same markup renders the real value untouched.
 *
 * Pass `loading` explicitly in the component that owns the query: its own
 * elements sit above the `SkeletonScope` it renders for its children, so they
 * are outside the context they establish.
 */
export const useSkeletonMask = (loading?: boolean): SkeletonMask => {
    const inherited = useIsSkeleton();
    const isLoading = loading ?? inherited;

    return useCallback(
        bar => {
            if (!isLoading) {
                return {};
            }

            const style: Record<string, string> = {};
            if (bar?.w !== undefined) style['--tk-skeleton-w'] = length(bar.w);
            if (bar?.h !== undefined) style['--tk-skeleton-h'] = length(bar.h);
            if (bar?.r !== undefined) style['--tk-skeleton-r'] = length(bar.r);

            // The bar is left-anchored on the host, so a host narrower than
            // its bar (a "0" placeholder under a 41px bar) would let the bar
            // bleed past its container. Reserving the bar's box keeps it
            // inside — and keeps centered/right-aligned hosts aligned.
            if (typeof bar?.w === 'number') style.minWidth = length(bar.w);
            if (typeof bar?.h === 'number') style.minHeight = length(bar.h);

            return { 'data-skeleton': true, style: style as CSSProperties };
        },
        [isLoading]
    );
};

/**
 * Marks its subtree as loading. Renders no DOM of its own — masking is driven by
 * the `data-skeleton` attribute {@link useSkeletonMask} emits, so wrapping a
 * flex child or a table row can never disturb the layout being masked.
 *
 * Nest it to mask part of a screen: a scope with `loading={false}` inside a
 * loading one reveals its subtree, which is how a header can show a real asset
 * name while the balance below it is still a bar.
 */
export const SkeletonScope: FC<{ loading: boolean; children: ReactNode }> = ({
    loading,
    children
}) => <SkeletonContext.Provider value={loading}>{children}</SkeletonContext.Provider>;
