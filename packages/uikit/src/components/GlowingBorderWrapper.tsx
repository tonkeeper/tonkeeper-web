import { styled } from 'styled-components';

export const GlowingBorderWrapper = styled.div(
    ({ theme }) => `
    position: relative;
    border-radius: 8px;
    padding: 2px;
    background: linear-gradient(130deg, ${theme.buttonPrimaryBackground}, transparent, ${theme.buttonPrimaryBackground}, transparent);
    background-size: 300% 300%;
    animation: borderShift 10s linear infinite;

    @keyframes borderShift {
        1% {
            background-position: 0 0;
        }
        33% {
            background-position: 50% 100%;
        }
        50% {
            background-position: 100% 50%;
        }
        75% {
            background-position: 50% 0%;
        }
        100% {
            background-position: 0 0;
        }
    }
`
);
