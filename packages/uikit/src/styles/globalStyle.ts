import styled, { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
body {
  margin: 0;
  font-family: 'Montserrat', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: ${(props) => props.theme.backgroundContent};
  color:  ${(props) => props.theme.textPrimary};

  overflow-y: scroll;
}

:root {
  --app-height: 100vh;
  --app-width: 100vw;
 } 

  html.is-locked,
  html.is-locked body,
  html.is-locked #root {
      /* want to fix the height to the window height 
      height: calc(var(--app-height) - 1px);*/

      /* want to block all overflowing content */
      overflow: hidden;

      /* want to exclude padding from the height */
      box-sizing: border-box;
  }

  html.is-locked #root div {
    overflow: hidden;
  }


  .disable-hover {
    pointer-events: none;
  }
`;

export const Container = styled.div`
  min-width: 300px;
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
