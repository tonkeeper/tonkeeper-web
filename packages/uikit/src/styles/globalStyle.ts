import styled, { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
body {
  margin: 0;
  font-family: 'Montserrat', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: ${(props) => props.theme.backgroundContent};
  color:  ${(props) => props.theme.textPrimary};


}

:root {
  --app-height: 100vh;
 } 
`;

export const Container = styled.div`
  min-width: 375px;
  max-width: 550px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  min-height: var(--app-height);
  background-color: ${(props) => props.theme.backgroundPage};

  white-space: pre-wrap;
`;

export const Body = styled.div`
  flex-grow: 1;
  padding: 0 1rem;
`;
