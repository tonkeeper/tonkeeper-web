import React from 'react';
import styled from 'styled-components';
import { ClockIcon } from '../Icon';
import { ListBlock } from '../List';
import { H3 } from '../Text';

export const Group = styled.div`
    margin-bottom: 1.875rem;
`;
export const List = styled(ListBlock)`
    margin: 0.5rem 0;
`;

export const Title = styled(H3)`
    margin: 0 0 0.875rem;
    user-select: none;
`;

export const ProgressWrapper = styled.div`
    position: absolute;
    left: 45px;
    top: 45px;
    color: ${props => props.theme.iconSecondary};
    padding: 0 !important;
`;

export const ProgressIcon = () => {
    return (
        <ProgressWrapper>
            <ClockIcon />
        </ProgressWrapper>
    );
};
