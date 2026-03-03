import React from 'react';
import { styled } from 'styled-components';
import { StakingIcon } from '../Icon';
import { Action } from './Actions';
import { useNavigate } from '../../hooks/router/useNavigate';
import { AppRoute } from '../../libs/routes';

const StakingIconStyled = styled(StakingIcon)`
    height: 24px;
    width: 24px;
    color: ${p => p.theme.iconPrimary};
`;

export const StakeAction = () => {
    const navigate = useNavigate();

    const onAction = () => {
        navigate(AppRoute.staking);
    };

    return <Action icon={<StakingIconStyled />} title={'staking_top_up'} action={onAction} />;
};
