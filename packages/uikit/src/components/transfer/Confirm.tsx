import styled from 'styled-components';
import { Body1, Body2, H3 } from '../Text';
import { Image } from '../shared/Image';

export const Info = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 1rem;
`;

export const ConfirmViewImage = styled(Image)<{ full?: boolean }>`
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

export const UnverifiedTokenLabel = styled(Body2)`
    color: ${p => p.theme.accentOrange};
`;
