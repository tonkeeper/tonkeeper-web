import React, { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { createGlobalStyle } from 'styled-components';
import { ChevronLeftIcon } from './Icon';
import { H3 } from './Text';
import { BackButton } from './fields/BackButton';

const Block = styled.div`
    flex-shrink: 0;

    padding: 1rem;
    box-sizing: border-box;
    display: flex;
    justify-content: center;
    position: relative;

    position: fixed;
    z-index: 3;
    width: var(--app-width);
    overflow: visible !important;
    max-width: 548px;
    top: 0;

    background: ${props => props.theme.backgroundPage};
`;

export const SybHeaderGlobalStyle = createGlobalStyle`
  body:not(.top) ${Block} {
    &:after {
      content: '';
      display: block;
      width: 100%;
      height: 1px;
      background: ${props => props.theme.separatorCommon};
      position: absolute;
      top: 100%;
      left: 0;
    }
  }
`;

export const BackButtonLeft = styled(BackButton)`
    position: absolute;
    top: 50%;
    margin-top: -1rem;
    left: 1rem;
`;

export interface SubHeaderProps {
    title: React.ReactNode;
}

const Title = styled(H3)`
    margin-top: 1px;
    margin-bottom: 2px;
`;

export const SubHeader: FC<SubHeaderProps> = ({ title }) => {
    const navigate = useNavigate();
    return (
        <Block>
            <BackButtonLeft onClick={() => navigate(-1)}>
                <ChevronLeftIcon />
            </BackButtonLeft>
            <Title>{title}</Title>
        </Block>
    );
};
