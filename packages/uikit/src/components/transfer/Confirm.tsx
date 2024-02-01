import styled from 'styled-components';
import { Body1, H3 } from '../Text';

export const Info = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 1rem;
`;

export const Image = styled.img<{ full?: boolean }>`
    width: 96px;
    height: 96px;
    border-radius: ${props => (props.full ? props.theme.cornerFull : props.theme.cornerMedium)};
`;

export const ImageMock = styled.div<{ full?: boolean }>`
    width: 96px;
    height: 96px;
    border-radius: ${props => (props.full ? props.theme.cornerFull : props.theme.cornerMedium)};
    background: ${props => props.theme.backgroundContent};
`;

export const SendingTitle = styled(Body1)`
    user-select: none;
    color: ${props => props.theme.textSecondary};
    margin: 20px 0 4px;
`;

export const Title = styled(H3)`
    user-select: none;
    text-align: center;
`;
