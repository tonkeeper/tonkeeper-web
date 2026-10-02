import { useColorTheme } from '@tonkeeper/ui-kit';
import { Group, Page } from '../kit';

const RADII = [
    { name: 'extraExtraSmall', className: 'rounded-extraExtraSmall' },
    { name: 'extraSmall', className: 'rounded-extraSmall' },
    { name: 'small', className: 'rounded-small' },
    { name: 'medium', className: 'rounded-medium' },
    { name: 'large', className: 'rounded-large' },
    { name: 'full', className: 'rounded-full' }
];

const cssVar = (name: string) =>
    getComputedStyle(document.documentElement).getPropertyValue(name).trim();

export const RadiiPage = () => {
    // Re-render on theme switch so the resolved values stay current.
    useColorTheme();
    return (
        <Page
            title="Corner radius"
            description="Rounding scale used by the primitives. Use as Tailwind classes, e.g. rounded-medium."
        >
            <Group title="Scale">
                <div className="flex flex-wrap gap-8">
                    {RADII.map(r => {
                        const varName = `--tk-rounding-${r.name
                            .replace(/([A-Z])/g, '-$1')
                            .toLowerCase()}`;
                        return (
                            <div key={r.name} className="flex flex-col gap-3">
                                <div
                                    className={`${r.className} h-20 w-20 border-2 border-solid border-accentBlue bg-backgroundContentTint`}
                                />
                                <span className="font-mono text-body3 text-textPrimary">
                                    rounded-{r.name}
                                </span>
                                <span className="font-mono text-body3 text-textTertiary">
                                    {cssVar(varName) || '—'}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </Group>
        </Page>
    );
};
