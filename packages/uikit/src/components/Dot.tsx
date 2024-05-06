import { FC } from 'react';
import styled from 'styled-components';
import { Body3 } from './Text';

const Body3Styled = styled(Body3)`
    color: ${p => p.theme.textTertiary};
`;

export const Dot: FC<{ className?: string }> = ({ className }) => {
    return <Body3Styled className={className}>&nbsp;·&nbsp;</Body3Styled>;
};
