import LottieReact from 'lottie-react';
import styled from 'styled-components';

export const Lottie = styled(LottieReact)<{ height: number | string; width: number | string }>`
    ${p => p.height && `height: ${parseInt(p.height.toString())}px;`}
    ${p => p.width && `width: ${parseInt(p.width.toString())}px;`}
`;
