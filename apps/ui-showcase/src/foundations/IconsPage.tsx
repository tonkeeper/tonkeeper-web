import { ComponentType, SVGProps, useMemo, useState } from 'react';
import { SearchField } from '@tonkeeper/ui-kit';
import { Group, Page } from '../kit';

type IconModule = { default: ComponentType<SVGProps<SVGSVGElement>> };

const modules = import.meta.glob<IconModule>(
    '../../../../packages/ui-kit/src/icons/components/*.tsx',
    { eager: true }
);

const ICONS = Object.entries(modules)
    .map(([file, mod]) => ({
        name: file
            .split('/')
            .pop()!
            .replace(/\.tsx$/, ''),
        Icon: mod.default
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

const sizeOf = (name: string) => {
    const match = name.match(/(\d+)(Color)?$/);
    return match ? Number(match[1]) : 0;
};

const PREVIEW_CAP = 56;

export const IconsPage = () => {
    const [query, setQuery] = useState('');
    const groups = useMemo(() => {
        const q = query.trim().toLowerCase();
        const visible = ICONS.filter(i => i.name.toLowerCase().includes(q));
        const bySize = new Map<number, typeof ICONS>();
        visible.forEach(icon => {
            const size = sizeOf(icon.name);
            bySize.set(size, [...(bySize.get(size) ?? []), icon]);
        });
        return [...bySize.entries()].sort(([a], [b]) => a - b);
    }, [query]);

    return (
        <Page
            title="Icons"
            description={`${ICONS.length} icons, grouped by size. Each is its own component — import only what you use. Icons inherit the text colour.`}
            importLine="import IcPlus28 from '@tonkeeper/ui-kit/icons/IcPlus28'"
        >
            <div className="-mx-4 max-w-[420px]">
                <SearchField value={query} onChange={setQuery} placeholder="Search icons" />
            </div>
            {groups.map(([size, icons]) => (
                <Group key={size} title={size ? `${size}px` : 'Other'}>
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2">
                        {icons.map(({ name, Icon }) => {
                            const px = Math.min(size || 28, PREVIEW_CAP);
                            return (
                                <div
                                    key={name}
                                    className="flex flex-col items-center gap-3 rounded-small px-2 py-4 text-iconPrimary hover:bg-backgroundContentTint"
                                >
                                    <div className="flex h-14 items-center justify-center">
                                        <Icon width={px} height={px} />
                                    </div>
                                    <span className="break-all text-center font-mono text-body3 text-textSecondary">
                                        {name}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </Group>
            ))}
        </Page>
    );
};
