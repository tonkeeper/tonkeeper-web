import styled, { css } from 'styled-components';

export const ScrollContainer = styled.div<{ thumbColor?: string }>`
    overflow: auto;

    ${p =>
        (p.theme.os === 'windows' || p.theme.os === 'linux') &&
        css`
            &:hover {
                &::-webkit-scrollbar-thumb {
                    background-color: ${p.thumbColor || p.theme.backgroundPage};
                }
            }

            &::-webkit-scrollbar {
                -webkit-appearance: none;
                width: 5px;
                background-color: transparent;
            }

            &::-webkit-scrollbar-track {
                background-color: transparent;
            }

            &::-webkit-scrollbar-thumb {
                border-radius: 4px;
                background-color: transparent;
            }
        `}
`;
