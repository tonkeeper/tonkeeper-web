import React, { FC } from 'react';
import styled from 'styled-components';
import { ListBlock, ListItem, ListItemPayload } from '../List';
import { Body1, Label1 } from '../Text';

export interface SettingsItem {
    name: string;
    secondary?: string;
    action: (item: SettingsItem) => void;
    icon: React.ReactNode;
    iconColor?: string;
    preIcon?: React.ReactNode;
}

export interface SettingsListProps {
    items: SettingsItem[];
    loading?: boolean;
}

const Icon = styled(Label1)`
    display: flex;
    margin: -3px 0;
    color: ${props => props.theme.accentBlue};
`;

const Secondary = styled(Body1)`
    color: ${props => props.theme.textSecondary};
`;

const Text = styled.span`
    display: flex;
    align-items: center;
    gap: 0.5rem;
`;

export const SettingsList: FC<SettingsListProps> = React.memo(({ items }) => {
    return (
        <ListBlock>
            {items.map(item => (
                <ListItem key={item.name} onClick={() => item.action(item)}>
                    <ListItemPayload>
                        <Text>
                            {item.preIcon}
                            <Label1>{item.name}</Label1>
                            {item.secondary && <Secondary>{item.secondary}</Secondary>}
                        </Text>
                        <Icon color={item.iconColor}>{item.icon}</Icon>
                    </ListItemPayload>
                </ListItem>
            ))}
        </ListBlock>
    );
});
