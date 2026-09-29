import { COLOR_TOKEN_GROUPS, COLOR_TOKENS, ColorToken, useColorTheme } from '@tonkeeper/ui-kit';
import { Group, Page } from '../kit';

const TOKENS = Object.keys(COLOR_TOKENS) as ColorToken[];

export const ColorsPage = () => {
    const { palette } = useColorTheme();

    return (
        <Page
            title="Colors"
            description="Semantic colour tokens of the active theme. Use them as Tailwind classes — bg-backgroundContent, text-textSecondary, border-separatorCommon."
        >
            {COLOR_TOKEN_GROUPS.map(group => (
                <Group key={group} title={group}>
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
                        {TOKENS.filter(token => COLOR_TOKENS[token].group === group).map(token => (
                            <div key={token} className="flex items-center gap-3">
                                <div
                                    className="h-10 w-10 shrink-0 rounded-full border border-solid border-separatorCommon"
                                    style={{ background: palette[token] }}
                                />
                                <div className="flex min-w-0 flex-col">
                                    <span className="truncate text-label2 text-textPrimary">
                                        {COLOR_TOKENS[token].name}
                                    </span>
                                    <span className="truncate font-mono text-body3 text-textTertiary">
                                        {token} · {palette[token].toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </Group>
            ))}
        </Page>
    );
};
