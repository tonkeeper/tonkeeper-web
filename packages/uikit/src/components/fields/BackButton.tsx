import styled from 'styled-components';

export const ButtonMock = styled.div`
  flex-shrink: 0;

  cursor: pointer;
  width: 2rem;
  height: 2rem;
`;

export const BackButton = styled(ButtonMock)`
  border-radius: ${(props) => props.theme.cornerFull};
  color: ${(props) => props.theme.textPrimary};
  background: ${(props) => props.theme.backgroundContent};
  display: flex;
  justify-content: center;
  align-items: center;

  &:hover {
    background: ${(props) => props.theme.backgroundContentTint};
  }
`;
