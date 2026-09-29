import { FC, useEffect, useState } from 'react';
import {
    COLOR_THEMES,
    ColorThemeName,
    SegmentedControl,
    ThemeProvider,
    cn
} from '@tonkeeper/ui-kit';
import { ColorsPage } from './foundations/ColorsPage';
import { TypographyPage } from './foundations/TypographyPage';
import { RadiiPage } from './foundations/RadiiPage';
import { IconsPage } from './foundations/IconsPage';
import { ButtonStory } from './stories/ButtonStory';
import {
    AddRemoveButtonStory,
    HeaderButtonsStory,
    IconButtonStory,
    LinkStory
} from './stories/ActionStories';
import { LoaderStory, ToastStory } from './stories/FeedbackStories';
import {
    CheckboxStory,
    RadioStory,
    SegmentedControlStory,
    SwitchStory
} from './stories/SelectionStories';
import {
    FieldWordStory,
    InputStory,
    SearchFieldStory,
    TextAreaStory
} from './stories/FieldStories';
import { ChainBadgeOverlayStory, ChainChipStory, TokenSwitchStory } from './stories/ChainStories';
import { ModalStory } from './stories/ModalStory';
import { DropdownStory } from './stories/DropdownStory';
import { SkeletonStory } from './stories/SkeletonStory';

const SECTIONS: { title: string; pages: { id: string; title: string; Component: FC }[] }[] = [
    {
        title: 'Foundations',
        pages: [
            { id: 'colors', title: 'Colors', Component: ColorsPage },
            { id: 'typography', title: 'Typography', Component: TypographyPage },
            { id: 'radius', title: 'Corner radius', Component: RadiiPage },
            { id: 'icons', title: 'Icons', Component: IconsPage }
        ]
    },
    {
        title: 'Actions',
        pages: [
            { id: 'button', title: 'Button', Component: ButtonStory },
            { id: 'icon-button', title: 'IconButton', Component: IconButtonStory },
            { id: 'link', title: 'Link', Component: LinkStory },
            {
                id: 'header-buttons',
                title: 'BackButton / CloseButton',
                Component: HeaderButtonsStory
            },
            { id: 'add-remove-button', title: 'AddRemoveButton', Component: AddRemoveButtonStory },
            { id: 'token-switch', title: 'TokenSwitch', Component: TokenSwitchStory }
        ]
    },
    {
        title: 'Inputs',
        pages: [
            { id: 'input', title: 'Input', Component: InputStory },
            { id: 'textarea', title: 'TextArea', Component: TextAreaStory },
            { id: 'search-field', title: 'SearchField', Component: SearchFieldStory },
            { id: 'field-word', title: 'FieldWord', Component: FieldWordStory }
        ]
    },
    {
        title: 'Selection',
        pages: [
            { id: 'checkbox', title: 'Checkbox', Component: CheckboxStory },
            { id: 'radio', title: 'Radio', Component: RadioStory },
            { id: 'switch', title: 'Switch', Component: SwitchStory },
            {
                id: 'segmented-control',
                title: 'SegmentedControl',
                Component: SegmentedControlStory
            },
            { id: 'dropdown', title: 'Dropdown', Component: DropdownStory }
        ]
    },
    {
        title: 'Feedback',
        pages: [
            { id: 'loader', title: 'Loader', Component: LoaderStory },
            { id: 'toast', title: 'Toast', Component: ToastStory },
            { id: 'skeleton', title: 'Skeleton', Component: SkeletonStory }
        ]
    },
    {
        title: 'Overlays',
        pages: [{ id: 'modal', title: 'Modal', Component: ModalStory }]
    },
    {
        title: 'Chains',
        pages: [
            { id: 'chain-chip', title: 'ChainChip', Component: ChainChipStory },
            { id: 'chain-badge', title: 'ChainBadgeOverlay', Component: ChainBadgeOverlayStory }
        ]
    }
];

const ALL_PAGES = SECTIONS.flatMap(s => s.pages);

const THEME_STORAGE_KEY = 'ui-showcase-theme';
const THEME_LABELS: Record<ColorThemeName, string> = { blue: 'Blue', dark: 'Dark', light: 'Light' };
const THEME_OPTIONS = COLOR_THEMES.map(value => ({ value, label: THEME_LABELS[value] }));

const isThemeName = (value: unknown): value is ColorThemeName =>
    COLOR_THEMES.includes(value as ColorThemeName);

const readStoredTheme = (): ColorThemeName => {
    try {
        const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
        return isThemeName(stored) ? stored : 'blue';
    } catch {
        return 'blue';
    }
};

const useStoredTheme = () => {
    const [theme, setTheme] = useState(readStoredTheme);
    useEffect(() => {
        try {
            window.localStorage.setItem(THEME_STORAGE_KEY, theme);
        } catch {
            // Storage can be blocked; the choice then lasts for the session only.
        }
    }, [theme]);
    return [theme, setTheme] as const;
};

const readHash = () => window.location.hash.replace(/^#\/?/, '') || ALL_PAGES[0].id;

export const App: FC = () => {
    const [pageId, setPageId] = useState(readHash);
    const [colorTheme, setColorTheme] = useStoredTheme();

    useEffect(() => {
        const onHash = () => {
            setPageId(readHash());
            window.scrollTo(0, 0);
        };
        window.addEventListener('hashchange', onHash);
        return () => window.removeEventListener('hashchange', onHash);
    }, []);

    const page = ALL_PAGES.find(p => p.id === pageId) ?? ALL_PAGES[0];

    return (
        <ThemeProvider theme={colorTheme}>
            <div className="flex min-h-screen bg-backgroundPage text-textPrimary">
                <nav className="sticky top-0 flex h-screen w-[240px] shrink-0 flex-col gap-6 overflow-y-auto border-0 border-r border-solid border-separatorCommon px-3 py-6 max-md:hidden">
                    <div className="flex flex-col px-3">
                        <span className="text-h3 text-textPrimary">Keeper UI Kit</span>
                        <span className="text-body3 text-textTertiary">
                            {ALL_PAGES.length - 4} components
                        </span>
                    </div>
                    <SegmentedControl
                        options={THEME_OPTIONS}
                        value={colorTheme}
                        onChange={setColorTheme}
                        className="shrink-0"
                    />
                    {SECTIONS.map(section => (
                        <div key={section.title} className="flex flex-col gap-0.5">
                            <span className="px-3 pb-1 text-body4Caps uppercase text-textTertiary">
                                {section.title}
                            </span>
                            {section.pages.map(p => (
                                <a
                                    key={p.id}
                                    href={`#${p.id}`}
                                    className={cn(
                                        'rounded-extraSmall px-3 py-1.5 text-label2 no-underline transition-colors',
                                        p.id === page.id
                                            ? 'bg-backgroundContentTint text-textPrimary'
                                            : 'text-textSecondary hover:bg-backgroundContent hover:text-textPrimary'
                                    )}
                                >
                                    {p.title}
                                </a>
                            ))}
                        </div>
                    ))}
                </nav>
                <div className="flex min-w-0 grow flex-col">
                    <header className="sticky top-0 z-10 flex items-center gap-3 md:hidden border-0 border-b border-solid border-separatorCommon bg-backgroundTransparent px-8 py-3 backdrop-blur">
                        <select
                            aria-label="Page"
                            className="rounded-extraSmall border-0 bg-backgroundContent px-3 py-2 text-label2 text-textPrimary"
                            value={page.id}
                            onChange={e => (window.location.hash = e.target.value)}
                        >
                            {ALL_PAGES.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.title}
                                </option>
                            ))}
                        </select>
                        <SegmentedControl
                            options={THEME_OPTIONS}
                            value={colorTheme}
                            onChange={setColorTheme}
                            className="ml-auto max-w-[240px]"
                        />
                    </header>
                    <main className="w-full max-w-[1200px] px-8 py-10 max-md:px-4">
                        <page.Component key={page.id} />
                    </main>
                </div>
            </div>
        </ThemeProvider>
    );
};
