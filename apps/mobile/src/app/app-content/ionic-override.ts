import { css } from 'styled-components';

export const IonicOverride = css`
    :root {
        --ion-modal-default-height: calc(100% - (env(safe-area-inset-top) + 10px));
    }

    ion-content {
        --background: ${p => p.theme.backgroundPage} !important;
        --color: ${p => p.theme.textPrimary};
        --ion-font-family: '-apple-system', BlinkMacSystemFont, Roboto, 'Helvetica Neue', Arial,
            Tahoma, Verdana, 'sans-serif';

        * {
            box-sizing: content-box;
        }

        &::part(scroll) {
            scrollbar-width: none;

            &::-webkit-scrollbar {
                display: none;
            }
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

        &[side='end']::part(container) {
            border-radius: ${p => p.theme.cornerSmall} 0 0 ${p => p.theme.cornerSmall};
        }
    }

    ion-modal {
        --height: auto;

        &::part(content) {
            background: transparent;
        }

        .ion-page {
            max-height: calc(100vh - 20px - env(safe-area-inset-top));
            position: relative;
            contain: content;
        }
    }
`;
