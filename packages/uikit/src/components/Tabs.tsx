import React from 'react';
import styled from 'styled-components';
import { Button } from './fields/Button';

const TabsBlock = styled.div`
    display: flex;
    padding: 4px;
    position: relative;
    justify-content: center;
    gap: 3px;
    user-select: none;
    border-radius: ${props => props.theme.corner2xSmall};
    background: ${props => props.theme.backgroundContent};
    width: fit-content;
`;

export function Tabs<T extends string>({
    active,
    values,
    setActive,
    className
}: {
    active: T;
    values: { name: string; id: T }[];
    setActive: (value: T) => void;
    className?: string;
}) {
    return (
        <TabsBlock className={className}>
            {values.map(item => (
                <Button
                    size="small"
                    secondary={item.id !== active}
                    key={item.id}
                    onClick={e => {
                        e.stopPropagation();
                        e.preventDefault();
                        setActive(item.id);
                    }}
                >
                    {item.name}
                </Button>
            ))}
        </TabsBlock>
    );
}
