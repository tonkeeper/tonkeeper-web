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

    ion-menu {
        --width: 256px;
        outline: none;

        &::part(container) {
            background-color: ${p => p.theme.backgroundContent};
            border-top-right-radius: ${p => p.theme.cornerSmall};
            border-bottom-right-radius: ${p => p.theme.cornerSmall};
        }
    }
`;
