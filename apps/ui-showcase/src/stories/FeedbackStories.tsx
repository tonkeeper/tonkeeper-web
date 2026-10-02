import { Loader, LoaderSize, Toast } from '@tonkeeper/ui-kit';
import { Cell, Cells, Group, Matrix, Page, noop } from '../kit';

const LOADER_SIZES: LoaderSize[] = ['xSmall', 'small', 'medium'];

export const LoaderStory = () => (
    <Page
        title="Loader"
        description="Spinner in three sizes. Takes the current text colour, so tint it with a text-colour class."
        importLine="import { Loader } from '@tonkeeper/ui-kit'"
    >
        <Group title="Size × colour">
            <Matrix
                rows={LOADER_SIZES}
                columns={['textPrimary', 'iconSecondary', 'accentBlue'] as const}
                columnHeader={c => `text-${c}`}
                render={(size, colour) => (
                    <Loader
                        size={size}
                        className={
                            colour === 'textPrimary'
                                ? 'text-textPrimary'
                                : colour === 'iconSecondary'
                                ? 'text-iconSecondary'
                                : 'text-accentBlue'
                        }
                    />
                )}
            />
        </Group>
    </Page>
);

export const ToastStory = () => (
    <Page
        title="Toast"
        description="Short confirmation shown over the page. The loading variant carries a spinner; the action variant adds a button and stretches to its container."
        importLine="import { Toast } from '@tonkeeper/ui-kit'"
    >
        <Group title="Variants">
            <Cells>
                <Cell label="size=small">
                    <Toast text="Copied" size="small" />
                </Cell>
                <Cell label="size=medium">
                    <Toast text="Transaction sent" size="medium" />
                </Cell>
                <Cell label="loading">
                    <Toast text="Sending…" loading />
                </Cell>
            </Cells>
        </Group>
        <Group title="Action" note="action={{ label, onClick }} · fills the container width">
            <Cells className="max-w-[390px] flex-col">
                <Cell label="action" className="w-full">
                    <Toast
                        text="Disconnect “Mercuryo”?"
                        action={{ label: 'Disconnect', onClick: noop }}
                    />
                </Cell>
                <Cell label="action · long text truncates" className="w-full">
                    <Toast
                        text="Disconnect “Mercuryo” and every other app linked to this wallet?"
                        action={{ label: 'Disconnect', onClick: noop }}
                    />
                </Cell>
            </Cells>
        </Group>
        <Group title="Long text" note="Wraps at 358px">
            <Cells>
                <Cell label="size=small">
                    <Toast
                        text="The address was copied to the clipboard. Paste it in the app you are sending from."
                        size="small"
                    />
                </Cell>
                <Cell label="size=medium">
                    <Toast
                        text="The address was copied to the clipboard. Paste it in the app you are sending from."
                        size="medium"
                    />
                </Cell>
            </Cells>
        </Group>
    </Page>
);
