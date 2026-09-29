import { Button, ButtonSize, ButtonVariant } from '@tonkeeper/ui-kit';
import IcSnowflake16 from '@tonkeeper/ui-kit/icons/IcSnowflake16';
import IcPlus16 from '@tonkeeper/ui-kit/icons/IcPlus16';
import { Cell, Cells, Group, Matrix, Page } from '../kit';

const VARIANTS: ButtonVariant[] = [
    'primaryBlue',
    'primaryGreen',
    'primaryRed',
    'secondary',
    'tertiary',
    'destructive',
    'overlay'
];
const SIZES: ButtonSize[] = ['small', 'medium', 'large'];
const STATES = ['default', 'disabled', 'loading'] as const;

export const ButtonStory = () => (
    <Page
        title="Button"
        description="Text button in seven colour variants and three sizes. Hover a button to see its highlighted state."
        importLine="import { Button } from '@tonkeeper/ui-kit'"
    >
        <Group title="Variant × state" note="size=medium">
            <Matrix
                rows={VARIANTS}
                columns={STATES}
                render={(variant, state) => (
                    <Button
                        variant={variant}
                        disabled={state === 'disabled'}
                        loading={state === 'loading'}
                    >
                        Label
                    </Button>
                )}
            />
        </Group>
        <Group title="Variant × size">
            <Matrix
                rows={VARIANTS}
                columns={SIZES}
                render={(variant, size) => (
                    <Button variant={variant} size={size}>
                        Label
                    </Button>
                )}
            />
        </Group>
        <Group title="Icons" note="leftIcon / rightIcon take any 16px icon">
            <Matrix
                rows={SIZES}
                columns={['leftIcon', 'rightIcon', 'icon only'] as const}
                render={(size, kind) =>
                    kind === 'icon only' ? (
                        <Button variant="secondary" size={size} leftIcon={<IcPlus16 />} />
                    ) : (
                        <Button
                            variant="secondary"
                            size={size}
                            leftIcon={kind === 'leftIcon' ? <IcSnowflake16 /> : undefined}
                            rightIcon={kind === 'rightIcon' ? <IcSnowflake16 /> : undefined}
                        >
                            Label
                        </Button>
                    )
                }
            />
        </Group>
        <Group title="Full width" note="fullWidth stretches to the container">
            <Cells className="max-w-[420px] flex-col">
                <Cell label="large · primaryBlue" className="w-full">
                    <Button variant="primaryBlue" size="large" fullWidth>
                        Continue
                    </Button>
                </Cell>
                <Cell label="large · secondary" className="w-full">
                    <Button variant="secondary" size="large" fullWidth>
                        Cancel
                    </Button>
                </Cell>
            </Cells>
        </Group>
    </Page>
);
