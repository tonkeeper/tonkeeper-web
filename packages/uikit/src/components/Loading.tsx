import React from 'react';
import styled from 'styled-components';
import { TonkeeperIcon } from './Icon';

const Block = styled.div`
    height: 100vh;

    display: flex;
    justify-content: center;
    align-items: center;

    background-color: ${props => props.theme.backgroundPage};

    color: ${props => props.theme.accentBlue};
`;

export const Loading = React.forwardRef<HTMLDivElement>(({}, ref) => {
    return (
        <Block ref={ref}>
            <TonkeeperIcon loop />
        </Block>
    );
});
