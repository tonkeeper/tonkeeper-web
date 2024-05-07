import React, { FC } from 'react';
import styled, { css } from 'styled-components';
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
    className?: string;
    isDisabled?: boolean;
    loading?: boolean;
}

const Icon = styled(Label1)<{ color?: string }>`
    display: flex;
    margin: -3px 0;
    color: ${props => props.color ?? props.theme.accentBlue};
`;

const Secondary = styled(Body1)`
    color: ${props => props.theme.textSecondary};
`;

const Text = styled.span`
    display: flex;
    align-items: center;
    gap: 0.5rem;
`;

const ListBlockStyled = styled(ListBlock)<{ isDisabled?: boolean }>`
    ${p =>
        p.isDisabled &&
        css`
            opacity: 0.6;

            & > * {
                cursor: not-allowed;
            }
        `}
`;

export const SettingsList: FC<SettingsListProps> = React.memo(
    ({ items, className, isDisabled }) => {
        return (
            <ListBlockStyled isDisabled={isDisabled} className={className}>
                {items.map(item => (
                    <ListItem
                        hover={!isDisabled}
                        key={item.name}
                        onClick={() => {
                            if (!isDisabled) {
                                item.action(item);
                            }
                        }}
                    >
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
            </ListBlockStyled>
        );
    }
);
