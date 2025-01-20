import { css } from 'styled-components';

export const IonicOverride = css`
    ion-content {
        --background: ${p => p.theme.backgroundPage} !important;
        --color: ${p => p.theme.textPrimary};
        --ion-font-family: '-apple-system', BlinkMacSystemFont, Roboto, 'Helvetica Neue', Arial,
            Tahoma, Verdana, 'sans-serif';

        * {
            box-sizing: content-box;
        }
    }
`;
