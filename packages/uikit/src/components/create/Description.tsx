import React, { FC } from 'react';
import styled from 'styled-components';
import { Body2, Label1 } from '../Text';

interface DescriptionProps {
    icon: JSX.Element;
    title: string;
    description: string;
}

const Block = styled.div`
    display: flex;
    gap: 1rem;
    margin-bottom: 1.5rem;
`;

const Icon = styled.div`
    flex-shrink: 0;
    color: ${props => props.theme.accentBlue};
`;

const Text = styled.div`
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
`;

const Title = styled(Label1)`
    display: block;
    user-select: none;
`;

const Body = styled(Body2)`
    display: block;
    color: ${props => props.theme.textSecondary};
    user-select: none;
`;

export const Description: FC<DescriptionProps> = ({ icon, title, description }) => {
    return (
        <Block>
            <Icon>{icon}</Icon>
            <Text>
                <Title>{title}</Title>
                <Body>{description}</Body>
            </Text>
        </Block>
    );
};
