import React, { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { css } from 'styled-components';
import { BackButton } from './fields/BackButton';
import { useIsScrollTop } from './Header';
import { ChevronLeftIcon } from './Icon';
import { H3 } from './Text';

const Block = styled.div<{ top: boolean }>`
  flex-shrink: 0;

  padding: 1rem;

  display: flex;
  justify-content: center;
  position: relative;

  position: fixed;
  width: var(--app-width);
  top: -1px;

  background: ${(props) => props.theme.backgroundPage};

  margin: 0 -1rem;

  height: 31px;

  ${(props) =>
    !props.top &&
    css`
      &:after {
        content: '';
        display: block;
        width: 100%;
        height: 1px;
        background: ${(props) => props.theme.separatorCommon};
        position: absolute;
        top: 100%;
        left: 0;
      }
    `}
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
  const top = useIsScrollTop();
  return (
    <Block top={top}>
      <BackButtonLeft onClick={() => navigate(-1)}>
        <ChevronLeftIcon />
      </BackButtonLeft>
      <Title>{title}</Title>
    </Block>
  );
};
