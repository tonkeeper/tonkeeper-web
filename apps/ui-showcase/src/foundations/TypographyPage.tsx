import { Group, Page } from '../kit';

// Class names are spelled out so Tailwind's scanner generates them.
const SCALE = [
    { name: 'num1', className: 'text-num1', spec: '44 / 56 · 500' },
    { name: 'num2', className: 'text-num2', spec: '32 / 40 · 500' },
    { name: 'num3', className: 'text-num3', spec: '28 / 36 · 500' },
    { name: 'h1', className: 'text-h1', spec: '32 / 40 · 600' },
    { name: 'h2', className: 'text-h2', spec: '24 / 32 · 600' },
    { name: 'h3', className: 'text-h3', spec: '20 / 28 · 600' },
    { name: 'label1', className: 'text-label1', spec: '16 / 24 · 500 · 0.5%' },
    { name: 'label2', className: 'text-label2', spec: '14 / 20 · 500 · 0.5%' },
    { name: 'label3', className: 'text-label3', spec: '12 / 16 · 500 · 1%' },
    { name: 'body1', className: 'text-body1', spec: '16 / 24 · 450 · 0.5%' },
    { name: 'body2', className: 'text-body2', spec: '14 / 20 · 450 · 0.5%' },
    { name: 'body3Alt', className: 'text-body3Alt', spec: '13 / 16 · 450 · 1%' },
    { name: 'body3', className: 'text-body3', spec: '12 / 16 · 450 · 1%' },
    { name: 'body4Caps', className: 'text-body4Caps uppercase', spec: '10 / 14 · 500 · 1%' }
];

export const TypographyPage = () => (
    <Page
        title="Typography"
        description="TT Firs Neue in three drawn weights (450 / 500 / 600). Size / line height · weight · tracking. Use as Tailwind classes, e.g. text-label1."
    >
        <Group title="Type scale">
            <div className="flex flex-col divide-x-0 divide-y divide-solid divide-separatorCommon">
                {SCALE.map(step => (
                    <div
                        key={step.name}
                        className="grid grid-cols-[140px_1fr] items-baseline gap-6 py-4 first:pt-0 last:pb-0"
                    >
                        <div className="flex flex-col">
                            <span className="font-mono text-body3 text-textPrimary">
                                text-{step.name}
                            </span>
                            <span className="font-mono text-body3 text-textTertiary">
                                {step.spec}
                            </span>
                        </div>
                        <span className={`${step.className} truncate text-textPrimary`}>
                            {step.name.startsWith('num')
                                ? '12,480.55'
                                : 'Send crypto to anyone, instantly'}
                        </span>
                    </div>
                ))}
            </div>
        </Group>
    </Page>
);
