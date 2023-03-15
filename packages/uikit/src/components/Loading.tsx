import React from 'react';
import styled from 'styled-components';
import { TonkeeperIcon } from './Icon';

const Block = styled.div`
  height: var(--app-height);

  display: flex;
  justify-content: center;
  align-items: center;
`;

export const Loading = React.forwardRef<HTMLDivElement>(({}, ref) => {
  return (
    <Block ref={ref}>
      <TonkeeperIcon loop />
    </Block>
  );
});
