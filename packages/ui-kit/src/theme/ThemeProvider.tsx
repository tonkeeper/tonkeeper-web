import {
    createContext,
    FC,
    ReactNode,
    useContext,
    useEffect,
    useLayoutEffect,
    useMemo,
    useState
} from 'react';
import {
    COLOR_PALETTES,
    COLOR_TOKENS,
    ColorPalette,
    ColorThemeName,
    ColorToken
} from './colorThemes';

/**
 * `desktop` centres modals as cards; `mobile` presents them as bottom sheets.
 */
export type Layout = 'desktop' | 'mobile';

export const MOBILE_LAYOUT_QUERY = '(max-width: 1023px)';

export interface ThemeContextValue {
    theme: ColorThemeName;
    palette: ColorPalette;
    layout?: Layout;
}

const ThemeContext = createContext<ThemeContextValue>({
    theme: 'blue',
    palette: COLOR_PALETTES.blue
});

export const useColorTheme = () => useContext(ThemeContext);

const readMediaLayout = (): Layout =>
    typeof window !== 'undefined' && window.matchMedia(MOBILE_LAYOUT_QUERY).matches
        ? 'mobile'
        : 'desktop';

/**
 * The layout set on `ThemeProvider`, or — when the host leaves it unset — the
 * one the viewport width implies.
 */
export const useLayout = (): Layout => {
    const { layout } = useContext(ThemeContext);
    const [mediaLayout, setMediaLayout] = useState(readMediaLayout);

    useEffect(() => {
        if (layout) return undefined;
        const mql = window.matchMedia(MOBILE_LAYOUT_QUERY);
        const onChange = () => setMediaLayout(readMediaLayout());
        onChange();
        mql.addEventListener('change', onChange);
        return () => mql.removeEventListener('change', onChange);
    }, [layout]);

    return layout ?? mediaLayout;
};

export interface ThemeProviderProps {
    theme: ColorThemeName;
    /** Overrides the viewport-width default of {@link useLayout}. */
    layout?: Layout;
    children: ReactNode;
}

/**
 * Writes the palette onto `:root` rather than a wrapper element: modals and
 * toasts portal into `body`, outside any subtree this provider renders.
 */
export const ThemeProvider: FC<ThemeProviderProps> = ({ theme, layout, children }) => {
    const palette = COLOR_PALETTES[theme];

    useLayoutEffect(() => {
        const root = document.documentElement;
        for (const token of Object.keys(palette) as ColorToken[]) {
            root.style.setProperty(COLOR_TOKENS[token].cssVar, palette[token]);
        }
        root.style.colorScheme = theme === 'light' ? 'light' : 'dark';
    }, [theme, palette]);

    const value = useMemo(() => ({ theme, palette, layout }), [theme, palette, layout]);

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
